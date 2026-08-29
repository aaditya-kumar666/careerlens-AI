from sqlalchemy.orm import Session
from app.models import models
from app.services.skill_extraction_service import extract_and_save_role_skills
from app.services.github_service import infer_skills_from_repo
from typing import List, Dict, Any

def verify_user_skills(db: Session, career_profile_id: str):
    """Cross-reference resume claims, target role requirements, and GitHub repositories to verify skills."""
    profile = db.query(models.CareerProfile).filter(models.CareerProfile.id == career_profile_id).first()
    if not profile:
        return

    # 1. Fetch role skills taxonomy/JD requirements
    role_skills_data = extract_and_save_role_skills(db, profile.id, profile.target_role, profile.job_description)
    required_skills = set(role_skills_data.get("required_skills", []))
    preferred_skills = set(role_skills_data.get("preferred_skills", []))
    all_role_skills = required_skills.union(preferred_skills)

    # 2. Retrieve existing resume claims
    # Currently stored in UserSkill table with status 'CLAIMED_BUT_UNVERIFIED'
    resume_claims = db.query(models.UserSkill).filter(
        models.UserSkill.career_profile_id == career_profile_id
    ).all()
    claims_map = {rc.skill_name.lower(): rc for rc in resume_claims}

    # 3. Retrieve repositories & scan for demonstrated evidence
    github_profile = db.query(models.GitHubProfile).filter(
        models.GitHubProfile.career_profile_id == career_profile_id
    ).first()
    
    repositories = []
    if github_profile:
        repositories = db.query(models.Repository).filter(
            models.Repository.github_profile_id == github_profile.id
        ).all()

    # Map repository skills evidence
    repo_evidence_by_skill = {} # skill_name_lower -> list of dicts(repo, confidence, details)
    
    for repo in repositories:
        # Convert SQLAlchemy object to dict for parser utility
        repo_dict = {
            "name": repo.name,
            "description": repo.description,
            "primary_language": repo.primary_language,
            "languages": repo.languages,
            "topics": repo.topics,
            "readme_content": repo.readme_content
        }
        inferred = infer_skills_from_repo(repo_dict)
        for s in inferred:
            skill_name = s["skill"]
            skill_key = skill_name.lower()
            if skill_key not in repo_evidence_by_skill:
                repo_evidence_by_skill[skill_key] = []
            repo_evidence_by_skill[skill_key].append({
                "repo_id": repo.id,
                "repo_name": repo.name,
                "confidence": s["confidence"],
                "details": s["evidence_details"]
            })

    # Keep track of updated skills to avoid duplicate records
    processed_skills = set()

    # 4. Process all claimed skills and determine their verification status
    for skill_key, claim_record in claims_map.items():
        processed_skills.add(skill_key)
        skill_name = claim_record.skill_name
        is_req = skill_name in required_skills or skill_name in preferred_skills
        
        # Check if we have repository evidence
        evidence_list = repo_evidence_by_skill.get(skill_key, [])
        
        if evidence_list:
            # Check verification levels
            high_conf_repos = [e for e in evidence_list if e["confidence"] >= 0.70]
            max_conf = max(e["confidence"] for e in evidence_list)
            
            if len(high_conf_repos) >= 2 or max_conf >= 0.90:
                claim_record.status = "VERIFIED"
            else:
                claim_record.status = "PARTIALLY_VERIFIED"
                
            # Update role relevance flag
            claim_record.is_required_by_role = is_req
            
            # Save new repository evidences in database
            # First, clean previous repository evidences (to prevent duplication)
            db.query(models.SkillEvidence).filter(
                models.SkillEvidence.user_skill_id == claim_record.id,
                models.SkillEvidence.source_type == "repository"
            ).delete()
            
            for ev in evidence_list:
                db_ev = models.SkillEvidence(
                    user_skill_id=claim_record.id,
                    source_type="repository",
                    source_name=ev["repo_name"],
                    confidence=ev["confidence"],
                    details=ev["details"]
                )
                db.add(db_ev)
        else:
            # Claimed but no github project proof
            claim_record.status = "CLAIMED_BUT_UNVERIFIED"
            claim_record.is_required_by_role = is_req

    # 5. Process role required skills that were NOT claimed on resume
    for req_skill in all_role_skills:
        req_skill_key = req_skill.lower()
        if req_skill_key in processed_skills:
            continue
            
        processed_skills.add(req_skill_key)
        evidence_list = repo_evidence_by_skill.get(req_skill_key, [])
        
        # Determine category
        # Search taxonomy database
        from app.services.github_service import SKILL_TAXONOMY
        category = SKILL_TAXONOMY.get(req_skill_key, {}).get("category", "Tool")
        
        if evidence_list:
            # Skill is NOT on resume but IS in GitHub projects!
            high_conf_repos = [e for e in evidence_list if e["confidence"] >= 0.70]
            max_conf = max(e["confidence"] for e in evidence_list)
            
            status = "VERIFIED" if (len(high_conf_repos) >= 2 or max_conf >= 0.90) else "PARTIALLY_VERIFIED"
            
            new_skill = models.UserSkill(
                career_profile_id=career_profile_id,
                skill_name=req_skill,
                category=category,
                status=status,
                is_required_by_role=True
            )
            db.add(new_skill)
            db.commit()
            db.refresh(new_skill)
            
            # Add repository evidences
            for ev in evidence_list:
                db_ev = models.SkillEvidence(
                    user_skill_id=new_skill.id,
                    source_type="repository",
                    source_name=ev["repo_name"],
                    confidence=ev["confidence"],
                    details=ev["details"]
                )
                db.add(db_ev)
        else:
            # Skill is NOT on resume and NOT in GitHub repos -> MISSING!
            new_skill = models.UserSkill(
                career_profile_id=career_profile_id,
                skill_name=req_skill,
                category=category,
                status="MISSING",
                is_required_by_role=True
            )
            db.add(new_skill)

    # 6. Flag any remaining skills in the profile that are not required by the role
    # These are skills that were claimed or demonstrated, but not in the required/preferred list.
    all_user_skills = db.query(models.UserSkill).filter(
        models.UserSkill.career_profile_id == career_profile_id
    ).all()
    for us in all_user_skills:
        if us.skill_name not in all_role_skills:
            us.is_required_by_role = False
            
    db.commit()
