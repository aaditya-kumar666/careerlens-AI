import datetime
from sqlalchemy.orm import Session
from app.models import models
from app.services.github_service import assess_readme_quality
from app.ai.ai_provider import AIProvider

ai_provider = AIProvider()

def calculate_and_save_scores(db: Session, career_profile_id: str) -> models.CareerAnalysis:
    """Run scoring algorithm and save analysis summary."""
    profile = db.query(models.CareerProfile).filter(models.CareerProfile.id == career_profile_id).first()
    if not profile:
        raise ValueError("Profile not found")

    # Fetch UserSkills linked to the profile
    user_skills = db.query(models.UserSkill).filter(
        models.UserSkill.career_profile_id == career_profile_id
    ).all()
    
    # 1. Skill Match Score (40%)
    role_skills = [s for s in user_skills if s.is_required_by_role]
    if not role_skills:
        skill_match = 100
    else:
        total_weight = 0.0
        for s in role_skills:
            if s.status == "VERIFIED":
                total_weight += 1.0
            elif s.status == "PARTIALLY_VERIFIED":
                total_weight += 0.8
            elif s.status == "CLAIMED_BUT_UNVERIFIED":
                total_weight += 0.5
            elif s.status == "MISSING":
                total_weight += 0.0
        skill_match = int((total_weight / len(role_skills)) * 100)

    # 2. Skill Verification Score (20%)
    # Count skills claimed in the resume (skills with "resume" in evidence)
    claimed_skills = []
    for us in user_skills:
        # Check if has resume evidence
        has_resume_evidence = db.query(models.SkillEvidence).filter(
            models.SkillEvidence.user_skill_id == us.id,
            models.SkillEvidence.source_type == "resume"
        ).first()
        if has_resume_evidence:
            claimed_skills.append(us)
            
    if not claimed_skills:
        skill_verification = 100
        credibility = 100
    else:
        verified_points = 0.0
        for cs in claimed_skills:
            if cs.status == "VERIFIED":
                verified_points += 1.0
            elif cs.status == "PARTIALLY_VERIFIED":
                verified_points += 0.5
            elif cs.status == "CLAIMED_BUT_UNVERIFIED":
                verified_points += 0.0
        skill_verification = int((verified_points / len(claimed_skills)) * 100)
        credibility = skill_verification # Credibility tracks verification rate

    # 3. Portfolio Relevance & Repo-dependent scores
    github_profile = db.query(models.GitHubProfile).filter(
        models.GitHubProfile.career_profile_id == career_profile_id
    ).first()
    
    repositories = []
    if github_profile:
        repositories = db.query(models.Repository).filter(
            models.Repository.github_profile_id == github_profile.id
        ).all()

    relevance_score = 30 # Base score for no repos
    quality_score = 30
    activity_score = 30

    if repositories:
        # Relevance calculations
        # Check if repo languages/topics match role requirements
        req_keys = {s.skill_name.lower() for s in role_skills}
        relevant_repos_count = 0
        
        # Quality list
        readme_qualities = []
        
        # Activity list
        act_scores = []
        
        now = datetime.datetime.now(datetime.timezone.utc)
        
        for r in repositories:
            # Check relevance: matches topics or description keywords
            topics_set = {t.lower() for t in (r.topics or [])}
            desc_words = set((r.description or "").lower().split())
            
            is_relevant = False
            if r.primary_language and r.primary_language.lower() in req_keys:
                is_relevant = True
            elif req_keys.intersection(topics_set):
                is_relevant = True
            elif req_keys.intersection(desc_words):
                is_relevant = True
                
            if is_relevant:
                relevant_repos_count += 1
                
            # Quality check
            q = assess_readme_quality(r.readme_content)
            # Add points for stars/forks
            q += min(r.stars * 2, 10)
            readme_qualities.append(min(q, 100))
            
            # Recency check
            if r.last_updated:
                # Ensure offset-aware comparison
                last_up = r.last_updated
                if last_up.tzinfo is None:
                    last_up = last_up.replace(tzinfo=datetime.timezone.utc)
                delta = (now - last_up).days
                if delta <= 30:
                    act_scores.append(100)
                elif delta <= 90:
                    act_scores.append(80)
                elif delta <= 180:
                    act_scores.append(50)
                else:
                    act_scores.append(20)
            else:
                act_scores.append(10)
                
        relevance_score = int((relevant_repos_count / len(repositories)) * 100)
        # Ensure some realistic minimum limit for relevance if they have files
        relevance_score = max(relevance_score, 25)
        
        quality_score = int(sum(readme_qualities) / len(readme_qualities))
        activity_score = int(sum(act_scores) / len(act_scores))
        
    # Calculate Overall Readiness Score
    # Formula: Match (40%), Verification (20%), Relevance (20%), Quality (10%), Activity (10%)
    readiness = int(
        (0.40 * skill_match) +
        (0.20 * skill_verification) +
        (0.20 * relevance_score) +
        (0.10 * quality_score) +
        (0.10 * activity_score)
    )
    
    # Cap between 10 and 100
    readiness = max(10, min(100, readiness))

    # Safely extract language keys whether stored as dict, list, or null
    def parse_languages(val):
        if not val:
            return []
        if isinstance(val, dict):
            return list(val.keys())
        if isinstance(val, list):
            return val
        return []

    repos_list = [{
        "name": r.name,
        "description": r.description,
        "languages": parse_languages(r.languages),
        "topics": r.topics
    } for r in repositories]
    
    skills_list = [{
        "skill_name": us.skill_name,
        "status": us.status
    } for us in user_skills]
    
    gaps_data = ai_provider.generate_portfolio_gaps(profile.target_role, skills_list, repos_list)
    
    # Save portfolio analysis metadata
    p_analysis = db.query(models.PortfolioAnalysis).filter(
        models.PortfolioAnalysis.career_profile_id == career_profile_id
    ).first()
    
    if p_analysis:
        p_analysis.gaps_summary = gaps_data["gaps_summary"]
        p_analysis.recommendations_text = gaps_data["recommendations_text"]
    else:
        p_analysis = models.PortfolioAnalysis(
            career_profile_id=career_profile_id,
            gaps_summary=gaps_data["gaps_summary"],
            recommendations_text=gaps_data["recommendations_text"]
        )
        db.add(p_analysis)
        
    # Create or update CareerAnalysis record
    c_analysis = db.query(models.CareerAnalysis).filter(
        models.CareerAnalysis.career_profile_id == career_profile_id
    ).first()
    
    explanation_text = f"Your Career Readiness is at {readiness}%. {gaps_data['recommendations_text']}"
    
    if c_analysis:
        c_analysis.readiness_score = readiness
        c_analysis.credibility_score = credibility
        c_analysis.skill_match_score = skill_match
        c_analysis.skill_verification_score = skill_verification
        c_analysis.portfolio_relevance_score = relevance_score
        c_analysis.project_quality_score = quality_score
        c_analysis.activity_score = activity_score
        c_analysis.explanation = explanation_text
        c_analysis.created_at = datetime.datetime.now(datetime.timezone.utc)
    else:
        c_analysis = models.CareerAnalysis(
            career_profile_id=career_profile_id,
            readiness_score=readiness,
            credibility_score=credibility,
            skill_match_score=skill_match,
            skill_verification_score=skill_verification,
            portfolio_relevance_score=relevance_score,
            project_quality_score=quality_score,
            activity_score=activity_score,
            explanation=explanation_text
        )
        db.add(c_analysis)
        
    db.commit()
    db.refresh(c_analysis)
    return c_analysis
