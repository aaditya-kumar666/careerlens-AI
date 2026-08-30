import os
import json
import re
from typing import List, Dict, Any
from google import genai
from google.genai import types

# Predefined role-based skill taxonomy for local fallbacks
ROLE_SKILL_DATASET = {
    "Machine Learning Engineer": {
        "required_skills": ["Python", "PyTorch", "TensorFlow", "Scikit-Learn", "Docker", "AWS", "Git"],
        "preferred_skills": ["FastAPI", "SQL", "Kubernetes", "Linux", "MLOps"],
        "tools": ["Git", "Docker", "AWS", "MLflow"],
        "frameworks": ["PyTorch", "TensorFlow", "FastAPI", "Flask", "Scikit-Learn"],
        "categories": {
            "Language": ["Python", "C++", "SQL"],
            "Framework": ["PyTorch", "TensorFlow", "Scikit-Learn", "FastAPI"],
            "Tool": ["Docker", "Git", "Kubernetes"],
            "Cloud": ["AWS", "GCP"],
            "Database": ["PostgreSQL", "Redis"]
        }
    },
    "AI Engineer": {
        "required_skills": ["Python", "PyTorch", "Hugging Face", "LLMs", "FastAPI", "Git", "Docker"],
        "preferred_skills": ["LangChain", "Vector Databases", "GCP", "MLOps"],
        "tools": ["Git", "Docker", "Pinecone", "ChromaDB"],
        "frameworks": ["PyTorch", "FastAPI", "LangChain", "LlamaIndex"],
        "categories": {
            "Language": ["Python", "JavaScript"],
            "Framework": ["PyTorch", "FastAPI", "LangChain", "Hugging Face"],
            "Tool": ["Docker", "Git", "Kubernetes"],
            "Cloud": ["AWS", "GCP", "OpenAI"],
            "Database": ["Pinecone", "ChromaDB", "PostgreSQL"]
        }
    },
    "Data Scientist": {
        "required_skills": ["Python", "R", "SQL", "Pandas", "NumPy", "Scikit-Learn", "Statistics"],
        "preferred_skills": ["Tableau", "PowerBI", "Docker", "Git", "Machine Learning"],
        "tools": ["Git", "Tableau", "Jupyter", "SQL Server"],
        "frameworks": ["Scikit-Learn", "Pandas", "NumPy", "Matplotlib", "Seaborn"],
        "categories": {
            "Language": ["Python", "R", "SQL"],
            "Framework": ["Scikit-Learn", "Pandas", "NumPy", "Statsmodels"],
            "Tool": ["Git", "Jupyter", "Tableau"],
            "Cloud": ["AWS", "Snowflake"],
            "Database": ["PostgreSQL", "MySQL"]
        }
    },
    "Full Stack Developer": {
        "required_skills": ["JavaScript", "TypeScript", "React", "Node.js", "Express", "HTML", "CSS", "Git", "SQL"],
        "preferred_skills": ["Docker", "AWS", "Next.js", "MongoDB", "PostgreSQL", "Tailwind CSS"],
        "tools": ["Git", "Docker", "Webpack", "Vite", "NPM"],
        "frameworks": ["React", "Express", "Next.js", "Tailwind CSS", "NestJS"],
        "categories": {
            "Language": ["JavaScript", "TypeScript", "HTML", "CSS", "SQL"],
            "Framework": ["React", "Express", "Next.js", "Tailwind CSS"],
            "Tool": ["Git", "Docker", "Vite"],
            "Cloud": ["AWS", "Vercel"],
            "Database": ["PostgreSQL", "MongoDB", "Redis"]
        }
    },
    "Backend Developer": {
        "required_skills": ["Python", "Go", "Java", "Node.js", "SQL", "Express", "FastAPI", "Docker", "Git"],
        "preferred_skills": ["PostgreSQL", "Redis", "AWS", "Kubernetes", "gRPC", "MongoDB"],
        "tools": ["Git", "Docker", "Kubernetes", "Postman"],
        "frameworks": ["FastAPI", "Express", "Django", "Spring Boot"],
        "categories": {
            "Language": ["Python", "Go", "Java", "SQL"],
            "Framework": ["FastAPI", "Express", "Django", "Spring Boot"],
            "Tool": ["Docker", "Git", "Kubernetes"],
            "Cloud": ["AWS", "GCP"],
            "Database": ["PostgreSQL", "Redis", "MongoDB"]
        }
    },
    "DevOps Engineer": {
        "required_skills": ["Bash", "Python", "Docker", "Kubernetes", "AWS", "Terraform", "CI/CD", "Git"],
        "preferred_skills": ["Linux", "Prometheus", "Grafana", "Ansible", "GCP", "Jenkins"],
        "tools": ["Docker", "Kubernetes", "Terraform", "Git", "Jenkins", "Ansible"],
        "frameworks": ["GitHub Actions", "GitLab CI"],
        "categories": {
            "Language": ["Python", "Bash", "YAML"],
            "Framework": ["GitHub Actions", "GitLab CI"],
            "Tool": ["Docker", "Kubernetes", "Terraform", "Git", "Jenkins"],
            "Cloud": ["AWS", "GCP", "Azure"],
            "Database": ["Redis", "Elasticsearch"]
        }
    }
}

# Add standard software engineer fallback
ROLE_SKILL_DATASET["Software Engineer"] = ROLE_SKILL_DATASET["Full Stack Developer"]
ROLE_SKILL_DATASET["Cybersecurity Analyst"] = {
    "required_skills": ["Linux", "Python", "SQL", "Wireshark", "Nmap", "Network Security", "Cryptography"],
    "preferred_skills": ["SIEM", "Docker", "AWS", "Metasploit", "Penetration Testing"],
    "tools": ["Wireshark", "Nmap", "Metasploit", "Splunk", "Git"],
    "frameworks": ["OWASP", "MITRE ATT&CK"],
    "categories": {
        "Language": ["Python", "Bash", "SQL"],
        "Framework": ["OWASP"],
        "Tool": ["Wireshark", "Nmap", "Metasploit", "Git"],
        "Cloud": ["AWS"],
        "Database": ["MySQL"]
    }
}

def clean_json_response(text: str) -> str:
    """Strip markdown code blocks from response to get clean JSON."""
    clean = text.strip()
    if clean.startswith("```json"):
        clean = clean[7:]
    elif clean.startswith("```"):
        clean = clean[3:]
    if clean.endswith("```"):
        clean = clean[:-3]
    return clean.strip()

class AIProvider:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.client = None
        if self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"Error creating Gemini client: {e}")

    def extract_skills_from_resume(self, resume_text: str) -> List[Dict[str, str]]:
        """Extract technologies and skills from resume text, categorizing them."""
        if self.client:
            prompt = f"""
            Analyze the following resume text and extract all technical skills, programming languages, frameworks, databases, cloud platforms, and developer tools.
            Return a JSON list of objects, where each object has:
            - "skill_name": Name of the skill (properly capitalized, e.g. "React" instead of "reactjs")
            - "category": Choose from: "Language", "Framework", "Tool", "Database", "Cloud", "Soft Skill"

            Return ONLY the JSON array, no conversational text or formatting outside of the JSON block.

            Resume text:
            {resume_text}
            """
            try:
                res = self.client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt
                )
                raw_json = clean_json_response(res.text)
                return json.loads(raw_json)
            except Exception as e:
                print(f"Gemini resume skill extraction failed: {e}. Falling back to local NLP.")

        # Local NLP Fallback (using regex search against taxonomy database keys)
        from app.services.github_service import SKILL_TAXONOMY
        extracted = []
        resume_lower = resume_text.lower()
        
        for key, details in SKILL_TAXONOMY.items():
            # Match exact boundary word
            pattern = r'\b' + re.escape(key) + r'\b'
            if re.search(pattern, resume_lower):
                extracted.append({
                    "skill_name": details["name"],
                    "category": details["category"]
                })
        
        # Add basic soft skills if found
        soft_skills = ["communication", "leadership", "agile", "scrum", "problem solving", "collaboration"]
        for s in soft_skills:
            if s in resume_lower:
                extracted.append({
                    "skill_name": s.title(),
                    "category": "Soft Skill"
                })
                
        return extracted

    def extract_skills_from_jd(self, jd_text: str, target_role: str) -> Dict[str, Any]:
        """Extract required and preferred skills from the target job description or fallback to defaults."""
        default_role = target_role if target_role in ROLE_SKILL_DATASET else "Full Stack Developer"
        defaults = ROLE_SKILL_DATASET.get(default_role)

        if not jd_text or not jd_text.strip():
            return {
                "role": target_role,
                "required_skills": defaults["required_skills"],
                "preferred_skills": defaults["preferred_skills"],
                "tools": defaults["tools"],
                "frameworks": defaults["frameworks"],
                "categories": defaults["categories"]
            }

        if self.client:
            prompt = f"""
            Analyze the following Job Description for the target role: "{target_role}".
            Extract and categorize:
            1. "required_skills": Essential technical skills/languages/frameworks.
            2. "preferred_skills": Good-to-have technical skills or tools.
            3. "tools": Infrastructure, CI/CD, or developer utilities mentioned.
            4. "frameworks": Programming frameworks or libraries mentioned.
            5. "categories": A dictionary mapping "Language", "Framework", "Tool", "Database", "Cloud" to arrays of matching skills.

            Return the results as a single JSON object with these keys. Return ONLY the JSON object.

            Job Description:
            {jd_text}
            """
            try:
                res = self.client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt
                )
                raw_json = clean_json_response(res.text)
                return json.loads(raw_json)
            except Exception as e:
                print(f"Gemini JD skill extraction failed: {e}. Falling back to default datasets.")

        # Fallback keyword parsing in JD
        jd_lower = jd_text.lower()
        from app.services.github_service import SKILL_TAXONOMY
        
        req = []
        pref = []
        for key, details in SKILL_TAXONOMY.items():
            pattern = r'\b' + re.escape(key) + r'\b'
            if re.search(pattern, jd_lower):
                # Classify as required if in default req list, else preferred
                if details["name"] in defaults["required_skills"]:
                    req.append(details["name"])
                else:
                    pref.append(details["name"])
                    
        # Ensure we don't return empty lists
        if not req:
            req = defaults["required_skills"]
        if not pref:
            pref = defaults["preferred_skills"]
            
        return {
            "role": target_role,
            "required_skills": req,
            "preferred_skills": pref,
            "tools": [s for s in req if SKILL_TAXONOMY.get(s.lower(), {}).get("category") == "Tool"],
            "frameworks": [s for s in req if SKILL_TAXONOMY.get(s.lower(), {}).get("category") == "Framework"],
            "categories": defaults["categories"]
        }

    def generate_portfolio_gaps(self, target_role: str, profile_skills: List[Dict[str, Any]], repos: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze repositories list and skills list to detect specific gaps in repository demonstration."""
        # Simple representation for prompt
        skills_summary = [{"name": s["skill_name"], "status": s["status"]} for s in profile_skills]
        
        def parse_languages(val):
            if not val:
                return []
            if isinstance(val, dict):
                return list(val.keys())
            if isinstance(val, list):
                return val
            return []

        repos_summary = [{"name": r["name"], "description": r["description"], "languages": parse_languages(r.get("languages")), "topics": r.get("topics", [])} for r in repos]
        
        if self.client:
            prompt = f"""
            Compare a user's target role: "{target_role}" with their skills list and GitHub projects.
            Identify specific gaps in their portfolio representation.
            Do not just say "learn X". Explain:
            1. What exact type of project or evidence is missing (e.g. "No deployed FastAPI server", "Lacks Docker containerization files").
            2. Why it matters for a {target_role}.
            
            Return a JSON object containing:
            - "gaps_summary": A list of 3-4 specific bullet-point statements.
            - "recommendations_text": A paragraph of direct, encouraging strategic advice.

            Return ONLY the JSON object.

            User Verified & Claimed Skills:
            {json.dumps(skills_summary)}

            User GitHub Repositories:
            {json.dumps(repos_summary)}
            """
            try:
                res = self.client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt
                )
                raw_json = clean_json_response(res.text)
                return json.loads(raw_json)
            except Exception as e:
                print(f"Gemini portfolio gap detection failed: {e}. Falling back to rule-based engine.")

        # Local Fallback rule-based gap generator
        gaps = []
        claimed_unverified = [s["skill_name"] for s in profile_skills if s["status"] == "CLAIMED_BUT_UNVERIFIED"]
        missing_skills = [s["skill_name"] for s in profile_skills if s["status"] == "MISSING"]
        
        if "Docker" in claimed_unverified or "Docker" in missing_skills:
            gaps.append("Your portfolio lacks containerization evidence. Add a Dockerfile to package your models or API services.")
        if "AWS" in missing_skills or "AWS" in claimed_unverified or "GCP" in missing_skills:
            gaps.append("No cloud deployment indicators detected. Build projects highlighting AWS/GCP serverless or cluster setups.")
        if "FastAPI" in claimed_unverified or "Flask" in claimed_unverified:
            gaps.append("Your API skills are unverified. Implement structured endpoints with validation schemas (Pydantic/Express) in a public repository.")
            
        # Ensure we have at least some gaps
        if not gaps:
            gaps = [
                f"Your repository listing lacks end-to-end integration evidence for a {target_role} profile.",
                "Several repositories lack active README files or package environment definitions (requirements.txt, package.json).",
                "Your pinned items do not demonstrate deployment workflows."
            ]
            
        advice = f"Based on your profile, you have solid foundations in the core languages, but you need to focus on building and documenting deployable, containerized applications to demonstrate production-level capabilities to recruiters looking for a {target_role}."
        
        return {
            "gaps_summary": gaps,
            "recommendations_text": advice
        }

    def generate_career_roadmap(self, target_role: str, missing_skills: List[str]) -> List[Dict[str, Any]]:
        """Generate a 4-week step-by-step career readiness roadmap."""
        if not missing_skills:
            # Add general roadmap if no missing skills
            missing_skills = ["System Design", "CI/CD Setup", "AWS Cloud Integration"]
            
        if self.client:
            prompt = f"""
            Create a week-by-week career readiness learning roadmap for a user who wants to become a "{target_role}".
            Focus on learning these missing priority skills: {', '.join(missing_skills)}.
            
            Return a JSON list representing a 4-week roadmap. Each item must have:
            - "week_number": Integer (1 to 4)
            - "skill": Name of the skill/domain
            - "explanation": Short description of why this is prioritized
            - "objective": Clear learning objective
            - "task": A practical, hands-on coding task
            - "milestone": The visible deliverable (e.g. "A Dockerfile pushed to GitHub")

            Return ONLY the JSON list, no formatting.
            """
            try:
                res = self.client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt
                )
                raw_json = clean_json_response(res.text)
                return json.loads(raw_json)
            except Exception as e:
                print(f"Gemini roadmap generator failed: {e}. Falling back to template generation.")

        # Local Fallback template generator
        items = []
        weeks_plan = [
            ("Containers & Setup", "Learn containerization to build clean environment setups.", "Containerize backend application templates.", "Dockerfile configurations completed and tested"),
            ("API Development", "Design REST backend interfaces with validation metrics.", "Create api schema integrations.", "Deployable API folder setup"),
            ("Cloud Foundations", "Connect models or databases to cloud deployment registers.", "Configure storage buckets and cluster definitions.", "Configured registry connection logs"),
            ("System Optimization", "Document structure diagrams and benchmark load requests.", "Stress test server routes and update documentation.", "Published API documentation page")
        ]
        
        for idx, plan in enumerate(weeks_plan):
            skill = missing_skills[idx % len(missing_skills)] if idx < len(missing_skills) else plan[0]
            items.append({
                "week_number": idx + 1,
                "skill": skill,
                "explanation": f"Gain hands-on experience in {skill} to cover crucial requirements for {target_role} pipelines.",
                "objective": plan[1],
                "task": f"Build a mini-application using {skill} and check in code.",
                "milestone": plan[3]
            })
            
        return items

    def analyze_ai_assistance_context(self, code_samples: List[Dict[str, str]], readme_text: str, resume_text: str, target_role: str) -> Dict[str, Any]:
        """Use Gemini to analyze patterns of potential AI assistance in code, docs, and resume text."""
        if not self.client:
            raise ValueError("Gemini client not initialized")
            
        # Construct summary of code samples
        code_summary = ""
        for idx, sample in enumerate(code_samples):
            code_summary += f"\nFile {idx+1}: {sample.get('name')} ({sample.get('size_bytes', 0)} bytes)\n"
            code_summary += f"Content:\n{sample.get('content', '')[:1500]}\n---\n"
            
        prompt = f"""
        Analyze the following technical artifacts from a developer applying for a "{target_role}" role to identify observable signals of potential AI Assistance.
        
        CRITICAL RULES:
        1. Never state that content or code was definitely written by AI. AI detection is uncertain.
        2. Use neutral, evidence-based language (e.g., "AI assistance estimate", "AI-likeness indicators", "style shift").
        3. Identify specific patterns such as:
           - Code: boilerplate code templates, excessive boilerplate comments, sudden shifts in styling/naming within files.
           - README/Docs: highly generic marketing buzzwords describing simple systems, mismatch between claimed features and real codebase.
           - Resume: generic buzzwords, overly uniform phrasing.
           
        Return a JSON object containing:
        - "code_signals": list of signals found in the code samples.
        - "doc_signals": list of signals found in the README.
        - "resume_signals": list of signals found in the resume.
        
        Each signal object must have:
        - "signal": string code representing the pattern (e.g., "style_shift", "boilerplate_pattern", "buzzword_density", "doc_mismatch")
        - "severity": "LOW", "MEDIUM", or "HIGH"
        - "confidence": float between 0.0 and 1.0 (indicating evidence strength)
        - "description": clear non-judgmental explanation of what was observed (e.g., "Comments contain excessive generic template descriptions of parameters.")
        - "source": string indicating the file name or "Resume PDF"
        
        Format your response ONLY as a raw JSON block, with no formatting or markers.
        
        Resume text:
        {resume_text[:2000]}
        
        README text:
        {readme_text[:2000]}
        
        Code Samples:
        {code_summary}
        """
        
        res = self.client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        raw_json = clean_json_response(res.text)
        return json.loads(raw_json)
