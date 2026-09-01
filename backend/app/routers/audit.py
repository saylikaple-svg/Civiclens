from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/audit", tags=["Audit Logs"])

@router.get("", response_model=List[schemas.AuditLogResponse])
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin_or_above)
):
    logs = db.query(models.AuditLog).join(models.User, isouter=True).order_by(models.AuditLog.timestamp.desc()).all()
    
    result = []
    for log in logs:
        res = schemas.AuditLogResponse.model_validate(log)
        if log.user:
            res.user_name = log.user.name
        else:
            res.user_name = "System / Public"
        result.append(res)
        
    return result
