from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.database.connection import engine, Base
from app.api import auth, profile, resume, github, analysis, simulator

# Create SQLite database tables on startup
Base.metadata.create_all(bind=engine)

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

@app.get("/")
def read_root():
    return {"message": "Welcome to CareerLens AI API. Visit /docs for documentation."}
