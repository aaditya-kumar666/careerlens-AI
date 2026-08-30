from typing import List, Dict, Set

# Prerequisite map defining explicit learning order dependencies
PREREQUISITES_MAP: Dict[str, List[str]] = {
    # Data Science / Machine Learning / AI
    "NumPy": ["Python"],
    "Pandas": ["Python"],
    "Statistics": ["Python"],
    "Scikit-Learn": ["Python", "Pandas", "Statistics"],
    "Machine Learning": ["Python", "Pandas", "Statistics", "Scikit-Learn"],
    "PyTorch": ["Python", "Machine Learning"],
    "TensorFlow": ["Python", "Machine Learning"],
    "Deep Learning": ["Python", "PyTorch", "TensorFlow"],
    "LLMs": ["Python", "Deep Learning"],
    "Hugging Face": ["Python", "PyTorch"],
    "LangChain": ["Python", "LLMs"],
    "Vector Databases": ["Python", "SQL"],
    "Pinecone": ["Vector Databases"],
    "ChromaDB": ["Vector Databases"],
    "MLOps": ["Docker", "Machine Learning"],
    
    # Web / Frontend Development
    "CSS": ["HTML"],
    "JavaScript": ["HTML", "CSS"],
    "TypeScript": ["JavaScript"],
    "React": ["JavaScript"],
    "Next.js": ["React", "TypeScript"],
    "Node.js": ["JavaScript"],
    "Express": ["Node.js"],
    "NestJS": ["Node.js", "TypeScript"],
    "Tailwind CSS": ["CSS"],
    
    # Backend / System / Database Track
    "FastAPI": ["Python"],
    "Django": ["Python"],
    "Flask": ["Python"],
    "PostgreSQL": ["SQL"],
    "MySQL": ["SQL"],
    "Database Fundamentals": ["SQL"],
    "Advanced SQL": ["SQL"],
    "Data Engineering": ["Advanced SQL", "Python"],
    
    # DevOps / Infrastructure
    "Docker": ["Git"],
    "Kubernetes": ["Docker"],
    "Terraform": ["AWS"],
    "CI/CD": ["Git"],
    "GitHub Actions": ["CI/CD"],
    "GitLab CI": ["CI/CD"],
}

def get_direct_prerequisites(skill_name: str) -> List[str]:
    """Retrieve direct prerequisites for a skill."""
    # Handle case insensitivity
    for key, value in PREREQUISITES_MAP.items():
        if key.lower() == skill_name.lower():
            return value
    return []

def is_prerequisite_satisfied(skill_name: str, verified_skills: Set[str]) -> bool:
    """
    Check if all direct prerequisites for a skill are satisfied by user's verified skills list.
    We check both exact and case-insensitive matches.
    """
    prereqs = get_direct_prerequisites(skill_name)
    if not prereqs:
        return True
        
    verified_lower = {v.lower() for v in verified_skills}
    for p in prereqs:
        if p.lower() not in verified_lower:
            return False
            
    return True
