import datetime
from sqlalchemy.orm import Session
from . import models

def get_project_features(project: models.Project, db: Session):
    """
    Computes numerical features for the project based on current database state.
    """
    progress = project.progress
    
    start = project.start_date
    planned_end = project.expected_end_date
    now = datetime.datetime.utcnow()
    
    total_planned_days = (planned_end - start).days
    if total_planned_days <= 0:
        total_planned_days = 365 # fallback
        
    elapsed_days = (now - start).days
    elapsed_ratio = max(0.0, elapsed_days / total_planned_days)
    
    budget_utilized = 0.0
    if project.budget > 0:
        budget_utilized = (project.amount_spent / project.budget) * 100
        
    delayed_milestones = db.query(models.Milestone).filter(
        models.Milestone.project_id == project.id,
        models.Milestone.status != "Completed",
        models.Milestone.planned_date < now
    ).count()
    
    return {
        "progress": progress,
        "elapsed_ratio": elapsed_ratio,
        "budget_utilized": budget_utilized,
        "delayed_milestones": delayed_milestones,
        "total_planned_days": total_planned_days,
        "elapsed_days": elapsed_days
    }

def predict_delay(project: models.Project, db: Session):
    """
    Predicts risk score, expected delay, contributing factors and recommended actions.
    Uses robust rule-based inference designed for MoSPI project monitoring.
    """
    features = get_project_features(project, db)
    
    score = 0.1
    if features["elapsed_ratio"] > 0.8 and features["progress"] < 50:
        score += 0.5
    score += features["delayed_milestones"] * 0.1
    score += max(0.0, (features["budget_utilized"] - features["progress"]) * 0.003)
    
    risk_score_prob = min(0.99, max(0.05, score))
    predicted_delay_days = max(0, int(risk_score_prob * 100 + features["delayed_milestones"] * 10))

    risk_score_pct = int(round(risk_score_prob * 100))
    
    if risk_score_pct < 30:
        risk_level = "Low"
    elif risk_score_pct < 60:
        risk_level = "Medium"
    elif risk_score_pct < 85:
        risk_level = "High"
    else:
        risk_level = "Critical"
        
    factors = []
    if features["delayed_milestones"] > 0:
        factors.append(f"{features['delayed_milestones']} milestones are currently overdue")
    if features["elapsed_ratio"] > 0.7 and features["progress"] < features["elapsed_ratio"] * 80:
        factors.append(f"Physical progress ({features['progress']:.1f}%) is significantly below elapsed time ({features['elapsed_ratio']*100:.1f}%)")
    if features["budget_utilized"] > features["progress"] + 15:
        factors.append(f"Financial expenditure ({features['budget_utilized']:.1f}%) is disproportional to physical progress ({features['progress']:.1f}%)")
    if features["elapsed_ratio"] > 1.0:
        factors.append("Project has exceeded its planned completion timeline")
        
    if not factors:
        factors.append("Minor schedule variance")
        
    actions = []
    if features["delayed_milestones"] > 0:
        actions.append("Conduct an immediate status review of the overdue milestones with the contractor.")
    if features["budget_utilized"] > features["progress"] + 15:
        actions.append("Audit recent project bills to investigate the physical-financial progress disparity.")
    if features["progress"] < 40 and features["elapsed_ratio"] > 0.5:
        actions.append("Expedite procurement cycles and deploy additional labor to recover lost timeline.")
    
    if not actions:
        actions.append("Continue routine monitoring and verify upcoming milestone timelines.")
        
    return {
        "project_id": project.id,
        "project_name": project.name,
        "risk_score": risk_score_pct,
        "risk_level": risk_level,
        "expected_delay": int(predicted_delay_days),
        "contributing_factors": factors,
        "recommended_actions": actions,
        "features": features
    }
