from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("", response_model=List[schemas.AlertResponse])
def get_alerts(
    status: Optional[str] = Query(None, description="Filter by status: read, unread"),
    severity: Optional[str] = Query(None, description="Filter by severity: Low, Medium, High, Critical"),
    project_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Alert).join(models.Project)
    
    if status:
        query = query.filter(models.Alert.status == status)
    if severity:
        query = query.filter(models.Alert.severity == severity)
    if project_id:
        query = query.filter(models.Alert.project_id == project_id)
        
    # Sort by newest first
    query = query.order_by(models.Alert.created_at.desc())
    
    alerts = query.all()
    
    # Inject project names dynamically for the schema
    result = []
    for a in alerts:
        res = schemas.AlertResponse.model_validate(a)
        res.project_name = a.project.name
        res.project_code = a.project.project_code
        result.append(res)
        
    return result

@router.put("/{alert_id}/read", response_model=schemas.AlertResponse)
def mark_alert_as_read(alert_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.status = "read"
    db.commit()
    db.refresh(alert)
    
    res = schemas.AlertResponse.model_validate(alert)
    res.project_name = alert.project.name
    res.project_code = alert.project.project_code
    return res

@router.put("/read-all")
def mark_all_alerts_read(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    unread_alerts = db.query(models.Alert).filter(models.Alert.status == "unread").all()
    for a in unread_alerts:
        a.status = "read"
    db.commit()
    return {"message": f"Successfully marked {len(unread_alerts)} alerts as read."}
