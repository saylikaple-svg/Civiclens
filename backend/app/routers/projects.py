from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth, prediction

router = APIRouter(prefix="/api/projects", tags=["Projects"])

@router.get("", response_model=List[schemas.ProjectResponse])
def get_projects(
    search: Optional[str] = Query(None, description="Search by name or project code"),
    state: Optional[str] = Query(None),
    department_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Project)
    
    # Apply filters
    if search:
        query = query.filter(
            (models.Project.name.ilike(f"%{search}%")) | 
            (models.Project.project_code.ilike(f"%{search}%"))
        )
    if state:
        query = query.filter(models.Project.state == state)
    if department_id:
        query = query.filter(models.Project.department_id == department_id)
    if status:
        query = query.filter(models.Project.status == status)
    if risk_level:
        query = query.filter(models.Project.risk_level == risk_level)
        
    # Enforce RBAC: Project Manager can only see their department's projects if restricted,
    # but for a national dashboard, all users can view projects, but only edit their own.
    # We will let all users read all projects, but restrict writes.
    
    return query.all()

@router.get("/{project_id}", response_model=schemas.ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("", response_model=schemas.ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_manager_or_above)
):
    # Verify code uniqueness
    existing = db.query(models.Project).filter(models.Project.project_code == project_in.project_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Project code already exists")
        
    # Department validation
    dept = db.query(models.Department).filter(models.Department.id == project_in.department_id).first()
    if not dept:
        raise HTTPException(status_code=400, detail="Department not found")
        
    db_project = models.Project(
        **project_in.model_dump(),
        created_by=current_user.id
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    # Audit log
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="Project Created",
        entity_type="project",
        entity_id=db_project.id,
        details=f"Project {db_project.project_code} - {db_project.name} created."
    ))
    db.commit()
    
    return db_project

@router.put("/{project_id}", response_model=schemas.ProjectResponse)
def update_project(
    project_id: int,
    project_in: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_manager_or_above)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Enforce permission checks: PROJECT_MANAGER can only update if it is in their department
    if current_user.role == "PROJECT_MANAGER" and project.department_id != current_user.department_id:
        raise HTTPException(
            status_code=403,
            detail="You can only manage projects belonging to your department"
        )
        
    data = project_in.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(project, key, value)
        
    # Recalculate financial progress dynamically if budget or spent changed
    if project.budget > 0:
        project.financial_progress = round((project.amount_spent / project.budget) * 100, 2)
        
    project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(project)
    
    # Generate Automatic Alerts if anomalies exist after update
    trigger_anomaly_detection(project, db)
    
    # Audit log
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="Project Updated",
        entity_type="project",
        entity_id=project.id,
        details=f"Project {project.project_code} details updated."
    ))
    db.commit()
    
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_super_admin)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    db.delete(project)
    
    # Audit log
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="Project Deleted",
        entity_type="project",
        entity_id=project_id,
        details=f"Project {project.project_code} deleted."
    ))
    db.commit()
    
    return None

# --- AI DELAY PREDICTION ROUTE ---
@router.get("/{project_id}/predict-delay")
def get_delay_prediction(
    project_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    prediction_result = prediction.predict_delay(project, db)
    return prediction_result

# --- MILESTONES MANAGEMENT ---
@router.post("/{project_id}/milestones", response_model=schemas.MilestoneResponse)
def add_milestone(
    project_id: int,
    milestone_in: schemas.MilestoneCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_manager_or_above)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    db_milestone = models.Milestone(
        **milestone_in.model_dump(),
        project_id=project_id
    )
    db.add(db_milestone)
    db.commit()
    db.refresh(db_milestone)
    
    # Audit log
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="Milestone Created",
        entity_type="milestone",
        entity_id=db_milestone.id,
        details=f"Milestone '{db_milestone.name}' added to project {project.project_code}."
    ))
    db.commit()
    
    return db_milestone

@router.put("/milestones/{milestone_id}", response_model=schemas.MilestoneResponse)
def update_milestone(
    milestone_id: int,
    milestone_in: schemas.MilestoneUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_manager_or_above)
):
    milestone = db.query(models.Milestone).filter(models.Milestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
        
    data = milestone_in.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(milestone, key, value)
        
    db.commit()
    db.refresh(milestone)
    
    # Re-evaluate project alerts (milestone delay alert check)
    project = milestone.project
    trigger_anomaly_detection(project, db)
    
    # Audit log
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="Milestone Updated",
        entity_type="milestone",
        entity_id=milestone.id,
        details=f"Milestone '{milestone.name}' status set to {milestone.status}."
    ))
    db.commit()
    
    return milestone

# --- AUTOMATIC ANOMALY DETECTION ENGINE ---
def trigger_anomaly_detection(project: models.Project, db: Session):
    """
    Checks for project irregularities (financial, milestone, delays) and logs Alerts.
    """
    now = datetime.utcnow()
    
    # 1. Budget Disparity Anomaly (Progress low, Budget spent high)
    if project.budget > 0:
        budget_utilization = (project.amount_spent / project.budget) * 100
        if budget_utilization > project.progress + 15:
            # Check if alert already exists to prevent duplicate spamming
            existing_alert = db.query(models.Alert).filter(
                models.Alert.project_id == project.id,
                models.Alert.type == "Budget",
                models.Alert.status == "unread"
            ).first()
            
            if not existing_alert:
                alert = models.Alert(
                    project_id=project.id,
                    type="Budget",
                    severity="Critical" if budget_utilization > project.progress + 30 else "High",
                    message=f"Potential Financial Anomaly: Budget spent is {budget_utilization:.1f}% (₹{project.amount_spent} Cr) but physical progress is only {project.progress:.1f}%. Progress-expenditure disparity: {budget_utilization - project.progress:.1f}%."
                )
                db.add(alert)
                
    # 2. Overdue Milestones Check
    overdue_milestones = db.query(models.Milestone).filter(
        models.Milestone.project_id == project.id,
        models.Milestone.status != "Completed",
        models.Milestone.planned_date < now
    ).all()
    
    for ms in overdue_milestones:
        existing_alert = db.query(models.Alert).filter(
            models.Alert.project_id == project.id,
            models.Alert.type == "Milestone",
            models.Alert.message.contains(ms.name),
            models.Alert.status == "unread"
        ).first()
        
        if not existing_alert:
            days_overdue = (now - ms.planned_date).days
            alert = models.Alert(
                project_id=project.id,
                type="Milestone",
                severity="High" if days_overdue > 30 else "Medium",
                message=f"Schedule Variance Alert: Milestone '{ms.name}' is overdue by {days_overdue} days (planned deadline was {ms.planned_date.strftime('%Y-%m-%d')})."
            )
            db.add(alert)
            
    # 3. Predict overall delay score
    pred = prediction.predict_delay(project, db)
    if pred["risk_score"] > 75:
        existing_alert = db.query(models.Alert).filter(
            models.Alert.project_id == project.id,
            models.Alert.type == "Risk",
            models.Alert.status == "unread"
        ).first()
        
        if not existing_alert:
            alert = models.Alert(
                project_id=project.id,
                type="Risk",
                severity="Critical" if pred["risk_score"] > 85 else "High",
                message=f"AI Delay Risk Alert: Project has a {pred['risk_score']}% probability of serious delay, with a predicted delay of {pred['expected_delay']} days."
            )
            db.add(alert)
            
    db.commit()
