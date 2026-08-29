from sqlalchemy.orm import Session
from app.models import models
from app.ai.ai_provider import AIProvider
from typing import List, Dict, Any

ai_provider = AIProvider()

def extract_and_save_resume_skills(db: Session, career_profile_id: str, resume_text: str) -> List[models.UserSkill]:
    """Parse resume text for claimed skills and save them in user_skills table as CLAIMED_BUT_UNVERIFIED."""
    # 1. Extract skills using AI layer / local regex fallback
    skills_data = ai_provider.extract_skills_from_resume(resume_text)
    
    # Clean up previous skills for this profile to prevent accumulation of duplicates
    db.query(models.UserSkill).filter(models.UserSkill.career_profile_id == career_profile_id).delete()
    db.commit()

    saved_skills = []
    seen_skills = set() # Avoid adding duplicate skills
    
    for s in skills_data:
        name = s.get("skill_name", "").strip()
        category = s.get("category", "Tool").strip()
        if not name:
            continue
            
        # Standardize capitalization
        name_key = name.lower()
        if name_key in seen_skills:
            continue
        seen_skills.add(name_key)
        
        user_skill = models.UserSkill(
            career_profile_id=career_profile_id,
            skill_name=name,
            category=category,
            status="CLAIMED_BUT_UNVERIFIED", # Initial default before verification run
            is_required_by_role=False
        )
        db.add(user_skill)
        saved_skills.append(user_skill)
        
    db.commit()
    
    # Populate initial resume evidence for each saved skill
    for us in saved_skills:
        evidence = models.SkillEvidence(
            user_skill_id=us.id,
            source_type="resume",
            source_name="Resume PDF",
            confidence=1.0,
            details=f"Extracted claim from parsed resume text document."
        )
        db.add(evidence)
        
    db.commit()
    return saved_skills

def extract_and_save_role_skills(db: Session, career_profile_id: str, target_role: str, job_description: str = None) -> Dict[str, Any]:
    """Parse target job description (or role taxonomy) to retrieve required and preferred skills."""
    role_skills = ai_provider.extract_skills_from_jd(job_description or "", target_role)
    return role_skills
