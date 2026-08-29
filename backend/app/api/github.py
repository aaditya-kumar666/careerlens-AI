from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models import models
from app.schemas import schemas
from app.utils.auth import get_current_user
from app.services.github_service import fetch_github_profile, fetch_github_repositories

router = APIRouter(prefix="/github", tags=["GitHub"])

@router.post("/connect", response_model=schemas.GitHubProfileResponse)
def connect_github(
    username: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.CareerProfile).filter(models.CareerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configure your career profile first before connecting GitHub."
        )

    username = username.strip()
    if not username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub username cannot be empty."
        )

    # 1. Fetch profile metadata
    gh_data = fetch_github_profile(username)
    
    # Create or update GitHubProfile record
    gh_profile = db.query(models.GitHubProfile).filter(models.GitHubProfile.career_profile_id == profile.id).first()
    if gh_profile:
        gh_profile.username = username
        gh_profile.followers = gh_data["followers"]
        gh_profile.following = gh_data["following"]
        gh_profile.public_repos = gh_data["public_repos"]
        gh_profile.avatar_url = gh_data["avatar_url"]
    else:
        gh_profile = models.GitHubProfile(
            career_profile_id=profile.id,
            username=username,
            followers=gh_data["followers"],
            following=gh_data["following"],
            public_repos=gh_data["public_repos"],
            avatar_url=gh_data["avatar_url"]
        )
        db.add(gh_profile)
    
    # Save profile to get ID
    db.commit()
    db.refresh(gh_profile)

    # 2. Fetch and write repositories
    repos_data = fetch_github_repositories(username)
    
    # Delete previous repository records for this profile
    db.query(models.Repository).filter(models.Repository.github_profile_id == gh_profile.id).delete()
    
    for r in repos_data:
        # Parse last updated date
        updated_dt = None
        if r.get("last_updated"):
            try:
                # Parse ISO date string
                date_str = r.get("last_updated").replace("Z", "+00:00")
                from datetime import datetime
                updated_dt = datetime.fromisoformat(date_str)
            except Exception:
                pass
                
        repo_record = models.Repository(
            github_profile_id=gh_profile.id,
            name=r.get("name"),
            description=r.get("description"),
            primary_language=r.get("primary_language"),
            languages=r.get("languages"),
            topics=r.get("topics"),
            stars=r.get("stars", 0),
            forks=r.get("forks", 0),
            readme_content=r.get("readme_content"),
            repo_url=r.get("repo_url"),
            last_updated=updated_dt
        )
        db.add(repo_record)
        
    db.commit()
    db.refresh(gh_profile)
    return gh_profile
