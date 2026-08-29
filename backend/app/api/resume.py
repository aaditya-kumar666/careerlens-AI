from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models import models
from app.schemas import schemas
from app.utils.auth import get_current_user
from app.services.resume_service import extract_text_from_pdf
from app.services.skill_extraction_service import extract_and_save_resume_skills

router = APIRouter(prefix="/resume", tags=["Resume"])

@router.post("/upload", response_model=schemas.ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.CareerProfile).filter(models.CareerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configure your career profile (target role) before uploading a resume."
        )

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported."
        )

    try:
        file_bytes = await file.read()
        extracted_text = extract_text_from_pdf(file_bytes)
        
        resume = db.query(models.Resume).filter(models.Resume.career_profile_id == profile.id).first()
        if resume:
            resume.file_name = file.filename
            resume.extracted_text = extracted_text
        else:
            resume = models.Resume(
                career_profile_id=profile.id,
                file_name=file.filename,
                extracted_text=extracted_text
            )
            db.add(resume)
        
        db.commit()
        db.refresh(resume)
        
        # Trigger automatic skill claims extraction
        extract_and_save_resume_skills(db, profile.id, extracted_text)
        
        return resume
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
