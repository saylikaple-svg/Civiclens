import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from .database import Base

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    
    users = relationship("User", back_populates="department")
    projects = relationship("Project", back_populates="department")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    role = Column(String(50), nullable=False)  # SUPER_ADMIN, ADMIN, PROJECT_MANAGER, VIEWER
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    status = Column(String(50), default="Active")  # Active, Disabled
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    department = relationship("Department", back_populates="users")
    uploaded_documents = relationship("Document", back_populates="uploader")
    generated_reports = relationship("Report", back_populates="generator")
    audit_logs = relationship("AuditLog", back_populates="user")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    project_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    budget = Column(Float, nullable=False)  # In Crores
    amount_spent = Column(Float, default=0.0)  # In Crores
    progress = Column(Float, default=0.0)  # Physical Progress (0 to 100)
    financial_progress = Column(Float, default=0.0)  # Financial Progress (0 to 100)
    status = Column(String(50), default="Planning")  # Not Started, Planning, In Progress, Delayed, Completed, On Hold
    risk_level = Column(String(50), default="Low")  # Low, Medium, High, Critical
    start_date = Column(DateTime, nullable=False)
    expected_end_date = Column(DateTime, nullable=False)
    actual_end_date = Column(DateTime, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    department = relationship("Department", back_populates="projects")
    milestones = relationship("Milestone", back_populates="project", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="project", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="project", cascade="all, delete-orphan")

class Milestone(Base):
    __tablename__ = "milestones"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    planned_date = Column(DateTime, nullable=False)
    actual_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="Not Started")  # Not Started, In Progress, Delayed, Completed
    responsible_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    project = relationship("Project", back_populates="milestones")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(10), nullable=False)  # pdf, docx, xlsx, png, jpg, etc.
    extracted_text = Column(Text, nullable=True)
    ocr_status = Column(String(50), default="Pending")  # Pending, Processing, Completed, Failed
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    project = relationship("Project", back_populates="documents")
    uploader = relationship("User", back_populates="uploaded_documents")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    type = Column(String(50), nullable=False)  # Delay, Budget, Milestone, Risk, General
    severity = Column(String(50), nullable=False)  # Low, Medium, High, Critical
    message = Column(String(500), nullable=False)
    status = Column(String(50), default="unread")  # unread, read
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    project = relationship("Project", back_populates="alerts")

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    report_type = Column(String(100), nullable=False)  # Project Status, Monthly Progress, Delay, Risk, Executive Summary
    generated_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=True)  # Markdown/HTML content
    file_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    project = relationship("Project", back_populates="reports")
    generator = relationship("User", back_populates="generated_reports")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)  # Login, Logout, Project Created, Project Updated, etc.
    entity_type = Column(String(50), nullable=True)  # project, milestone, user, document
    entity_id = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(200), nullable=True)
    
    user = relationship("User", back_populates="audit_logs")

class Feedback(Base):
    __tablename__ = "feedbacks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    feedback_type = Column(String(50), default="General Feedback")
    category = Column(String(50), default="General")
    title = Column(String(200), nullable=True)
    query_text = Column(Text, nullable=False)
    priority = Column(String(20), default="Medium")
    contact_email = Column(String(100), nullable=True)
    response_text = Column(Text, nullable=True)
    status = Column(String(50), default="Pending") # Pending, Answered, Resolved
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User")
    project = relationship("Project")
