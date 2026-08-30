import datetime
import requests
import base64
import re
import json
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models import models
from app.ai.ai_provider import AIProvider

ai_provider = AIProvider()

# Common files/directories to ignore during source code checks
EXCLUDE_DIRS = {"node_modules", ".git", "dist", "build", "venv", "__pycache__"}
EXCLUDE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".ico", ".pdf", ".zip", ".tar", ".gz", ".db", ".sqlite", ".json", ".lock"}

def compute_repo_relevance(repo: models.Repository, target_role: str, role_skills: List[models.UserSkill]) -> float:
    """
    Calculate a deterministic relevance score (0-100) for repository prioritization.
    Weights:
    1. Target-role relevance (primary language match): 40 points
    2. Programming languages/topics matching target role: 20 points
    3. Recent development activity (push date): 20 points
    4. Commit count/activity (push date presence): 10 points
    5. Project/documentation quality (README presence & length): 10 points
    6. Stars/forks (low weight popularity signals): Capped at 10 points
    """
    score = 0.0
    req_keys = {s.skill_name.lower() for s in role_skills}
    
    # 1. Primary language matches core role skill
    if repo.primary_language and repo.primary_language.lower() in req_keys:
        score += 40.0
        
    # 2. Topics match target role
    topics = repo.topics or []
    matching_topics = [t.lower() for t in topics if t.lower() in req_keys]
    if matching_topics:
        score += min(20.0, len(matching_topics) * 5.0)
        
    # 3. Recent development activity
    if repo.last_updated:
        now = datetime.datetime.now(datetime.timezone.utc)
        last_updated_tz = repo.last_updated
        if last_updated_tz.tzinfo is None:
            last_updated_tz = last_updated_tz.replace(tzinfo=datetime.timezone.utc)
        delta_days = (now - last_updated_tz).days
        if delta_days <= 90:    # 3 months
            score += 20.0
        elif delta_days <= 180: # 6 months
            score += 10.0
        elif delta_days <= 365: # 1 year
            score += 5.0
            
    # 4. Commit activity indicator
    if repo.last_updated:
        score += 10.0
        
    # 5. Project documentation quality
    if repo.readme_content:
        score += 5.0
        if len(repo.readme_content) > 1000:
            score += 5.0
            
    # 6. Stars/forks popularity signals (low weight)
    popularity = (repo.stars or 0) + (repo.forks or 0)
    score += min(10.0, popularity * 0.5)
    
    return min(100.0, score)

def fetch_repo_file_samples(username: str, repo_name: str) -> List[Dict[str, Any]]:
    """Safe, bounded scan of source files in root or basic folders using Contents API."""
    contents_url = f"https://api.github.com/repos/{username}/{repo_name}/contents"
    samples = []
    
    try:
        res = requests.get(contents_url, timeout=5)
        if res.status_code != 200:
            return []
            
        items = res.json()
        if not isinstance(items, list):
            return []
            
        # Filter for source code files
        files_to_check = []
        for item in items:
            if item.get("type") == "file":
                name = item.get("name", "")
                size = item.get("size", 0)
                ext = "." + name.split(".")[-1].lower() if "." in name else ""
                
                # Criterias: source file, under 50KB, not excluded
                if (ext not in EXCLUDE_EXTENSIONS and 
                    size > 50 and size < 50000 and 
                    "lock" not in name.lower() and 
                    "min" not in name.lower()):
                    files_to_check.append(item)
                    
        # Grab up to 5 files
        for item in files_to_check[:5]:
            f_res = requests.get(item.get("url"), timeout=5)
            if f_res.status_code == 200:
                f_data = f_res.json()
                content_encoded = f_data.get("content", "")
                if content_encoded:
                    try:
                        decoded = base64.b64decode(content_encoded).decode('utf-8', errors='ignore')
                        samples.append({
                            "name": item.get("name"),
                            "content": decoded,
                            "size_bytes": item.get("size", 0)
                        })
                    except Exception:
                        pass
    except Exception:
        pass # Graceful fail on rate limits
        
    return samples

def fetch_repo_commit_messages(username: str, repo_name: str) -> List[Dict[str, Any]]:
    """Fetch up to 10 recent commit messages for commit pattern scanning."""
    commits_url = f"https://api.github.com/repos/{username}/{repo_name}/commits?per_page=10"
    commits = []
    
    try:
        res = requests.get(commits_url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            if isinstance(data, list):
                for c in data:
                    commit_obj = c.get("commit", {})
                    author = commit_obj.get("author", {})
                    commits.append({
                        "message": commit_obj.get("message", ""),
                        "date": author.get("date"),
                        "author": author.get("name")
                    })
    except Exception:
        pass
        
    return commits

def run_local_assistance_rules(
    code_samples: List[Dict[str, Any]], 
    readme_text: str, 
    resume_text: str,
    user_skills: List[models.UserSkill]
) -> Dict[str, Any]:
    """Fallback local rule-based heuristic check for AI Assistance signals."""
    code_signals = []
    doc_signals = []
    resume_signals = []
    
    # 1. Code Checks
    boilerplate_comments = ["generated by", "boilerplate", "auto-generated", "created by copilot", "copilot"]
    mixed_casing = False
    
    for sample in code_samples:
        content = sample.get("content", "")
        name = sample.get("name", "")
        
        # Check boilerplate comments
        for term in boilerplate_comments:
            if term in content.lower():
                code_signals.append({
                    "signal": "boilerplate_pattern",
                    "severity": "MEDIUM",
                    "confidence": 0.85,
                    "description": f"Standard auto-generated or boilerplate comment template detected in '{name}'.",
                    "source": name
                })
                break
                
        # Check variable naming consistency (snake_case vs camelCase style shifts)
        has_snake = "_" in content
        has_camel = len(re.findall(r'[a-z][A-Z][a-z]', content)) > 2
        if has_snake and has_camel:
            mixed_casing = True
            
    if mixed_casing:
        code_signals.append({
            "signal": "style_shift",
            "severity": "LOW",
            "confidence": 0.60,
            "description": "Observed naming casing shift (mixed snake_case and camelCase) within source files.",
            "source": "Source Code"
        })
        
    # 2. README / Documentation Checks
    readme_lower = readme_text.lower()
    buzzwords = ["cutting-edge", "revolutionary", "state-of-the-art", "scalable architecture", "designed to revolutionize"]
    matched_buzzwords = [w for w in buzzwords if w in readme_lower]
    
    if matched_buzzwords:
        doc_signals.append({
            "signal": "buzzword_density",
            "severity": "MEDIUM",
            "confidence": 0.70,
            "description": f"README uses highly polished generic buzzwords: {', '.join(matched_buzzwords)}.",
            "source": "README.md"
        })
        
    # Check README length vs actual content complexity
    if len(readme_text) > 3000 and len(code_samples) < 2:
        doc_signals.append({
            "signal": "doc_mismatch",
            "severity": "MEDIUM",
            "confidence": 0.75,
            "description": "Documentation is highly extensive, but repository contains very few active implementation source files.",
            "source": "README.md"
        })
        
    # 3. Resume Checks
    resume_lower = resume_text.lower()
    resume_buzz = ["orchestrated", "synergy", "spearheaded", "production-grade", "leveraged", "pioneered"]
    matched_resume_buzz = [w for w in resume_buzz if w in resume_lower]
    
    if len(matched_resume_buzz) >= 3:
        resume_signals.append({
            "signal": "buzzword_density",
            "severity": "LOW",
            "confidence": 0.65,
            "description": f"Resume text features dense formatting buzzwords: {', '.join(matched_resume_buzz)}.",
            "source": "Resume PDF"
        })
        
    # Check claim evidence consistency
    total_skills = len(user_skills)
    verified_skills = len([s for s in user_skills if s.status in ["VERIFIED", "PARTIALLY_VERIFIED"]])
    
    if total_skills > 0:
        consistency = verified_skills / total_skills
        if consistency < 0.40:
            resume_signals.append({
                "signal": "claim_evidence_gap",
                "severity": "MEDIUM",
                "confidence": 0.80,
                "description": f"Several skills claimed in the resume (like Docker/Kubernetes) could not be verified from public GitHub repositories.",
                "source": "Resume PDF"
            })
            
    return {
        "code_signals": code_signals,
        "doc_signals": doc_signals,
        "resume_signals": resume_signals
    }

def calculate_and_save_ai_assistance(db: Session, career_profile_id: str) -> models.AIAssistanceAnalysis:
    """Core logic runner: select repositories, scan code, commits, calculate weights, save results."""
    profile = db.query(models.CareerProfile).filter(models.CareerProfile.id == career_profile_id).first()
    if not profile:
        raise ValueError("Profile not found")
        
    user_skills = db.query(models.UserSkill).filter(
        models.UserSkill.career_profile_id == career_profile_id
    ).all()
    
    resume = db.query(models.Resume).filter(models.Resume.career_profile_id == career_profile_id).first()
    resume_text = resume.extracted_text if resume else ""
    
    github_profile = db.query(models.GitHubProfile).filter(
        models.GitHubProfile.career_profile_id == career_profile_id
    ).first()
    
    repositories = []
    if github_profile:
        repositories = db.query(models.Repository).filter(
            models.Repository.github_profile_id == github_profile.id
        ).all()
        
    # 1. Select up to 3 repositories based on relevance/activity
    selected_repos = sorted(
        repositories, 
        key=lambda r: compute_repo_relevance(r, profile.target_role, user_skills), 
        reverse=True
    )[:3]
    
    # 2. Gather source code and commits for selected repositories
    all_code_samples = []
    repo_breakdowns = []
    commit_signals_found = []
    has_large_burst = False
    
    for repo in selected_repos:
        repo_code = []
        if github_profile:
            # Query GitHub Contents API for code files
            repo_code = fetch_repo_file_samples(github_profile.username, repo.name)
            all_code_samples.extend(repo_code)
            
            # Query Commits
            commits = fetch_repo_commit_messages(github_profile.username, repo.name)
            
            # Check for large code burst commit pattern heuristic
            # Since we can't get line diff counts reliably without heavy API load, 
            # we inspect commit dates. If there is only 1 or 2 commits containing 
            # all files pushed at the exact same second, we flag a potential code burst.
            if len(commits) == 1:
                has_large_burst = True
                commit_signals_found.append({
                    "signal": "large_burst",
                    "severity": "HIGH",
                    "confidence": 0.80,
                    "description": "Entire repository was uploaded in a single commit burst.",
                    "source": repo.name
                })
                
        # Repository level breakdown template
        repo_signals = ["✓ Normal file structure"]
        repo_recs = []
        repo_score = 15 # Base assistance estimate
        
        if not repo.readme_content:
            repo_signals.append("⚠ Missing README docs")
            repo_recs.append("Add detailed implementation documentation in README.")
            repo_score += 15
        elif "boilerplate" in repo.readme_content.lower() or "template" in repo.readme_content.lower():
            repo_signals.append("⚠ Template documentation")
            repo_recs.append("Add custom usage examples in place of standard template descriptions.")
            repo_score += 10
            
        if len(repo_code) > 0 and any("generated by" in c["content"].lower() for c in repo_code):
            repo_signals.append("⚠ Boilerplate patterns detected")
            repo_score += 20
            
        repo_breakdowns.append({
            "name": repo.name,
            "score": min(100, repo_score),
            "confidence": "MEDIUM" if len(repo_code) > 0 else "LOW",
            "signals": repo_signals,
            "recommendations": repo_recs or ["Maintain current structure!"]
        })
        
    # 3. Analyze Code, Docs, and Resume
    combined_readme = "\n".join([r.readme_content for r in selected_repos if r.readme_content])
    
    # Try using Gemini client if configured, fallback to rule checks if unavailable
    ai_results = None
    if ai_provider.client:
        try:
            ai_results = ai_provider.analyze_ai_assistance_context(
                all_code_samples, 
                combined_readme, 
                resume_text, 
                profile.target_role
            )
        except Exception as e:
            print(f"Gemini AI Assistance analysis failed: {e}. Falling back to rule-based parser.")
            
    if not ai_results:
        ai_results = run_local_assistance_rules(all_code_samples, combined_readme, resume_text, user_skills)
        
    # 4. Form final signals list
    all_signals = []
    all_signals.extend(ai_results.get("code_signals", []))
    all_signals.extend(ai_results.get("doc_signals", []))
    all_signals.extend(ai_results.get("resume_signals", []))
    all_signals.extend(commit_signals_found)
    
    # Ensure source directories match if missing
    for s in all_signals:
        if not s.get("source"):
            s["source"] = "Resume PDF" if s["signal"] == "buzzword_density" else "GitHub Portfolio"
            
    # 5. Compute scores using the deterministic heuristic model
    # Heuristics:
    # - Code Signals (25%): 0-100 depending on code signals count
    # - Commit Patterns (20%): 0-100 (100 if has_large_burst is true, else 20 base)
    # - Documentation Signals (15%): 0-100 depending on doc signals count
    # - Resume Language (15%): 0-100 depending on resume buzzwords
    # - Style Shift (15%): 0-100 (60 if mixed casing is present, else 20 base)
    # - Claim/Evidence Signals (10%): 100 - (Claim-Evidence Consistency * 100)
    
    code_cnt = len(ai_results.get("code_signals", []))
    code_score = min(100, 20 + code_cnt * 30)
    
    commit_score = 80 if has_large_burst else 20
    
    doc_cnt = len(ai_results.get("doc_signals", []))
    doc_score = min(100, 20 + doc_cnt * 35)
    
    res_cnt = len(ai_results.get("resume_signals", []))
    resume_score = min(100, 15 + res_cnt * 35)
    
    style_shift_present = any(s["signal"] == "style_shift" for s in all_signals)
    style_score = 65 if style_shift_present else 15
    
    # Claim Evidence Consistency (10% weight)
    total_skills = len(user_skills)
    verified_skills = len([s for s in user_skills if s.status in ["VERIFIED", "PARTIALLY_VERIFIED"]])
    consistency = verified_skills / total_skills if total_skills > 0 else 1.0
    consistency_score = int(consistency * 100)
    claim_evidence_gap_score = 100 - consistency_score
    
    overall_estimate = int(
        (0.25 * code_score) +
        (0.20 * commit_score) +
        (0.15 * doc_score) +
        (0.15 * resume_score) +
        (0.15 * style_score) +
        (0.10 * claim_evidence_gap_score)
    )
    
    overall_estimate = max(10, min(95, overall_estimate)) # Cap below 100 to emphasize heuristic uncertainty
    
    # 6. Calculate Confidence rating (LOW, MEDIUM, HIGH)
    if not repositories or not github_profile:
        confidence = "LOW"
    elif len(repositories) <= 1 or len(all_code_samples) == 0:
        confidence = "MEDIUM"
    else:
        confidence = "HIGH"
        
    # 7. Compile constructive, friendly portfolio recommendations
    recommendations_list = []
    if has_large_burst:
        recommendations_list.append(
            "Your repository contains files uploaded in a single commit burst. For better transparency, commit work incrementally in small batches."
        )
    if doc_cnt > 0:
        recommendations_list.append(
            "Your README documentation uses highly polished industry buzzwords. Describe concrete implementations and architecture details to ground your claims."
        )
    if claim_evidence_gap_score > 50:
        recommendations_list.append(
            "Several skills listed on your resume lack matching public repositories on GitHub. Consider uploading small code samples to demonstrate familiarity with these technologies."
        )
    if not recommendations_list:
        recommendations_list.append(
            "Maintain your current development patterns! Your commits, documentation styles, and claims show high consistency."
        )
        
    # 8. Save result in SQLite
    analysis = db.query(models.AIAssistanceAnalysis).filter(
        models.AIAssistanceAnalysis.career_profile_id == career_profile_id
    ).first()
    
    if not analysis:
        analysis = models.AIAssistanceAnalysis(career_profile_id=career_profile_id)
        db.add(analysis)
        
    analysis.overall_score = overall_estimate
    analysis.confidence = confidence
    analysis.github_score = code_score
    analysis.resume_score = resume_score
    analysis.commit_score = commit_score
    analysis.doc_score = doc_score
    analysis.consistency_score = consistency_score
    analysis.signals = all_signals
    analysis.repo_breakdowns = repo_breakdowns
    analysis.recommendations = recommendations_list
    
    db.commit()
    db.refresh(analysis)
    return analysis
