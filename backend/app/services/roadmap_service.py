from sqlalchemy.orm import Session
from app.models import models
from app.ai.ai_provider import AIProvider
from app.utils.prerequisites import get_direct_prerequisites, is_prerequisite_satisfied
import json

ai_provider = AIProvider()

# Local templates for fallback generation
LOCAL_TEMPLATES = {
    "Python": {
        "explanation": "Python is the core programming language for target engineering tasks. Your profile needs Python verified evidence.",
        "objective": "Master Python syntax, object-oriented concepts, and basic data processing structures.",
        "task": "Create a command line data analysis scripts folder in Git.",
        "milestone": "Command line python scripts committed to GitHub."
    },
    "SQL": {
        "explanation": "SQL is essential for database querying and data retrieval operations required for the role.",
        "objective": "Learn database design, basic SQL statements (SELECT, JOIN, WHERE), and aggregate queries.",
        "task": "Create a Student Performance Database using SQLite and write query scripts.",
        "milestone": "Database query scripts pushed to GitHub."
    },
    "Statistics": {
        "explanation": "Statistics provides the mathematical foundation for evaluating models and experimental data.",
        "objective": "Understand probability distributions, hypothesis testing, and central tendency metrics.",
        "task": "Analyze a public dataset and output statistical summary summaries in a Jupyter Notebook.",
        "milestone": "Statistics analysis notebook committed."
    },
    "Machine Learning": {
        "explanation": "Machine Learning is the core engine behind predictive modeling pipelines for the target role.",
        "objective": "Understand supervised algorithms, overfitting, and validation metrics.",
        "task": "Build a predictive classifier using Scikit-Learn on a local csv dataset.",
        "milestone": "ML model script with accuracy logs committed."
    },
    "Docker": {
        "explanation": "Docker containerizes application environments, ensuring portability and transparent deployment configurations.",
        "objective": "Understand containers, images, port routing, and multi-container docker-compose setups.",
        "task": "Write a Dockerfile and docker-compose.yml configuration to launch an API server.",
        "milestone": "Dockerfile configuration file pushed to GitHub."
    },
    "FastAPI": {
        "explanation": "FastAPI is a modern, high-performance web framework for building production backend microservices.",
        "objective": "Build secure REST API endpoints with Pydantic query validations.",
        "task": "Build a FastAPI REST backend with JSON input validation checks.",
        "milestone": "FastAPI server code pushed to GitHub."
    },
    "Git": {
        "explanation": "Git is the industry standard version control system for tracking incremental changes.",
        "objective": "Master staging commits, branching workflows, and repo pushes.",
        "task": "Commit changes in small batches across development branches.",
        "milestone": "At least 5 incremental commits in git logs."
    },
    "AWS": {
        "explanation": "AWS hosts cloud servers and services required for production deployments.",
        "objective": "Understand cloud storage (S3) and server deployment configs (EC2).",
        "task": "Configure local credentials and interact with cloud registry buckets.",
        "milestone": "AWS configuration files pushed."
    }
}

def generate_and_save_roadmap(db: Session, career_profile_id: str) -> models.Roadmap:
    """Generate week-by-week personalized learning roadmap respecting prerequisites and seeding resources."""
    profile = db.query(models.CareerProfile).filter(models.CareerProfile.id == career_profile_id).first()
    if not profile:
        raise ValueError("Profile not found")

    user_skills = db.query(models.UserSkill).filter(
        models.UserSkill.career_profile_id == career_profile_id
    ).all()
    
    # 1. Partition skills into verified vs gaps
    verified_skills = [s for s in user_skills if s.status in ["VERIFIED", "PARTIALLY_VERIFIED"]]
    gap_skills = [s for s in user_skills if s.status in ["MISSING", "CLAIMED_BUT_UNVERIFIED"]]
    
    verified_names = {s.skill_name for s in verified_skills}
    
    # 2. Sort gap skills deterministically based on prerequisite graph dependencies
    def get_sort_key(s):
        # Prereqs met goes first (0), unmet goes second (1)
        prereq_satisfied = 0 if is_prerequisite_satisfied(s.skill_name, verified_names) else 1
        # Required goes first (0), preferred goes second (1)
        importance = 0 if s.is_required_by_role else 1
        # Missing goes first (0), claimed unverified second (1)
        gap = 0 if s.status == "MISSING" else 1
        return (prereq_satisfied, importance, gap, s.skill_name)
        
    sorted_gaps = sorted(gap_skills, key=get_sort_key)
    
    # Select top 4 skills for the 4-week roadmap
    selected_skills = []
    for g in sorted_gaps:
        if len(selected_skills) < 4:
            selected_skills.append(g)
            
    # Fallback to general skills if gap list is empty
    defaults = ["Git", "Python", "SQL", "Docker"]
    for d in defaults:
        if len(selected_skills) < 4:
            # Check if user already verified it
            if d not in verified_names and not any(x.skill_name == d for x in selected_skills):
                # Create a temporary UserSkill model block
                dummy_skill = models.UserSkill(
                    skill_name=d,
                    status="MISSING",
                    is_required_by_role=True
                )
                selected_skills.append(dummy_skill)
                
    # Fill remaining spots with templates if still short
    fallback_keys = list(LOCAL_TEMPLATES.keys())
    while len(selected_skills) < 4:
        next_fallback = fallback_keys[len(selected_skills) % len(fallback_keys)]
        dummy_skill = models.UserSkill(
            skill_name=next_fallback,
            status="MISSING",
            is_required_by_role=True
        )
        selected_skills.append(dummy_skill)
        
    # Get user's existing repositories to avoid duplicate projects
    github_profile = db.query(models.GitHubProfile).filter(
        models.GitHubProfile.career_profile_id == career_profile_id
    ).first()
    
    repositories = []
    if github_profile:
        repositories = db.query(models.Repository).filter(
            models.Repository.github_profile_id == github_profile.id
        ).all()
    repo_names_lower = {r.name.lower() for r in repositories}
    
    # 3. Compile weekly steps deterministically
    items_data = []
    for index, skill_obj in enumerate(selected_skills):
        week = index + 1
        skill = skill_obj.skill_name
        
        # Priority rules
        prereqs_met = is_prerequisite_satisfied(skill, verified_names)
        if skill_obj.is_required_by_role and prereqs_met:
            priority = "HIGH"
        elif skill_obj.is_required_by_role or prereqs_met:
            priority = "MEDIUM"
        else:
            priority = "LOW"
            
        # Target levels
        current_lvl = "Not Started" if skill_obj.status == "MISSING" else "Beginner"
        target_lvl = "Intermediate" if priority == "HIGH" else "Advanced"
        
        # Prerequisites list
        prereqs = get_direct_prerequisites(skill)
        
        # Estimates
        time_estimates = {
            "Python": "1-2 weeks",
            "SQL": "2-3 weeks",
            "Statistics": "2-3 weeks",
            "Machine Learning": "4-6 weeks",
            "Docker": "1-2 weeks",
            "React": "2-3 weeks",
            "FastAPI": "1-2 weeks",
            "Git": "1 week"
        }
        est_time = time_estimates.get(skill, "2-3 weeks")
        
        # Why learn (evidence-based)
        if skill_obj.status == "CLAIMED_BUT_UNVERIFIED":
            why_learn = f"{skill} is a priority. Your resume claims it, but your current portfolio does not provide strong verified evidence."
        elif skill_obj.status == "MISSING":
            why_learn = f"{skill} is a critical required gap for the '{profile.target_role}' role."
        else:
            why_learn = f"Mastering {skill} is a prerequisite sequence mapping for subsequent role capabilities."
            
        # Practice checklist
        practice_tasks = {
            "Python": ["Complete 5 syntax challenges on freeCodeCamp", "Write script to parse local JSON configuration files"],
            "SQL": ["Complete Kaggle SQL Zoo exercises", "Design 5 SELECT queries using JOINs"],
            "Statistics": ["Run t-tests on a public dataset", "Plot statistical data summaries in a Jupyter notebook"],
            "Machine Learning": ["Train scikit-learn models on local housing data", "Evaluate precision/recall scores"],
            "Docker": ["Create a Dockerfile configuration", "Run multi-container servers with docker-compose"],
            "FastAPI": ["Build API endpoints with Pydantic", "Add validation models and test JSON outputs"],
            "Git": ["Perform branch creations", "Resolve code merges and check commit hashes"],
            "AWS": ["Configure IAM credential locks", "Deploy EC2 clusters and mount S3 buckets"]
        }
        practice = practice_tasks.get(skill, [f"Build a small console script demonstrating {skill} concepts", "Document instructions in a local repository"])
        
        # Project recommendation considering existing projects (no duplication)
        project_rec = {
            "title": f"{skill} Hands-on Build",
            "description": f"A dedicated project showing technical proficiency in {skill}.",
            "difficulty": current_lvl
        }
        
        if skill == "Python":
            if any("expense" in n or "tracker" in n for n in repo_names_lower):
                project_rec = {
                    "title": "FastAPI + Docker Expense Tracker Extension",
                    "description": "Containerize and deploy your existing expense tracker with automated API validations.",
                    "difficulty": "Intermediate"
                }
            else:
                project_rec = {
                    "title": "CLI Expense Tracker Tool",
                    "description": "Create a command line Python application tracking expense files, saving records as JSON.",
                    "difficulty": "Beginner"
                }
        elif skill == "SQL":
            if any("dashboard" in n or "analytics" in n for n in repo_names_lower):
                project_rec = {
                    "title": "PostgreSQL API Database Migration",
                    "description": "Migrate your analytics project into a robust relational database with schemas.",
                    "difficulty": "Intermediate"
                }
            else:
                project_rec = {
                    "title": "Student Performance Analytics Dashboard",
                    "description": "Design SQL databases holding student grades and write JOIN query reports.",
                    "difficulty": "Beginner"
                }
        elif skill == "Machine Learning":
            project_rec = {
                "title": "Credit Fraud Classifier Pipeline",
                "description": "Train a model using Scikit-Learn to detect transaction fraud and plot confusion metrics.",
                "difficulty": "Intermediate"
            }
        elif skill == "Docker":
            project_rec = {
                "title": "Containerized FastAPI REST Service",
                "description": "Write a multi-stage Dockerfile packaging a server template for cloud deployments.",
                "difficulty": "Beginner"
            }
        elif skill == "FastAPI":
            project_rec = {
                "title": "Personal Task Manager REST API",
                "description": "Create a task tracking microservice using SQLite database connections and Swagger guides.",
                "difficulty": "Beginner"
            }
            
        # Core fallback fields
        fallback_data = LOCAL_TEMPLATES.get(skill, {
            "explanation": why_learn,
            "objective": f"Learn key paradigms of {skill}.",
            "task": f"Build a {project_rec['title']} project.",
            "milestone": f"Source code committed to GitHub."
        })
        
        items_data.append({
            "week_number": week,
            "skill": skill,
            "explanation": fallback_data["explanation"],
            "objective": fallback_data["objective"],
            "task": fallback_data["task"],
            "milestone": fallback_data["milestone"],
            "why_it_matters": why_learn,
            "current_level": current_lvl,
            "target_level": target_lvl,
            "priority": priority,
            "prerequisites": json.dumps(prereqs),
            "estimated_time": est_time,
            "status": "NOT_STARTED",
            "practice_resources": json.dumps(practice),
            "project_recommendation": json.dumps(project_rec)
        })
        
    # 4. Clean previous roadmaps
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

    # 5. Save items in SQLite
    for item in items_data:
        db_item = models.RoadmapItem(
            roadmap_id=roadmap.id,
            week_number=item["week_number"],
            skill=item["skill"],
            explanation=item["explanation"],
            objective=item["objective"],
            task=item["task"],
            milestone=item["milestone"],
            why_it_matters=item["why_it_matters"],
            current_level=item["current_level"],
            target_level=item["target_level"],
            priority=item["priority"],
            prerequisites=item["prerequisites"],
            estimated_time=item["estimated_time"],
            status=item["status"],
            practice_resources=item["practice_resources"],
            project_recommendation=item["project_recommendation"]
        )
        db.add(db_item)
        
    db.commit()
    db.refresh(roadmap)
    return roadmap
