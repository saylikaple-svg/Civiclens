from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email address already exists."
        )
        
    # Department validation
    if user_in.department_id:
        dept = db.query(models.Department).filter(models.Department.id == user_in.department_id).first()
        if not dept:
            raise HTTPException(status_code=400, detail="Department does not exist")
            
    hashed_password = auth.get_password_hash(user_in.password)
    db_user = models.User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hashed_password,
        role=user_in.role,
        department_id=user_in.department_id,
        status="Active"
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Log audit
    log = models.AuditLog(
        user_id=db_user.id,
        action="Register User",
        entity_type="user",
        entity_id=db_user.id,
        details=f"User {db_user.email} registered with role {db_user.role}."
    )
    db.add(log)
    db.commit()
    
    return db_user

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if user.status != "Active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your account has been deactivated. Please contact the administrator."
        )
        
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Log audit
    log = models.AuditLog(
        user_id=user.id,
        action="Login",
        entity_type="user",
        entity_id=user.id,
        details=f"User {user.email} logged in successfully."
    )
    db.add(log)
    db.commit()
    
    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role, "uid": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name
    }

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user
