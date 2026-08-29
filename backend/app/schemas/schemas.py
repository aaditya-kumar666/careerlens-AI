import datetime
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Optional, Any

# Auth Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Onboarding Schemas
class CareerProfileCreate(BaseModel):
    target_role: str
    job_description: Optional[str] = None

class CareerProfileResponse(BaseModel):
    id: str
    user_id: str
    target_role: str
    job_description: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Resume Schema
class ResumeResponse(BaseModel):
    id: str
    file_name: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# GitHub Schema
class RepositoryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    primary_language: Optional[str] = None
    languages: Optional[Dict[str, int]] = None
    topics: Optional[List[str]] = None
    stars: int
    forks: int
    repo_url: Optional[str] = None
    last_updated: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class GitHubProfileResponse(BaseModel):
    id: str
    username: str
    followers: int
    following: int
    public_repos: int
    avatar_url: Optional[str] = None
    repositories: List[RepositoryResponse] = []

    class Config:
        from_attributes = True

# Skill Verification Schema
class SkillEvidenceResponse(BaseModel):
    id: str
    source_type: str
    source_name: str
    confidence: float
    details: Optional[str] = None

    class Config:
        from_attributes = True

class UserSkillResponse(BaseModel):
    id: str
    skill_name: str
    category: str
    status: str
    is_required_by_role: bool
    evidences: List[SkillEvidenceResponse] = []

    class Config:
        from_attributes = True

# Career Analysis Schema
class CareerAnalysisResponse(BaseModel):
    id: str
    readiness_score: int
    credibility_score: int
    skill_match_score: int
    skill_verification_score: int
    portfolio_relevance_score: int
    project_quality_score: int
    activity_score: int
    explanation: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Portfolio Analysis Schema
class PortfolioAnalysisResponse(BaseModel):
    id: str
    gaps_summary: List[str]
    recommendations_text: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Project Recommendation Schema
class RecommendationResponse(BaseModel):
    id: str
    title: str
    description: str
    difficulty: str
    time_estimate: str
    skills_gained: List[str]
    tech_stack: List[str]
    milestones: List[str]

    class Config:
        from_attributes = True

# Roadmap Schema
class RoadmapItemResponse(BaseModel):
    id: str
    week_number: int
    skill: str
    explanation: str
    objective: str
    task: str
    milestone: str

    class Config:
        from_attributes = True

class RoadmapResponse(BaseModel):
    id: str
    title: str
    items: List[RoadmapItemResponse] = []

    class Config:
        from_attributes = True

# Simulator Schema
class SimulationInput(BaseModel):
    skills_to_add: List[str]

class SimulationResponse(BaseModel):
    current_readiness: int
    simulated_readiness: int
    improvement: int
    breakdown_current: Dict[str, int]
    breakdown_simulated: Dict[str, int]
    skills_simulated: List[str]
