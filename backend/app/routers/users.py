from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/users", tags=["User Management"])

@router.get("", response_model=List[schemas.UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_super_admin)
):
    return db.query(models.User).all()

@router.post("", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user_admin(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_super_admin)
):
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered")
        
    hashed_password = auth.get_password_hash(user_in.password)
    user = models.User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hashed_password,
        role=user_in.role,
        department_id=user_in.department_id,
        status="Active"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Audit log
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="Admin Created User",
        entity_type="user",
        entity_id=user.id,
        details=f"Admin created user {user.email} with role {user.role}."
    ))
    db.commit()
    
    return user

@router.put("/me", response_model=schemas.UserResponse)
def update_current_user_profile(
    profile_in: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if profile_in.email and profile_in.email != current_user.email:
        existing = db.query(models.User).filter(models.User.email == profile_in.email, models.User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email is already in use by another account")
        current_user.email = profile_in.email
        
    if profile_in.name:
        current_user.name = profile_in.name
    if profile_in.department_id is not None:
        current_user.department_id = profile_in.department_id if profile_in.department_id > 0 else None
    if profile_in.password and profile_in.password.strip():
        current_user.password_hash = auth.get_password_hash(profile_in.password.strip())
        
    db.commit()
    db.refresh(current_user)
    
    # Audit log
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="User Updated Profile",
        entity_type="user",
        entity_id=current_user.id,
        details=f"User {current_user.email} updated profile settings."
    ))
    db.commit()
    
    return current_user

@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user_admin(
    user_id: int,
    user_in: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_super_admin)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    data = user_in.model_dump(exclude_unset=True)
    if "password" in data and data["password"]:
        user.password_hash = auth.get_password_hash(data.pop("password"))
        
    for key, value in data.items():
        setattr(user, key, value)
        
    db.commit()
    db.refresh(user)
    
    # Audit log
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="Admin Updated User",
        entity_type="user",
        entity_id=user.id,
        details=f"Admin updated user {user.email} settings."
    ))
    db.commit()
    
    return user

@router.put("/{user_id}/disable", response_model=schemas.UserResponse)
def disable_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_super_admin)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot disable your own administrator account")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.status = "Disabled"
    db.commit()
    db.refresh(user)
    
    # Audit log
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="Admin Disabled User",
        entity_type="user",
        entity_id=user.id,
        details=f"Admin disabled user account {user.email}."
    ))
    db.commit()
    
    return user
