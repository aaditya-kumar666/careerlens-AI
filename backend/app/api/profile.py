from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models import models
from app.schemas import schemas
from app.utils.auth import get_current_user

router = APIRouter(prefix="/profile", tags=["Profile"])

@router.get("", response_model=schemas.CareerProfileResponse)
def get_profile(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.CareerProfile).filter(models.CareerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Career profile not configured yet"
        )
    return profile

@router.post("/setup", response_model=schemas.CareerProfileResponse)
def setup_profile(
    profile_data: schemas.CareerProfileCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.CareerProfile).filter(models.CareerProfile.user_id == current_user.id).first()
    if profile:
        profile.target_role = profile_data.target_role
        profile.job_description = profile_data.job_description
    else:
        profile = models.CareerProfile(
            user_id=current_user.id,
            target_role=profile_data.target_role,
            job_description=profile_data.job_description
        )
        db.add(profile)
    
    db.commit()
    db.refresh(profile)
    return profile
