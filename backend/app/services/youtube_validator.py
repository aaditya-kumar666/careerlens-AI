import os
import requests
import datetime
from typing import Optional, Dict, Any

# YouTube Data API Key
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

def validate_youtube_video(video_id: str) -> bool:
    """
    Check if a YouTube video is publicly available using keyless oEmbed API check
    or YouTube Data API if key is present.
    oEmbed returns 200 OK for public videos, and 400/404 for deleted/private/invalid videos.
    """
    if not video_id:
        return False
        
    # Option A: YouTube Data API (if key is present)
    if YOUTUBE_API_KEY:
        try:
            url = f"https://www.googleapis.com/youtube/v3/videos?part=id,status&id={video_id}&key={YOUTUBE_API_KEY}"
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("items", [])
                if not items:
                    return False  # Video deleted, private, or does not exist
                status = items[0].get("status", {})
                privacy = status.get("privacyStatus", "public")
                embeddable = status.get("embeddable", True)
                return privacy == "public" and embeddable
        except Exception as api_err:
            print(f"YouTube Data API check failed for {video_id}, falling back to oEmbed: {api_err}")

    # Option B: oEmbed Check (Reliable, keyless fallback)
    try:
        url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}"
        resp = requests.get(url, timeout=5)
        # 200 means public, 400/404 means deleted, private, invalid ID, or geoblocked
        return resp.status_code == 200
    except Exception as e:
        print(f"oEmbed check failed for {video_id}: {e}")
        # Default to True to prevent false positives on timeout/network issue
        return True

def search_youtube_replacement_live(skill: str, difficulty: str) -> Optional[Dict[str, Any]]:
    """
    Search YouTube for a replacement video covering the given skill and difficulty.
    Only runs if YOUTUBE_API_KEY is configured.
    """
    if not YOUTUBE_API_KEY:
        return None
        
    try:
        # Step 1: Search for videos matching the topic
        query = f"{skill} tutorial {difficulty} free course"
        search_url = (
            f"https://www.googleapis.com/youtube/v3/search"
            f"?part=snippet&q={requests.utils.quote(query)}&type=video"
            f"&maxResults=5&key={YOUTUBE_API_KEY}"
        )
        resp = requests.get(search_url, timeout=5)
        if resp.status_code != 200:
            return None
            
        search_data = resp.json()
        items = search_data.get("items", [])
        if not items:
            return None
            
        # Step 2: Validate candidates and get engagement stats
        for item in items:
            video_id = item.get("id", {}).get("videoId")
            if not video_id:
                continue
                
            # Perform basic validation first
            if not validate_youtube_video(video_id):
                continue
                
            # Retrieve video stats (views, likes)
            details_url = (
                f"https://www.googleapis.com/youtube/v3/videos"
                f"?part=statistics,snippet,contentDetails&id={video_id}&key={YOUTUBE_API_KEY}"
            )
            det_resp = requests.get(details_url, timeout=5)
            if det_resp.status_code != 200:
                continue
                
            det_data = det_resp.json()
            det_items = det_data.get("items", [])
            if not det_items:
                continue
                
            video_details = det_items[0]
            stats = video_details.get("statistics", {})
            snippet = video_details.get("snippet", {})
            
            views = int(stats.get("viewCount", 0))
            likes = int(stats.get("likeCount", 0)) if stats.get("likeCount") else None
            ratio = likes / views if (likes and views > 0) else None
            
            # Format published_at datetime
            pub_str = snippet.get("publishedAt")
            published_at = None
            if pub_str:
                try:
                    # Parse YYYY-MM-DDTHH:MM:SSZ
                    published_at = datetime.datetime.strptime(pub_str[:19], "%Y-%m-%dT%H:%M:%S")
                except:
                    pass
            
            return {
                "title": snippet.get("title", f"{skill} Video Course"),
                "provider": snippet.get("channelTitle", "YouTube"),
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "youtube_video_id": video_id,
                "view_count": views,
                "like_count": likes,
                "like_view_ratio": ratio,
                "published_at": published_at,
                "channel_name": snippet.get("channelTitle"),
                "description": snippet.get("description", "")[:250],
                "duration": "1 hour+"  # Default duration label
            }
            
        return None
    except Exception as ex:
        print(f"Error during live YouTube replacement search for {skill}: {ex}")
        return None
