import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth, ocr, rag
from ..config import settings

router = APIRouter(prefix="/api/documents", tags=["Documents & AI RAG"])

# Background Task for OCR
def run_ocr_task(doc_id: int, file_path: str, db_session_maker):
    db = db_session_maker()
    try:
        doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
        if doc:
            doc.ocr_status = "Processing"
            db.commit()
            
            # Extract text
            extracted_text = ocr.extract_text_from_file(file_path)
            
            doc.extracted_text = extracted_text
            doc.ocr_status = "Completed"
            db.commit()
            print(f"OCR successfully completed for Document ID {doc_id}.")
    except Exception as e:
        print(f"Error in background OCR task for Document ID {doc_id}: {e}")
        try:
            doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
            if doc:
                doc.ocr_status = "Failed"
                db.commit()
        except Exception:
            pass
    finally:
        db.close()

@router.post("/upload", response_model=schemas.DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    project_id: int = Form(...),
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Create unique name
    filename = file.filename
    clean_filename = f"{project.project_code}_{int(os.urandom(4).hex(), 16)}_{filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, clean_filename)
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        
    file_ext = filename.split(".")[-1]
    
    db_doc = models.Document(
        project_id=project_id,
        file_name=filename,
        file_path=file_path,
        file_type=file_ext,
        ocr_status="Pending",
        uploaded_by_id=current_user.id
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    
    # Trigger OCR as Background Task (so API response is immediate)
    from ..database import SessionLocal
    background_tasks.add_task(run_ocr_task, db_doc.id, file_path, SessionLocal)
    
    # Audit log
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="Document Uploaded",
        entity_type="document",
        entity_id=db_doc.id,
        details=f"Document '{filename}' uploaded for project {project.project_code}."
    ))
    db.commit()
    
    return db_doc

@router.get("", response_model=List[schemas.DocumentResponse])
def get_documents(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Document)
    if project_id:
        query = query.filter(models.Document.project_id == project_id)
    return query.all()

@router.get("/{document_id}", response_model=schemas.DocumentResponse)
def get_document(document_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.get("/{document_id}/download")
def download_document(document_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on storage")
        
    return FileResponse(doc.file_path, filename=doc.file_name)

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_manager_or_above)
):
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Delete local file
    try:
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)
    except Exception as e:
        print(f"Error removing file from disk: {e}")
        
    db.delete(doc)
    
    # Audit log
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="Document Deleted",
        entity_type="document",
        entity_id=document_id,
        details=f"Document '{doc.file_name}' deleted."
    ))
    db.commit()
    return None

# --- AI DOCUMENT RAG CHAT ASSISTANT ---
@router.post("/chat", response_model=schemas.ChatResponse)
def chat_document_assistant(
    query_in: schemas.ChatQuery,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Log Audit
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="AI Document Query",
        details=f"User asked document assistant: '{query_in.message[:50]}...'"
    ))
    db.commit()
    
    res = rag.query_rag_system(
        db=db,
        query=query_in.message,
        project_id=query_in.project_id,
        document_id=query_in.document_id
    )
    return res
