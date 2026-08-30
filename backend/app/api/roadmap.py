from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models import models
from app.schemas import schemas
from app.utils.auth import get_current_user
from app.services.skill_verification_service import verify_user_skills
from app.services.scoring_service import calculate_and_save_scores
from app.services.roadmap_service import generate_and_save_roadmap
from app.services.ai_assistance_service import calculate_and_save_ai_assistance

router = APIRouter(prefix="/roadmap", tags=["Career Roadmap"])

@router.post("/progress")
def update_roadmap_progress(
    payload: schemas.RoadmapProgressUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(models.RoadmapItem).filter(models.RoadmapItem.id == payload.item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap item not found")
        
    item.status = payload.status
    db.commit()
    db.refresh(item)
    return {"status": "success", "message": f"Progress updated to {payload.status}"}

@router.post("/resource-complete")
def update_resource_complete(
    payload: schemas.ResourceProgressUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resource = db.query(models.LearningResource).filter(models.LearningResource.id == payload.resource_id).first()
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning resource not found")
        
    progress = db.query(models.UserResourceProgress).filter(
        models.UserResourceProgress.user_id == current_user.id,
        models.UserResourceProgress.resource_id == payload.resource_id
    ).first()
    
    if payload.completed:
        if not progress:
            progress = models.UserResourceProgress(
                user_id=current_user.id,
                resource_id=payload.resource_id,
                status="COMPLETED"
            )
            db.add(progress)
        else:
            progress.status = "COMPLETED"
    else:
        if progress:
            db.delete(progress)
            
    db.commit()
    return {"status": "success", "completed": payload.completed}

@router.post("/reassess")
def reassess_skills(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.CareerProfile).filter(models.CareerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Complete onboarding first.")
        
    try:
        # Run core verification pipeline
        verify_user_skills(db, profile.id)
        calculate_and_save_scores(db, profile.id)
        
        # Regenerate roadmap focusing on remaining gaps
        generate_and_save_roadmap(db, profile.id)
        
        # Run AI Assistance Analysis
        try:
            calculate_and_save_ai_assistance(db, profile.id)
        except Exception as ai_ex:
            print(f"AI Assistance analysis error during reassessment: {ai_ex}")
            
        return {"status": "success", "message": "Skills reassessed and roadmap updated successfully."}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
