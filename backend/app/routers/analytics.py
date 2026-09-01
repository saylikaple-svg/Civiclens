from typing import Dict, List, Any
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, auth

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/kpis")
def get_kpis(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Computes real-time project metrics across the nation
    """
    total_projects = db.query(models.Project).count()
    ongoing = db.query(models.Project).filter(models.Project.status.in_(["In Progress", "Planning"])).count()
    completed = db.query(models.Project).filter(models.Project.status == "Completed").count()
    delayed = db.query(models.Project).filter(models.Project.status == "Delayed").count()
    
    # Calculate Risk levels
    high_risk = db.query(models.Project).filter(models.Project.risk_level.in_(["High", "Critical"])).count()
    
    # Financial metrics
    total_budget_sum = db.query(func.sum(models.Project.budget)).scalar() or 0.0
    total_spent_sum = db.query(func.sum(models.Project.amount_spent)).scalar() or 0.0
    
    budget_utilization_pct = 0.0
    if total_budget_sum > 0:
        budget_utilization_pct = round((total_spent_sum / total_budget_sum) * 100, 2)
        
    return {
        "total_projects": total_projects,
        "ongoing": ongoing,
        "completed": completed,
        "delayed": delayed,
        "high_risk": high_risk,
        "total_budget_cr": round(total_budget_sum, 2),
        "total_spent_cr": round(total_spent_sum, 2),
        "budget_utilization_pct": budget_utilization_pct
    }

@router.get("/map")
@router.get("/states")
def get_map_analytics(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Aggregates projects state-wise. Returns details needed for interactive India Map
    """
    projects = db.query(models.Project).all()
    
    state_data: Dict[str, Dict[str, Any]] = {}
    
    for p in projects:
        state = p.state
        if state not in state_data:
            state_data[state] = {
                "state": state,
                "total_projects": 0,
                "ongoing": 0,
                "completed": 0,
                "delayed": 0,
                "high_risk": 0,
                "total_budget": 0.0,
                "total_spent": 0.0,
                "projects_list": []
            }
            
        stats = state_data[state]
        stats["total_projects"] += 1
        
        if p.status in ["In Progress", "Planning"]:
            stats["ongoing"] += 1
        elif p.status == "Completed":
            stats["completed"] += 1
        elif p.status == "Delayed":
            stats["delayed"] += 1
            
        if p.risk_level in ["High", "Critical"]:
            stats["high_risk"] += 1
            
        stats["total_budget"] += p.budget
        stats["total_spent"] += p.amount_spent
        
        # Add basic project info
        stats["projects_list"].append({
            "id": p.id,
            "code": p.project_code,
            "name": p.name,
            "status": p.status,
            "risk_level": p.risk_level,
            "progress": p.progress,
            "budget": p.budget,
            "spent": p.amount_spent
        })
        
    # Calculate state budget utilization percentages and round values
    result = []
    for state, stats in state_data.items():
        utilization = 0.0
        if stats["total_budget"] > 0:
            utilization = round((stats["total_spent"] / stats["total_budget"]) * 100, 2)
            
        result.append({
            "state": state,
            "total_projects": stats["total_projects"],
            "ongoing": stats["ongoing"],
            "completed": stats["completed"],
            "delayed": stats["delayed"],
            "high_risk": stats["high_risk"],
            "total_budget": round(stats["total_budget"], 2),
            "total_spent": round(stats["total_spent"], 2),
            "budget_utilization": utilization,
            "projects": stats["projects_list"]
        })
        
    return result

@router.get("/charts")
def get_charts_data(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Returns chart-friendly datasets grouped by departments, risk levels, etc.
    """
    # 1. Department Performance
    depts = db.query(models.Department).all()
    dept_performance = []
    for d in depts:
        projects = db.query(models.Project).filter(models.Project.department_id == d.id).all()
        if not projects:
            continue
        avg_progress = sum(p.progress for p in projects) / len(projects)
        total_budget = sum(p.budget for p in projects)
        total_spent = sum(p.amount_spent for p in projects)
        
        dept_performance.append({
            "department": d.name.split(" (")[0], # shorten name
            "avg_progress": round(avg_progress, 2),
            "total_budget": round(total_budget, 2),
            "total_spent": round(total_spent, 2),
            "projects_count": len(projects)
        })
        
    # 2. Risk Distribution
    risk_distribution = []
    for risk in ["Low", "Medium", "High", "Critical"]:
        count = db.query(models.Project).filter(models.Project.risk_level == risk).count()
        risk_distribution.append({"name": risk, "value": count})
        
    # 3. Status Distribution
    status_distribution = []
    for status_val in ["Planning", "In Progress", "Delayed", "Completed", "On Hold"]:
        count = db.query(models.Project).filter(models.Project.status == status_val).count()
        if count > 0:
            status_distribution.append({"name": status_val, "value": count})
            
    # 4. Project progress milestones (grouped ranges)
    progress_ranges = [
        {"name": "0-20%", "count": 0},
        {"name": "21-40%", "count": 0},
        {"name": "41-60%", "count": 0},
        {"name": "61-80%", "count": 0},
        {"name": "81-100%", "count": 0}
    ]
    
    projects = db.query(models.Project).all()
    for p in projects:
        val = p.progress
        if val <= 20:
            progress_ranges[0]["count"] += 1
        elif val <= 40:
            progress_ranges[1]["count"] += 1
        elif val <= 60:
            progress_ranges[2]["count"] += 1
        elif val <= 80:
            progress_ranges[3]["count"] += 1
        else:
            progress_ranges[4]["count"] += 1
            
    return {
        "department_performance": dept_performance,
        "risk_distribution": risk_distribution,
        "status_distribution": status_distribution,
        "progress_ranges": progress_ranges
    }
