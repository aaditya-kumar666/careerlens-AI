from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models import models
from app.schemas import schemas
from app.utils.auth import get_current_user
from typing import List, Dict

router = APIRouter(prefix="/simulator", tags=["Career Simulator"])

@router.post("", response_model=schemas.SimulationResponse)
def simulate_career_readiness(
    simulation_input: schemas.SimulationInput,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.CareerProfile).filter(models.CareerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configure your career profile first."
        )

    # Get latest analysis scores
    latest_analysis = db.query(models.CareerAnalysis).filter(
        models.CareerAnalysis.career_profile_id == profile.id
    ).order_by(models.CareerAnalysis.created_at.desc()).first()

    if not latest_analysis:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No baseline analysis found. Run overview analysis before using simulator."
        )

    # Fetch UserSkills linked to the profile
    user_skills = db.query(models.UserSkill).filter(
        models.UserSkill.career_profile_id == profile.id
    ).all()

    # Create mapping of user skills to simulate modifications
    skills_map = {us.skill_name.lower(): us for us in user_skills}
    simulated_skills = list(simulation_input.skills_to_add)
    simulated_skills_lower = {s.lower() for s in simulated_skills}

    # Recalculate Skill Match Score
    # Find all required/preferred skills
    role_skills = [s for s in user_skills if s.is_required_by_role]
    
    if not role_skills:
        sim_skill_match = 100
    else:
        sim_total_weight = 0.0
        for s in role_skills:
            status_val = s.status
            # If the skill is being simulated as learned, update status in simulation
            if s.skill_name.lower() in simulated_skills_lower:
                status_val = "VERIFIED"
                
            if status_val == "VERIFIED":
                sim_total_weight += 1.0
            elif status_val == "PARTIALLY_VERIFIED":
                sim_total_weight += 0.8
            elif status_val == "CLAIMED_BUT_UNVERIFIED":
                sim_total_weight += 0.5
            elif status_val == "MISSING":
                sim_total_weight += 0.0
        sim_skill_match = int((sim_total_weight / len(role_skills)) * 100)

    # Recalculate Skill Verification Score
    # Claims are skills with resume evidence
    claimed_skills = []
    for us in user_skills:
        has_resume = db.query(models.SkillEvidence).filter(
            models.SkillEvidence.user_skill_id == us.id,
            models.SkillEvidence.source_type == "resume"
        ).first()
        if has_resume:
            claimed_skills.append(us)

    if not claimed_skills:
        sim_verification = 100
    else:
        sim_verified_points = 0.0
        for cs in claimed_skills:
            status_val = cs.status
            if cs.skill_name.lower() in simulated_skills_lower:
                status_val = "VERIFIED"
                
            if status_val == "VERIFIED":
                sim_verified_points += 1.0
            elif status_val == "PARTIALLY_VERIFIED":
                sim_verified_points += 0.5
            elif status_val == "CLAIMED_BUT_UNVERIFIED":
                sim_verified_points += 0.0
        sim_verification = int((sim_verified_points / len(claimed_skills)) * 100)

    # Relevance, Quality, and Activity scores are kept constant in the simulation
    rel = latest_analysis.portfolio_relevance_score
    qual = latest_analysis.project_quality_score
    act = latest_analysis.activity_score

    # Compute Simulated Overall Readiness Score
    sim_readiness = int(
        (0.40 * sim_skill_match) +
        (0.20 * sim_verification) +
        (0.20 * rel) +
        (0.10 * qual) +
        (0.10 * act)
    )
    sim_readiness = max(10, min(100, sim_readiness))

    improvement = sim_readiness - latest_analysis.readiness_score

    return {
        "current_readiness": latest_analysis.readiness_score,
        "simulated_readiness": sim_readiness,
        "improvement": improvement,
        "breakdown_current": {
            "skill_match": latest_analysis.skill_match_score,
            "verification": latest_analysis.skill_verification_score,
            "relevance": rel,
            "quality": qual,
            "activity": act
        },
        "breakdown_simulated": {
            "skill_match": sim_skill_match,
            "verification": sim_verification,
            "relevance": rel,
            "quality": qual,
            "activity": act
        },
        "skills_simulated": simulated_skills
    }
