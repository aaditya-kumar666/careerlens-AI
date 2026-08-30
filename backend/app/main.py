from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.database.connection import engine, Base
from app.api import auth, profile, resume, github, analysis, simulator, ai_insights, roadmap

# Create SQLite database tables on startup
Base.metadata.create_all(bind=engine)

def run_migrations_and_seeding():
    import sqlite3
    from app.database.seeds import VERIFIED_RESOURCES
    
    # 1. Dynamic Column Migration for SQLite
    try:
        conn = sqlite3.connect("careerlens.db")
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(roadmap_items)")
        columns = [row[1] for row in cursor.fetchall()]
        
        new_cols = {
            "why_it_matters": "TEXT",
            "current_level": "VARCHAR DEFAULT 'Beginner'",
            "target_level": "VARCHAR DEFAULT 'Intermediate'",
            "priority": "VARCHAR DEFAULT 'MEDIUM'",
            "prerequisites": "TEXT",
            "estimated_time": "VARCHAR",
            "status": "VARCHAR DEFAULT 'NOT_STARTED'",
            "practice_resources": "TEXT",
            "project_recommendation": "TEXT"
        }
        
        for col_name, col_type in new_cols.items():
            if col_name not in columns:
                print(f"Migrating: Adding column '{col_name}' to table 'roadmap_items'")
                cursor.execute(f"ALTER TABLE roadmap_items ADD COLUMN {col_name} {col_type}")
                
        # Check columns in learning_resources
        cursor.execute("PRAGMA table_info(learning_resources)")
        lr_columns = [row[1] for row in cursor.fetchall()]
        
        new_lr_cols = {
            "youtube_video_id": "VARCHAR",
            "youtube_playlist_id": "VARCHAR",
            "channel_name": "VARCHAR",
            "view_count": "INTEGER",
            "like_count": "INTEGER",
            "like_view_ratio": "FLOAT",
            "published_at": "TIMESTAMP",
            "video_count": "INTEGER",
            "completeness_score": "INTEGER DEFAULT 70",
            "language": "VARCHAR DEFAULT 'English'",
            "is_available": "BOOLEAN DEFAULT 1",
            "last_validated_at": "TIMESTAMP"
        }
        
        for col_name, col_type in new_lr_cols.items():
            if col_name not in lr_columns:
                print(f"Migrating: Adding column '{col_name}' to table 'learning_resources'")
                cursor.execute(f"ALTER TABLE learning_resources ADD COLUMN {col_name} {col_type}")
                
        conn.commit()
        conn.close()
    except Exception as ex:
        print(f"Dynamic SQLite migration failed: {ex}")

    # 2. Database Seeding for LearningResource
    try:
        from app.database.connection import SessionLocal
        from app.models import models
        db = SessionLocal()
        
        for r in VERIFIED_RESOURCES:
            existing = db.query(models.LearningResource).filter(models.LearningResource.url == r["url"]).first()
            if not existing:
                db_resource = models.LearningResource(
                    title=r["title"],
                    provider=r["provider"],
                    url=r["url"],
                    resource_type=r["resource_type"],
                    skill=r["skill"],
                    difficulty=r["difficulty"],
                    duration=r["duration"],
                    is_free=r["is_free"],
                    is_verified=r["is_verified"],
                    hands_on=r["hands_on"],
                    description=r["description"],
                    youtube_video_id=r.get("youtube_video_id"),
                    youtube_playlist_id=r.get("youtube_playlist_id"),
                    channel_name=r.get("channel_name"),
                    view_count=r.get("view_count"),
                    like_count=r.get("like_count"),
                    like_view_ratio=r.get("like_view_ratio"),
                    published_at=r.get("published_at"),
                    video_count=r.get("video_count"),
                    completeness_score=r.get("completeness_score", 70),
                    language=r.get("language", "English")
                )
                db.add(db_resource)
        db.commit()
        db.close()
        print("Database seeded with verified learning resources successfully.")
    except Exception as ex:
        print(f"Database seeding failed: {ex}")

run_migrations_and_seeding()

app = FastAPI(
    title="CareerLens AI API",
    description="Backend API for CareerLens AI - AI-Powered Career Readiness & Portfolio Intelligence Platform",
    version="1.0.0"
)

# Dynamic CORS Mirroring Middleware (Credential-Safe and Host-Agnostic)
from fastapi.responses import Response

@app.middleware("http")
async def add_cors_headers(request, call_next):
    origin = request.headers.get("origin") or request.headers.get("Origin")
    if request.method == "OPTIONS":
        response = Response(status_code=200)
        if origin:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept, X-Requested-With"
        return response
        
    response = await call_next(request)
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept, X-Requested-With"
    return response

# Register routers
app.include_router(auth.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(resume.router, prefix="/api")
app.include_router(github.router, prefix="/api")
app.include_router(analysis.router, prefix="/api")
app.include_router(simulator.router, prefix="/api")
app.include_router(ai_insights.router, prefix="/api")
app.include_router(roadmap.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to CareerLens AI API. Visit /docs for documentation."}
