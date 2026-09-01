from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

# --- TOKEN SCHEMAS ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[int] = None

# --- DEPARTMENT SCHEMAS ---
class DepartmentBase(BaseModel):
    name: str

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int
    class Config:
        from_attributes = True

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str  # SUPER_ADMIN, ADMIN, PROJECT_MANAGER, VIEWER
    department_id: Optional[int] = None
    status: Optional[str] = "Active"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    department_id: Optional[int] = None
    status: Optional[str] = None
    password: Optional[str] = None

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    department_id: Optional[int] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    last_login: Optional[datetime] = None
    department: Optional[DepartmentResponse] = None
    class Config:
        from_attributes = True

# --- MILESTONE SCHEMAS ---
class MilestoneBase(BaseModel):
    name: str
    description: Optional[str] = None
    planned_date: datetime
    actual_date: Optional[datetime] = None
    status: Optional[str] = "Not Started"  # Not Started, In Progress, Delayed, Completed
    responsible_user_id: Optional[int] = None

class MilestoneCreate(MilestoneBase):
    pass

class MilestoneUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    planned_date: Optional[datetime] = None
    actual_date: Optional[datetime] = None
    status: Optional[str] = None
    responsible_user_id: Optional[int] = None

class MilestoneResponse(MilestoneBase):
    id: int
    project_id: int
    class Config:
        from_attributes = True

# --- PROJECT SCHEMAS ---
class ProjectBase(BaseModel):
    project_code: str
    name: str
    description: Optional[str] = None
    department_id: int
    state: str
    district: str
    latitude: float
    longitude: float
    budget: float  # In Crores
    amount_spent: Optional[float] = 0.0
    progress: Optional[float] = 0.0
    financial_progress: Optional[float] = 0.0
    status: Optional[str] = "Planning"  # Not Started, Planning, In Progress, Delayed, Completed, On Hold
    risk_level: Optional[str] = "Low"  # Low, Medium, High, Critical
    start_date: datetime
    expected_end_date: datetime
    actual_end_date: Optional[datetime] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    project_code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    department_id: Optional[int] = None
    state: Optional[str] = None
    district: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    budget: Optional[float] = None
    amount_spent: Optional[float] = None
    progress: Optional[float] = None
    financial_progress: Optional[float] = None
    status: Optional[str] = None
    risk_level: Optional[str] = None
    start_date: Optional[datetime] = None
    expected_end_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None

class ProjectResponse(ProjectBase):
    id: int
    created_by: Optional[int] = None
    updated_at: datetime
    department: DepartmentResponse
    milestones: List[MilestoneResponse] = []
    class Config:
        from_attributes = True

# --- DOCUMENT SCHEMAS ---
class DocumentBase(BaseModel):
    project_id: int
    file_name: str
    file_type: str

class DocumentResponse(DocumentBase):
    id: int
    file_path: str
    ocr_status: str
    extracted_text: Optional[str] = None
    uploaded_by_id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- ALERT SCHEMAS ---
class AlertResponse(BaseModel):
    id: int
    project_id: int
    type: str
    severity: str
    message: str
    status: str
    created_at: datetime
    project_name: Optional[str] = None
    project_code: Optional[str] = None
    class Config:
        from_attributes = True

# --- REPORT SCHEMAS ---
class ReportBase(BaseModel):
    project_id: int
    report_type: str

class ReportCreate(ReportBase):
    pass

class ReportResponse(ReportBase):
    id: int
    generated_by_id: int
    content: Optional[str] = None
    file_path: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# --- AUDIT LOG SCHEMAS ---
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    timestamp: datetime
    details: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    user_name: Optional[str] = None
    class Config:
        from_attributes = True

# --- AI SEARCH / CHAT ASSISTANT SCHEMAS ---
class ChatQuery(BaseModel):
    project_id: Optional[int] = None
    document_id: Optional[int] = None
    message: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[dict] = []  # List of {"document_name": str, "excerpt": str}

# --- Q&A FEEDBACK SCHEMAS ---
class FeedbackCreate(BaseModel):
    project_id: Optional[int] = None
    feedback_type: Optional[str] = "General Feedback"
    category: Optional[str] = "General"
    title: Optional[str] = ""
    query_text: str
    priority: Optional[str] = "Medium"
    contact_email: Optional[str] = None

class FeedbackReply(BaseModel):
    response_text: str

class FeedbackResponse(BaseModel):
    id: int
    user_id: int
    project_id: Optional[int] = None
    feedback_type: Optional[str] = "General Feedback"
    category: Optional[str] = "General"
    title: Optional[str] = None
    query_text: str
    priority: Optional[str] = "Medium"
    contact_email: Optional[str] = None
    response_text: Optional[str] = None
    status: str
    created_at: datetime
    user_name: Optional[str] = None
    project_name: Optional[str] = None
    project_code: Optional[str] = None
    class Config:
        from_attributes = True
