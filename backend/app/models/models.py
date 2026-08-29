import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database.connection import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=utc_now)
    
    profiles = relationship("CareerProfile", back_populates="user", cascade="all, delete-orphan")


class CareerProfile(Base):
    __tablename__ = "career_profiles"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    target_role = Column(String, nullable=False)
    job_description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    
    user = relationship("User", back_populates="profiles")
    resume = relationship("Resume", back_populates="profile", uselist=False, cascade="all, delete-orphan")
    github_profile = relationship("GitHubProfile", back_populates="profile", uselist=False, cascade="all, delete-orphan")
    skills = relationship("UserSkill", back_populates="profile", cascade="all, delete-orphan")
    analyses = relationship("CareerAnalysis", back_populates="profile", cascade="all, delete-orphan")
    portfolio_analyses = relationship("PortfolioAnalysis", back_populates="profile", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="profile", cascade="all, delete-orphan")
    roadmaps = relationship("Roadmap", back_populates="profile", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    career_profile_id = Column(String, ForeignKey("career_profiles.id"), nullable=False)
    file_name = Column(String, nullable=False)
    extracted_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    
    profile = relationship("CareerProfile", back_populates="resume")


class GitHubProfile(Base):
    __tablename__ = "github_profiles"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    career_profile_id = Column(String, ForeignKey("career_profiles.id"), nullable=False)
    username = Column(String, nullable=False)
    followers = Column(Integer, default=0)
    following = Column(Integer, default=0)
    public_repos = Column(Integer, default=0)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    
    profile = relationship("CareerProfile", back_populates="github_profile")
    repositories = relationship("Repository", back_populates="github_profile", cascade="all, delete-orphan")


class Repository(Base):
    __tablename__ = "repositories"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    github_profile_id = Column(String, ForeignKey("github_profiles.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    primary_language = Column(String, nullable=True)
    languages = Column(JSON, nullable=True) # Dict of lang -> bytes
    topics = Column(JSON, nullable=True) # List of strings
    stars = Column(Integer, default=0)
    forks = Column(Integer, default=0)
    readme_content = Column(Text, nullable=True)
    repo_url = Column(String, nullable=True)
    last_updated = Column(DateTime, nullable=True)
    
    github_profile = relationship("GitHubProfile", back_populates="repositories")


class UserSkill(Base):
    __tablename__ = "user_skills"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    career_profile_id = Column(String, ForeignKey("career_profiles.id"), nullable=False)
    skill_name = Column(String, nullable=False)
    category = Column(String, nullable=False) # e.g. language, framework, database, tool, cloud, soft_skill
    status = Column(String, nullable=False) # VERIFIED, PARTIALLY_VERIFIED, CLAIMED_BUT_UNVERIFIED, MISSING, NOT_REQUIRED
    is_required_by_role = Column(Boolean, default=False)
    
    profile = relationship("CareerProfile", back_populates="skills")
    evidences = relationship("SkillEvidence", back_populates="user_skill", cascade="all, delete-orphan")


class SkillEvidence(Base):
    __tablename__ = "skill_evidences"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_skill_id = Column(String, ForeignKey("user_skills.id"), nullable=False)
    source_type = Column(String, nullable=False) # resume, repository
    source_name = Column(String, nullable=False) # e.g. "Resume PDF" or repository name
    confidence = Column(Float, default=1.0)
    details = Column(Text, nullable=True)
    
    user_skill = relationship("UserSkill", back_populates="evidences")


class CareerAnalysis(Base):
    __tablename__ = "career_analyses"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    career_profile_id = Column(String, ForeignKey("career_profiles.id"), nullable=False)
    readiness_score = Column(Integer, default=0)
    credibility_score = Column(Integer, default=0)
    skill_match_score = Column(Integer, default=0)
    skill_verification_score = Column(Integer, default=0)
    portfolio_relevance_score = Column(Integer, default=0)
    project_quality_score = Column(Integer, default=0)
    activity_score = Column(Integer, default=0)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    
    profile = relationship("CareerProfile", back_populates="analyses")


class PortfolioAnalysis(Base):
    __tablename__ = "portfolio_analyses"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    career_profile_id = Column(String, ForeignKey("career_profiles.id"), nullable=False)
    gaps_summary = Column(JSON, nullable=True) # list of gap strings
    recommendations_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    
    profile = relationship("CareerProfile", back_populates="portfolio_analyses")


class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    career_profile_id = Column(String, ForeignKey("career_profiles.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(String, nullable=False) # Beginner, Intermediate, Advanced
    time_estimate = Column(String, nullable=False)
    skills_gained = Column(JSON, nullable=True) # list of strings
    tech_stack = Column(JSON, nullable=True) # list of strings
    milestones = Column(JSON, nullable=True) # list of strings
    
    profile = relationship("CareerProfile", back_populates="recommendations")


class Roadmap(Base):
    __tablename__ = "roadmaps"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    career_profile_id = Column(String, ForeignKey("career_profiles.id"), nullable=False)
    title = Column(String, nullable=False)
    created_at = Column(DateTime, default=utc_now)
    
    profile = relationship("CareerProfile", back_populates="roadmaps")
    items = relationship("RoadmapItem", back_populates="roadmap", cascade="all, delete-orphan")


class RoadmapItem(Base):
    __tablename__ = "roadmap_items"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    roadmap_id = Column(String, ForeignKey("roadmaps.id"), nullable=False)
    week_number = Column(Integer, nullable=False)
    skill = Column(String, nullable=False)
    explanation = Column(Text, nullable=False)
    objective = Column(Text, nullable=False)
    task = Column(Text, nullable=False)
    milestone = Column(Text, nullable=False)
    
    roadmap = relationship("Roadmap", back_populates="items")
