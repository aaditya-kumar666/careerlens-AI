from sqlalchemy.orm import Session
from app.models import models

PROJECT_TEMPLATES = [
    {
        "title": "End-to-End ML Deployment Platform",
        "description": "Build and containerize a FastAPI model server, build automated test workflows, and deploy it to a AWS ECS/Fargate container instance.",
        "difficulty": "Intermediate",
        "time_estimate": "2-3 weeks",
        "skills_gained": ["FastAPI", "Docker", "AWS", "Python", "CI/CD"],
        "tech_stack": ["Python", "FastAPI", "Docker", "AWS ECS", "GitHub Actions"],
        "milestones": [
            "Milestone 1: Create a prediction API in FastAPI with input schemas validation.",
            "Milestone 2: Write a Dockerfile to containerize the server and test it locally.",
            "Milestone 3: Write GitHub Actions workflow to auto-build Docker images.",
            "Milestone 4: Deploy the container to AWS using ECS and expose the API endpoint."
        ]
    },
    {
        "title": "Real-time Streaming Feature Pipeline",
        "description": "Implement a data pipeline that fetches live stream transactions, extracts features, and stores them in a Redis store for low-latency ML scoring.",
        "difficulty": "Advanced",
        "time_estimate": "3-4 weeks",
        "skills_gained": ["Kafka", "Redis", "SQL", "Python", "Docker"],
        "tech_stack": ["Python", "Apache Kafka", "Redis", "PostgreSQL"],
        "milestones": [
            "Milestone 1: Setup Docker Compose with Kafka, Redis, and Postgres services.",
            "Milestone 2: Build a Kafka producer script to mock streaming records.",
            "Milestone 3: Build consumer logic to process features and store them in Redis.",
            "Milestone 4: Write testing scripts to measure feature lookup latency."
        ]
    },
    {
        "title": "Serverless Analytics Dashboard",
        "description": "Build a responsive web application that displays cloud activity metrics, powered by serverless lambda endpoints and a React frontend.",
        "difficulty": "Intermediate",
        "time_estimate": "2-3 weeks",
        "skills_gained": ["React", "TypeScript", "AWS", "Node.js", "SQL"],
        "tech_stack": ["React", "TypeScript", "AWS Lambda", "DynamoDB", "Tailwind CSS"],
        "milestones": [
            "Milestone 1: Scaffold React dashboard layout using Tailwind CSS.",
            "Milestone 2: Deploy AWS Lambda endpoints writing to database tables.",
            "Milestone 3: Connect API Gateway requests to the React state modules.",
            "Milestone 4: Setup static hosting on AWS S3 with CloudFront CDN cache rules."
        ]
    },
    {
        "title": "Cloud Infrastructure & GitOps Pipeline",
        "description": "Configure IaC scripts to provision a secure Kubernetes cluster on GCP, and sync app builds via ArgoCD GitOps workflows.",
        "difficulty": "Advanced",
        "time_estimate": "3-4 weeks",
        "skills_gained": ["Kubernetes", "GCP", "Docker", "Terraform", "CI/CD"],
        "tech_stack": ["Terraform", "Google Kubernetes Engine (GKE)", "Docker", "ArgoCD", "Git"],
        "milestones": [
            "Milestone 1: Write Terraform scripts to provision GKE clusters.",
            "Milestone 2: Setup Kubernetes manifests for load-balanced containers.",
            "Milestone 3: Install ArgoCD controller on GKE cluster and map repo git webhooks.",
            "Milestone 4: Run a simulated app version update push and track automatic sync triggers."
        ]
    }
]

def generate_and_save_recommendations(db: Session, career_profile_id: str):
    """Scan user gaps and recommend projects covering missing skills."""
    # Retrieve user skills
    user_skills = db.query(models.UserSkill).filter(
        models.UserSkill.career_profile_id == career_profile_id
    ).all()
    
    # Missing / unverified skills set
    gap_skills = {
        us.skill_name.lower() for us in user_skills 
        if us.status in ["MISSING", "CLAIMED_BUT_UNVERIFIED"]
    }
    
    # Clean previous recommendations
    db.query(models.Recommendation).filter(
        models.Recommendation.career_profile_id == career_profile_id
    ).delete()
    db.commit()

    # Rank projects based on coverage of gap skills
    scored_projects = []
    for temp in PROJECT_TEMPLATES:
        temp_skills = {s.lower() for s in temp["skills_gained"]}
        # Count overlapping skills
        match_count = len(temp_skills.intersection(gap_skills))
        scored_projects.append((match_count, temp))

    # Sort descending by match count
    scored_projects.sort(key=lambda x: x[0], reverse=True)

    # Recommend top 2-3 projects
    recommended = []
    for match_cnt, p in scored_projects[:2]:
        rec_model = models.Recommendation(
            career_profile_id=career_profile_id,
            title=p["title"],
            description=p["description"],
            difficulty=p["difficulty"],
            time_estimate=p["time_estimate"],
            skills_gained=p["skills_gained"],
            tech_stack=p["tech_stack"],
            milestones=p["milestones"]
        )
        db.add(rec_model)
        recommended.append(rec_model)

    db.commit()
    return recommended
