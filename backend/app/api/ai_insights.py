from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models import models
from app.schemas import schemas
from app.utils.auth import get_current_user
from app.services.ai_assistance_service import calculate_and_save_ai_assistance

router = APIRouter(prefix="/ai-insights", tags=["AI Assistance Insights"])

@router.get("/latest", response_model=schemas.AIAssistanceAnalysisResponse)
def get_latest_ai_insights(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.CareerProfile).filter(models.CareerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configure your career profile first."
        )
        
    analysis = db.query(models.AIAssistanceAnalysis).filter(
        models.AIAssistanceAnalysis.career_profile_id == profile.id
    ).order_by(models.AIAssistanceAnalysis.created_at.desc()).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No AI assistance analysis results found. Trigger analysis first."
        )
    return analysis

@router.post("/analyze", response_model=schemas.AIAssistanceAnalysisResponse)
def analyze_ai_assistance(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.CareerProfile).filter(models.CareerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configure your career profile first."
        )
        
    try:
        analysis = calculate_and_save_ai_assistance(db, profile.id)
        return analysis
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error running AI assistance analysis: {str(e)}"
        )
