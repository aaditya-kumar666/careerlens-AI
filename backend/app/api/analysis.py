from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models import models
from app.schemas import schemas
from app.utils.auth import get_current_user
from app.services.skill_verification_service import verify_user_skills
from app.services.scoring_service import calculate_and_save_scores

router = APIRouter(prefix="/analysis", tags=["Career Analysis"])

@router.post("/start")
def start_analysis(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.CareerProfile).filter(models.CareerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No target profile configured. Complete onboarding first."
        )
        
    resume = db.query(models.Resume).filter(models.Resume.career_profile_id == profile.id).first()
    github_profile = db.query(models.GitHubProfile).filter(models.GitHubProfile.career_profile_id == profile.id).first()
    
    if not resume or not github_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both a PDF resume and a GitHub username are required for analysis."
        )

    try:
        # 1. Run Verification engine (matches resume, role JDs, and repos)
        verify_user_skills(db, profile.id)
        
        # 2. Run Scoring & Portfolio Gap analysis
        calculate_and_save_scores(db, profile.id)
        
        # 3. Generate Project Recommendations (Phase 8 stub)
        from app.services.recommendation_service import generate_and_save_recommendations
        generate_and_save_recommendations(db, profile.id)
        
        # 4. Generate Weekly Roadmap (Phase 9 stub)
        from app.services.roadmap_service import generate_and_save_roadmap
        generate_and_save_roadmap(db, profile.id)
        
        return {"status": "success", "message": "Analysis calculated successfully."}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Verification script error: {str(e)}"
        )

@router.get("/latest")
def get_latest_analysis(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.CareerProfile).filter(models.CareerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configure your career profile first."
        )
        
    analysis = db.query(models.CareerAnalysis).filter(
        models.CareerAnalysis.career_profile_id == profile.id
    ).order_by(models.CareerAnalysis.created_at.desc()).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No analysis results found. Trigger analysis first."
        )

    portfolio_analysis = db.query(models.PortfolioAnalysis).filter(
        models.PortfolioAnalysis.career_profile_id == profile.id
    ).first()
    
    user_skills = db.query(models.UserSkill).filter(
        models.UserSkill.career_profile_id == profile.id
    ).all()
    
    github_profile = db.query(models.GitHubProfile).filter(
        models.GitHubProfile.career_profile_id == profile.id
    ).first()
    
    repositories = []
    if github_profile:
        repositories = db.query(models.Repository).filter(
            models.Repository.github_profile_id == github_profile.id
        ).all()
        
    recommendations = db.query(models.Recommendation).filter(
        models.Recommendation.career_profile_id == profile.id
    ).all()
    
    roadmap = db.query(models.Roadmap).filter(
        models.Roadmap.career_profile_id == profile.id
    ).first()

    # Form structured payload
    skills_payload = []
    for s in user_skills:
        evidences = db.query(models.SkillEvidence).filter(models.SkillEvidence.user_skill_id == s.id).all()
        skills_payload.append({
            "id": s.id,
            "skill_name": s.skill_name,
            "category": s.category,
            "status": s.status,
            "is_required_by_role": s.is_required_by_role,
            "evidences": [{
                "id": ev.id,
                "source_type": ev.source_type,
                "source_name": ev.source_name,
                "confidence": ev.confidence,
                "details": ev.details
            } for ev in evidences]
        })

    roadmap_payload = None
    if roadmap:
        items = db.query(models.RoadmapItem).filter(models.RoadmapItem.roadmap_id == roadmap.id).order_by(models.RoadmapItem.week_number).all()
        roadmap_payload = {
            "id": roadmap.id,
            "title": roadmap.title,
            "items": [{
                "id": item.id,
                "week_number": item.week_number,
                "skill": item.skill,
                "explanation": item.explanation,
                "objective": item.objective,
                "task": item.task,
                "milestone": item.milestone
            } for item in items]
        }

    return {
        "analysis": {
            "id": analysis.id,
            "readiness_score": analysis.readiness_score,
            "credibility_score": analysis.credibility_score,
            "skill_match_score": analysis.skill_match_score,
            "skill_verification_score": analysis.skill_verification_score,
            "portfolio_relevance_score": analysis.portfolio_relevance_score,
            "project_quality_score": analysis.project_quality_score,
            "activity_score": analysis.activity_score,
            "explanation": analysis.explanation,
            "created_at": analysis.created_at,
            "skills": skills_payload,
            "github_username": github_profile.username if github_profile else None,
            "github_profile": {
                "username": github_profile.username,
                "followers": github_profile.followers,
                "following": github_profile.following,
                "public_repos": github_profile.public_repos,
                "avatar_url": github_profile.avatar_url
            } if github_profile else None,
            "repositories": [{
                "id": r.id,
                "name": r.name,
                "description": r.description,
                "primary_language": r.primary_language,
                "languages": r.languages,
                "topics": r.topics,
                "stars": r.stars,
                "forks": r.forks,
                "repo_url": r.repo_url,
                "last_updated": r.last_updated
            } for r in repositories],
            "gaps_summary": portfolio_analysis.gaps_summary if portfolio_analysis else [],
            "git_recommendations": [
                f"{len([r for r in repositories if not r.readme_content])} repositories do not have README documentation.",
                "Your pinned repositories need to highlight target framework libraries.",
                "Add docker configurations to prove containerization skills."
            ]
        },
        "recommendations": [{
            "id": rec.id,
            "title": rec.title,
            "description": rec.description,
            "difficulty": rec.difficulty,
            "time_estimate": rec.time_estimate,
            "skills_gained": rec.skills_gained,
            "tech_stack": rec.tech_stack,
            "milestones": rec.milestones
        } for rec in recommendations],
        "roadmap": roadmap_payload
    }
