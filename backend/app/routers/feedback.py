from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/feedback", tags=["Feedback"])

@router.get("", response_model=List[schemas.FeedbackResponse])
def get_feedbacks(
    project_id: Optional[int] = Query(None),
    feedback_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Feedback).outerjoin(models.User, models.Feedback.user_id == models.User.id).outerjoin(models.Project, models.Feedback.project_id == models.Project.id)
    
    if project_id:
        query = query.filter(models.Feedback.project_id == project_id)
    if feedback_type:
        query = query.filter(models.Feedback.feedback_type == feedback_type)
        
    feedbacks = query.order_by(models.Feedback.created_at.desc()).all()
    
    result = []
    for fb in feedbacks:
        res = schemas.FeedbackResponse.model_validate(fb)
        res.user_name = fb.user.name if fb.user else "Anonymous"
        res.project_name = fb.project.name if fb.project else None
        res.project_code = fb.project.project_code if fb.project else None
        result.append(res)
        
    return result

@router.post("", response_model=schemas.FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    feedback_in: schemas.FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    project_name = None
    project_code = None
    if feedback_in.project_id:
        project = db.query(models.Project).filter(models.Project.id == feedback_in.project_id).first()
        if project:
            project_name = project.name
            project_code = project.project_code
        
    db_feedback = models.Feedback(
        user_id=current_user.id,
        project_id=feedback_in.project_id,
        feedback_type=feedback_in.feedback_type or "General Feedback",
        category=feedback_in.category or "General",
        title=feedback_in.title,
        query_text=feedback_in.query_text,
        priority=feedback_in.priority or "Medium",
        contact_email=feedback_in.contact_email or current_user.email,
        status="Pending"
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    
    # Audit log
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="Feedback Submitted",
        entity_type="feedback",
        entity_id=db_feedback.id,
        details=f"Feedback submitted: '{feedback_in.title or feedback_in.query_text[:30]}'"
    ))
    db.commit()
    
    res = schemas.FeedbackResponse.model_validate(db_feedback)
    res.user_name = current_user.name
    res.project_name = project_name
    res.project_code = project_code
    return res

@router.put("/{feedback_id}/reply", response_model=schemas.FeedbackResponse)
def reply_feedback(
    feedback_id: int,
    reply_in: schemas.FeedbackReply,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_manager_or_above)
):
    fb = db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback item not found")
        
    fb.response_text = reply_in.response_text
    fb.status = "Answered"
    db.commit()
    db.refresh(fb)
    
    # Audit log
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="Feedback Replied",
        details=f"Replied to feedback ID {fb.id}."
    ))
    db.commit()
    
    res = schemas.FeedbackResponse.model_validate(fb)
    res.user_name = fb.user.name if fb.user else "Anonymous"
    res.project_name = fb.project.name if fb.project else None
    res.project_code = fb.project.project_code if fb.project else None
    return res
