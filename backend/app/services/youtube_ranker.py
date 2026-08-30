import datetime
from typing import List, Dict, Any
from app.services.youtube_validator import validate_youtube_video, search_youtube_replacement_live
from app.models import models

def calculate_recommendation_score(resource: Any, gap_skill: str, target_role: str) -> Dict[str, Any]:
    """
    Calculate a deterministic recommendation score (0-100) for a learning resource based on:
    - Views: 35%
    - Likes: 25%
    - Like/View Ratio: 15%
    - Recency: 10%
    - Course Completeness: 10%
    - Career/Skill Relevance: 5%
    """
    # If the resource has been confirmed unavailable, penalize it completely
    if getattr(resource, "is_available", True) == False:
        return {"score": 0, "why_recommended": "This resource is currently unavailable."}

    # 1. VIEWS SCORE (35%)
    views = resource.view_count
    if views is not None:
        if views > 10000000:  # > 10M
            s_views = 100
        elif views > 1000000:  # > 1M
            s_views = 90
        elif views > 100000:   # > 100K
            s_views = 80
        elif views > 10000:    # > 10K
            s_views = 70
        else:
            s_views = 55
    else:
        s_views = 65  # Neutral score for non-YouTube resources
        
    # 2. LIKES SCORE (25%)
    likes = resource.like_count
    if likes is not None:
        if likes > 500000:
            s_likes = 100
        elif likes > 50000:
            s_likes = 90
        elif likes > 5000:
            s_likes = 80
        elif likes > 500:
            s_likes = 70
        else:
            s_likes = 55
    else:
        s_likes = 65  # Neutral
        
    # 3. LIKE/VIEW RATIO SCORE (15%)
    ratio = resource.like_view_ratio
    if ratio is None and likes is not None and views is not None and views > 0:
        ratio = likes / views
        
    if ratio is not None:
        if ratio >= 0.05:  # >= 5%
            s_ratio = 100
        elif ratio >= 0.02:  # >= 2%
            s_ratio = 85
        elif ratio >= 0.01:  # >= 1%
            s_ratio = 70
        else:
            s_ratio = 50
    else:
        s_ratio = 65
        
    # 4. RECENCY SCORE (10%)
    pub_at = resource.published_at
    if pub_at is not None:
        now = datetime.datetime.utcnow()
        if pub_at.tzinfo is not None:
            pub_at = pub_at.replace(tzinfo=None)
        age_days = (now - pub_at).days
        
        if age_days < 365:        # < 1 year
            s_recency = 100
        elif age_days < 1095:     # < 3 years
            s_recency = 90
        elif age_days < 1825:     # < 5 years
            s_recency = 80
        else:
            s_recency = 70       # Python/SQL stable topics don't decay heavily
    else:
        s_recency = 80
        
    # 5. COMPLETENESS SCORE (10%)
    s_completeness = resource.completeness_score if resource.completeness_score is not None else 75
    
    # 6. RELEVANCE SCORE (5%)
    res_skill_lower = resource.skill.lower()
    gap_skill_lower = gap_skill.lower()
    if res_skill_lower == gap_skill_lower:
        s_relevance = 100
    elif gap_skill_lower in res_skill_lower or res_skill_lower in gap_skill_lower:
        s_relevance = 85
    else:
        s_relevance = 60

    # Calculate final weighted score
    weighted_score = (
        0.35 * s_views +
        0.25 * s_likes +
        0.15 * s_ratio +
        0.10 * s_recency +
        0.10 * s_completeness +
        0.05 * s_relevance
    )
    score = int(round(weighted_score))
    
    # Generate "Why Recommended" justification text
    is_playlist = resource.resource_type.lower() == "playlist"
    if score >= 90:
        why_recommended = f"Recommended as a top choice. Offers complete syllabus coverage, highly verified student engagement, and maps directly to your {gap_skill} gap."
    elif is_playlist:
        why_recommended = f"Highly structured lessons with sequence progressions. Recommended for comprehensive {gap_skill} syllabus coverage."
    elif ratio and ratio >= 0.04:
        why_recommended = f"Recommended for its strong positive feedback ratio ({round(ratio*100, 1)}% like rate) and high student clarity marks."
    else:
        why_recommended = f"A reliable free learning pathway to build hands-on experience and portfolio credentials for {gap_skill}."

    return {
        "score": score,
        "why_recommended": why_recommended
    }

def rank_and_score_resources(resources: List[Any], gap_skill: str, target_role: str, db: Any = None) -> List[Dict[str, Any]]:
    """Rank list of resources with lazy validation and dynamic YouTube replacement logic."""
    scored_list = []
    
    # Pre-validate and process replacements
    active_resources = []
    for r in resources:
        is_yt = bool(r.youtube_video_id or r.youtube_playlist_id)
        
        # Lazy video verification cache check: validate once every 24 hours
        if is_yt and r.youtube_video_id:
            now = datetime.datetime.utcnow()
            needs_check = (
                r.last_validated_at is None or 
                (now - r.last_validated_at).total_seconds() > 86400
            )
            
            if needs_check:
                is_ok = validate_youtube_video(r.youtube_video_id)
                r.is_available = is_ok
                r.last_validated_at = now
                if db:
                    try:
                        db.commit()
                    except Exception as commit_err:
                        print(f"Error saving video validation cache: {commit_err}")
                        db.rollback()
                        
        # Check if this resource is broken and find replacements
        if is_yt and r.youtube_video_id and r.is_available == False:
            print(f"Unavailable video detected: ID={r.youtube_video_id}, Title='{r.title}'. Seeking replacement...")
            
            replacement = None
            
            # 1. Attempt Live search replacement (requires YouTube API key)
            live_dict = search_youtube_replacement_live(r.skill, r.difficulty)
            if live_dict and db:
                try:
                    # Save replacement resource into database
                    db_res = models.LearningResource(
                        title=live_dict["title"],
                        provider=live_dict["provider"],
                        url=live_dict["url"],
                        resource_type="Video",
                        skill=r.skill,
                        difficulty=r.difficulty,
                        duration=live_dict["duration"],
                        youtube_video_id=live_dict["youtube_video_id"],
                        channel_name=live_dict["channel_name"],
                        view_count=live_dict["view_count"],
                        like_count=live_dict["like_count"],
                        like_view_ratio=live_dict["like_view_ratio"],
                        published_at=live_dict["published_at"],
                        description=live_dict["description"],
                        is_available=True,
                        last_validated_at=datetime.datetime.utcnow()
                    )
                    db.add(db_res)
                    db.commit()
                    db.refresh(db_res)
                    replacement = db_res
                    print(f"Live replacement found and cached: '{replacement.title}'")
                except Exception as save_err:
                    print(f"Failed to cache replacement in DB: {save_err}")
                    db.rollback()
                    
            # 2. Database Fallback (if live search returns nothing or no key configured)
            if not replacement:
                # Find other available resources for same skill in DB (prefer FCC/GFG or any available video)
                fallback_candidates = [
                    x for x in resources 
                    if x.id != r.id and getattr(x, "is_available", True) == True
                ]
                
                # Sort fallback options: YouTube first, then provider priority
                def get_fallback_priority(f):
                    f_yt = bool(f.youtube_video_id or f.youtube_playlist_id)
                    prov = f.provider.lower() if f.provider else ""
                    
                    yt_score = 0 if f_yt else 1
                    prov_score = 0 if "freecodecamp" in prov else 1 if "geeksforgeeks" in prov else 2
                    return (yt_score, prov_score)
                    
                sorted_fallbacks = sorted(fallback_candidates, key=get_fallback_priority)
                if sorted_fallbacks:
                    replacement = sorted_fallbacks[0]
                    print(f"Database fallback selected: '{replacement.title}' ({replacement.provider})")
                    
            if replacement:
                # Map replacement metadata but flag replacement attributes
                eval_metrics = calculate_recommendation_score(replacement, gap_skill, target_role)
                why_msg = f"This video is no longer available. We found a better alternative from {replacement.provider} for you."
                
                scored_list.append({
                    "id": replacement.id,
                    "title": replacement.title,
                    "provider": replacement.provider,
                    "url": replacement.url,
                    "resource_type": replacement.resource_type,
                    "skill": replacement.skill,
                    "difficulty": replacement.difficulty,
                    "duration": replacement.duration,
                    "is_free": replacement.is_free,
                    "is_verified": replacement.is_verified,
                    "hands_on": replacement.hands_on,
                    "description": replacement.description,
                    "youtube_video_id": replacement.youtube_video_id,
                    "youtube_playlist_id": replacement.youtube_playlist_id,
                    "channel_name": replacement.channel_name,
                    "view_count": replacement.view_count,
                    "like_count": replacement.like_count,
                    "like_view_ratio": replacement.like_view_ratio,
                    "video_count": replacement.video_count,
                    "completeness_score": replacement.completeness_score,
                    "language": replacement.language,
                    "recommendation_score": eval_metrics["score"],
                    "why_recommended": why_msg,
                    "is_fallback": True,
                    "recommendation_type": "PRIMARY",
                    "is_top_recommendation": False,
                    "replacement_found": True,
                    "original_title": r.title
                })
            # Skip appending the broken resource
            continue
            
        active_resources.append(r)
        
    # Score remaining active resources
    for r in active_resources:
        eval_metrics = calculate_recommendation_score(r, gap_skill, target_role)
        
        scored_list.append({
            "id": r.id,
            "title": r.title,
            "provider": r.provider,
            "url": r.url,
            "resource_type": r.resource_type,
            "skill": r.skill,
            "difficulty": r.difficulty,
            "duration": r.duration,
            "is_free": r.is_free,
            "is_verified": r.is_verified,
            "hands_on": r.hands_on,
            "description": r.description,
            "youtube_video_id": r.youtube_video_id,
            "youtube_playlist_id": r.youtube_playlist_id,
            "channel_name": r.channel_name,
            "view_count": r.view_count,
            "like_count": r.like_count,
            "like_view_ratio": r.like_view_ratio,
            "video_count": r.video_count,
            "completeness_score": r.completeness_score,
            "language": r.language,
            "recommendation_score": eval_metrics["score"],
            "why_recommended": eval_metrics["why_recommended"],
            "is_fallback": False,
            "recommendation_type": "PRIMARY",
            "is_top_recommendation": False,
            "replacement_found": False
        })
        
    if not scored_list:
        return []
        
    sorted_all = sorted(scored_list, key=lambda x: x["recommendation_score"], reverse=True)
    
    primary_yt = []
    fcc_yt = []
    gfg_yt = []
    non_yt = []
    
    for r in sorted_all:
        is_yt = bool(r["youtube_video_id"] or r["youtube_playlist_id"])
        prov_lower = r["provider"].lower() if r["provider"] else ""
        
        if is_yt:
            if "freecodecamp" in prov_lower:
                fcc_yt.append(r)
            elif "geeksforgeeks" in prov_lower:
                gfg_yt.append(r)
            else:
                primary_yt.append(r)
        else:
            non_yt.append(r)
            
    # Apply Fallback Selection Chain
    top_resource = None
    
    # If the highest scored item is already a replacement, prefer it!
    replacements = [x for x in sorted_all if x.get("replacement_found")]
    if replacements:
        top_resource = replacements[0]
        # Keep its is_fallback flag as True
    elif primary_yt:
        top_resource = primary_yt[0]
        top_resource["recommendation_type"] = "PRIMARY"
        top_resource["is_fallback"] = False
    elif fcc_yt:
        top_resource = fcc_yt[0]
        top_resource["recommendation_type"] = "FALLBACK_1"
        top_resource["is_fallback"] = True
        top_resource["why_recommended"] = "No higher-ranked matching YouTube resource was available, so CareerLens selected a verified freeCodeCamp resource for this skill."
    elif gfg_yt:
        top_resource = gfg_yt[0]
        top_resource["recommendation_type"] = "FALLBACK_2"
        top_resource["is_fallback"] = True
        top_resource["why_recommended"] = "No higher-ranked matching YouTube or freeCodeCamp resource was available, so CareerLens selected a verified GeeksforGeeks resource for this skill."
    elif non_yt:
        top_resource = non_yt[0]
        top_resource["recommendation_type"] = "FALLBACK_3"
        top_resource["is_fallback"] = True
        top_resource["why_recommended"] = "No suitable matching YouTube resource is currently available, so CareerLens selected a verified documentation or interactive course for this skill."
        
    if top_resource:
        top_resource["is_top_recommendation"] = True
        
    # Pin top resource first
    final_list = []
    if top_resource:
        final_list.append(top_resource)
        
    for r in sorted_all:
        if top_resource and r["id"] == top_resource["id"]:
            continue
        final_list.append(r)
        
    return final_list
