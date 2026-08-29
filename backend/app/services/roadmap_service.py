from sqlalchemy.orm import Session
from app.models import models
from app.ai.ai_provider import AIProvider

ai_provider = AIProvider()

def generate_and_save_roadmap(db: Session, career_profile_id: str) -> models.Roadmap:
    """Generate week-by-week roadmap for missing required skills and save in database."""
    profile = db.query(models.CareerProfile).filter(models.CareerProfile.id == career_profile_id).first()
    if not profile:
        raise ValueError("Profile not found")

    # Fetch UserSkills linked to the profile that are required but missing/unverified
    user_skills = db.query(models.UserSkill).filter(
        models.UserSkill.career_profile_id == career_profile_id,
        models.UserSkill.is_required_by_role == True,
        models.UserSkill.status.in_(["MISSING", "CLAIMED_BUT_UNVERIFIED"])
    ).all()
    
    gap_skills = [s.skill_name for s in user_skills]
    
    # 1. Ask AI Provider / Fallback template to write the roadmap
    items_data = ai_provider.generate_career_roadmap(profile.target_role, gap_skills)
    
    # Clean previous roadmaps
    previous_roadmaps = db.query(models.Roadmap).filter(
        models.Roadmap.career_profile_id == career_profile_id
    ).all()
    for pr in previous_roadmaps:
        db.query(models.RoadmapItem).filter(models.RoadmapItem.roadmap_id == pr.id).delete()
        db.delete(pr)
    db.commit()

    # Create new Roadmap
    roadmap = models.Roadmap(
        career_profile_id=career_profile_id,
        title=f"{profile.target_role} Skill Mastery Pathway"
    )
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)

    # Add Roadmap items
    for item in items_data:
        db_item = models.RoadmapItem(
            roadmap_id=roadmap.id,
            week_number=item.get("week_number"),
            skill=item.get("skill"),
            explanation=item.get("explanation"),
            objective=item.get("objective"),
            task=item.get("task"),
            milestone=item.get("milestone")
        )
        db.add(db_item)
        
    db.commit()
    db.refresh(roadmap)
    return roadmap
