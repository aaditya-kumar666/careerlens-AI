import React, { createContext, useContext, useState, useEffect } from 'react';

export type Page = 
  | 'landing' 
  | 'login' 
  | 'register' 
  | 'onboarding' 
  | 'dashboard' 
  | 'skills' 
  | 'github' 
  | 'portfolio' 
  | 'roadmap' 
  | 'projects' 
  | 'simulator' 
  | 'settings';

interface AppContextType {
  token: string | null;
  userEmail: string | null;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  profile: any | null;
  analysis: any | null;
  roadmap: any | null;
  recommendations: any[] | null;
  isLoading: boolean;
  loadingStep: string;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setupProfile: (role: string, jd?: string) => Promise<boolean>;
  uploadResume: (file: File) => Promise<boolean>;
  connectGithub: (username: string) => Promise<boolean>;
  triggerAnalysis: () => Promise<boolean>;
  runSimulation: (skills: string[]) => Promise<any>;
  enableDemoMode: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const API_BASE = 'http://localhost:8000/api';

const getSafeLocalStorageItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn("LocalStorage access is restricted in this browser context:", e);
    return null;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(getSafeLocalStorageItem('cl_token'));
  const [userEmail, setUserEmail] = useState<string | null>(getSafeLocalStorageItem('cl_email'));
  console.log("AppProvider rendering. Current token status:", token);
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [profile, setProfile] = useState<any | null>(null);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [roadmap, setRoadmap] = useState<any | null>(null);
  const [recommendations, setRecommendations] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => (getSafeLocalStorageItem('cl_theme') as 'light' | 'dark') || 'dark');

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('cl_theme', theme);
    } catch (e) {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Auto-fetch profile and analysis if token is present
  useEffect(() => {
    if (token) {
      fetchLatestData();
    }
  }, [token]);

  const fetchLatestData = async () => {
    if (token === 'demo_token_12345') return;
    setIsLoading(true);
    setLoadingStep('Retrieving career profile...');
    try {
      const authHeaders = { 'Authorization': `Bearer ${token}` };
      const pRes = await fetch(`${API_BASE}/profile`, { headers: authHeaders });
      if (pRes.ok) {
        const pData = await pRes.json();
        setProfile(pData);
        
        setLoadingStep('Fetching latest analysis...');
        const aRes = await fetch(`${API_BASE}/analysis/latest`, { headers: authHeaders });
        if (aRes.ok) {
          const aData = await aRes.json();
          setAnalysis(aData.analysis);
          setRoadmap(aData.roadmap);
          setRecommendations(aData.recommendations);
          
          if (currentPage === 'landing' || currentPage === 'login' || currentPage === 'register') {
            setCurrentPage('dashboard');
          }
        } else {
          // Profile exists but no analysis yet, send to onboarding
          setCurrentPage('onboarding');
        }
      } else if (pRes.status === 404) {
        setProfile(null);
        setCurrentPage('onboarding');
      } else {
        logout();
      }
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Login failed');
      }

      const data = await res.json();
      localStorage.setItem('cl_token', data.access_token);
      localStorage.setItem('cl_email', email);
      setToken(data.access_token);
      setUserEmail(email);
      return true;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Registration failed');
      }

      // Automatically login after register
      return await login(email, password);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('cl_token');
    localStorage.removeItem('cl_email');
    setToken(null);
    setUserEmail(null);
    setProfile(null);
    setAnalysis(null);
    setRoadmap(null);
    setRecommendations(null);
    setCurrentPage('landing');
  };

  const setupProfile = async (role: string, jd?: string): Promise<boolean> => {
    if (!token) return false;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/profile/setup`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ target_role: role, job_description: jd })
      });
      if (!res.ok) throw new Error('Failed to set target role');
      const data = await res.json();
      setProfile(data);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadResume = async (file: File): Promise<boolean> => {
    if (!token) return false;
    setIsLoading(true);
    setLoadingStep('Uploading and extracting resume text...');
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(`${API_BASE}/resume/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) throw new Error('Failed to upload resume');
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const connectGithub = async (username: string): Promise<boolean> => {
    if (!token) return false;
    setIsLoading(true);
    setLoadingStep(`Connecting to GitHub API for user: ${username}...`);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/github/connect?username=${username}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to import GitHub details');
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const triggerAnalysis = async (): Promise<boolean> => {
    if (!token) return false;
    setIsLoading(true);
    setError(null);
    
    // Multi-step loading experience simulation on frontend
    const steps = [
      'Extracting claimed skills from resume...',
      'Scanning public GitHub repositories...',
      'Mapping repositories to demonstrated skills...',
      'Running skill credibility verification...',
      'Detecting career portfolio gaps...',
      'Writing custom career recommendations...',
      'Generating week-by-week learning roadmap...'
    ];

    try {
      // Start backend analysis
      for (const step of steps) {
        setLoadingStep(step);
        await new Promise(resolve => setTimeout(resolve, 800)); // Aesthetic transition time
      }
      
      const res = await fetch(`${API_BASE}/analysis/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Analysis calculation failed');
      
      await fetchLatestData();
      setCurrentPage('dashboard');
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const runSimulation = async (skills: string[]): Promise<any> => {
    if (!token) return null;
    setError(null);
    if (token === 'demo_token_12345') {
      const skillsLower = skills.map(s => s.toLowerCase());
      let simMatch = 82;
      let simVerification = 70;
      
      if (skillsLower.includes('docker')) {
        simVerification = 100;
        simMatch += 5;
      }
      if (skillsLower.includes('aws')) {
        simMatch += 10;
      }
      if (skillsLower.includes('fastapi')) {
        simMatch += 3;
      }
      
      const rel = 65;
      const qual = 75;
      const act = 68;
      
      const simReadiness = Math.min(100, Math.round(
        (0.40 * simMatch) +
        (0.20 * simVerification) +
        (0.20 * rel) +
        (0.10 * qual) +
        (0.10 * act)
      ));
      
      return {
        current_readiness: 72,
        simulated_readiness: simReadiness,
        improvement: simReadiness - 72,
        breakdown_current: { skill_match: 82, verification: 70, relevance: 65, quality: 75, activity: 68 },
        breakdown_simulated: { skill_match: simMatch, verification: simVerification, relevance: 65, quality: 75, activity: 68 },
        skills_simulated: skills
      };
    }
    try {
      const res = await fetch(`${API_BASE}/simulator`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ skills_to_add: skills })
      });
      if (!res.ok) throw new Error('Simulation failed');
      return await res.json();
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const enableDemoMode = () => {
    // Generate realistic seeded demo dataset instantly
    setToken("demo_token_12345");
    setUserEmail("alex.dev@careerlens.ai");
    
    const demoProfile = {
      id: "demo-profile-uuid",
      target_role: "Machine Learning Engineer",
      job_description: "Looking for an ML Engineer with Python, PyTorch, Docker, FastAPI, and AWS deployment experience."
    };
    
    const demoSkills = [
      { id: "s1", skill_name: "Python", category: "Language", status: "VERIFIED", is_required_by_role: true, evidences: [
        { id: "e1", source_type: "resume", source_name: "Resume PDF", confidence: 1.0, details: "5+ years of Python coding projects." },
        { id: "e2", source_type: "repository", source_name: "credit-fraud-detection", confidence: 0.95, details: "Main codebase in Python." },
        { id: "e3", source_type: "repository", source_name: "fastapi-model-server", confidence: 0.95, details: "FastAPI server written in Python." }
      ]},
      { id: "s2", skill_name: "PyTorch", category: "Framework", status: "VERIFIED", is_required_by_role: true, evidences: [
        { id: "e4", source_type: "resume", source_name: "Resume PDF", confidence: 1.0, details: "Built CNN models in PyTorch." },
        { id: "e5", source_type: "repository", source_name: "credit-fraud-detection", confidence: 0.90, details: "Trained PyTorch classifier." }
      ]},
      { id: "s3", skill_name: "FastAPI", category: "Framework", status: "PARTIALLY_VERIFIED", is_required_by_role: true, evidences: [
        { id: "e6", source_type: "resume", source_name: "Resume PDF", confidence: 1.0, details: "Deployed APIs via FastAPI." },
        { id: "e7", source_type: "repository", source_name: "fastapi-model-server", confidence: 0.60, details: "Contains standard main.py endpoint import." }
      ]},
      { id: "s4", skill_name: "Docker", category: "Tool", status: "CLAIMED_BUT_UNVERIFIED", is_required_by_role: true, evidences: [
        { id: "e8", source_type: "resume", source_name: "Resume PDF", confidence: 1.0, details: "Containerized model services using Docker." }
      ]},
      { id: "s5", skill_name: "AWS", category: "Cloud", status: "MISSING", is_required_by_role: true, evidences: [] },
      { id: "s6", skill_name: "SQL", category: "Database", status: "VERIFIED", is_required_by_role: false, evidences: [
        { id: "e9", source_type: "resume", source_name: "Resume PDF", confidence: 1.0, details: "Handled database queries with SQL." },
        { id: "e10", source_type: "repository", source_name: "credit-fraud-detection", confidence: 0.85, details: "Contains SQL script migration files." }
      ]},
      { id: "s7", skill_name: "Git", category: "Tool", status: "VERIFIED", is_required_by_role: false, evidences: [
        { id: "e11", source_type: "resume", source_name: "Resume PDF", confidence: 1.0, details: "Version control." },
        { id: "e12", source_type: "repository", source_name: "credit-fraud-detection", confidence: 1.0, details: "Continuous git commit history." }
      ]},
      { id: "s8", skill_name: "Scikit-Learn", category: "Framework", status: "VERIFIED", is_required_by_role: false, evidences: [
        { id: "e13", source_type: "resume", source_name: "Resume PDF", confidence: 1.0, details: "Built tabular regressions." },
        { id: "e14", source_type: "repository", source_name: "credit-fraud-detection", confidence: 0.90, details: "Imports sklearn in credit_fraud.py." }
      ]}
    ];

    const demoAnalysis = {
      id: "demo-analysis-uuid",
      readiness_score: 72,
      credibility_score: 75,
      skill_match_score: 82,
      skill_verification_score: 70,
      portfolio_relevance_score: 65,
      project_quality_score: 75,
      activity_score: 68,
      explanation: "You have strong machine learning algorithms expertise (PyTorch, Scikit-Learn) verified on GitHub. However, you lack containerization and cloud deployment evidence in your repositories. While your resume claims Docker, none of your public repositories contain Dockerfiles or deployment configurations. AWS is completely missing from your profile despite being highly requested in the role description.",
      skills: demoSkills,
      github_username: "alexdev-mock",
      github_profile: {
        username: "alexdev-mock",
        followers: 42,
        following: 19,
        public_repos: 14,
        avatar_url: "https://avatars.githubusercontent.com/u/9919?v=4"
      },
      repositories: [
        { name: "credit-fraud-detection", description: "Credit card fraud detection models using PyTorch and Scikit-Learn. Handles imbalanced dataset training and model evaluation metrics.", primary_language: "Python", stars: 12, forks: 3, last_updated: "2026-08-15T10:00:00Z", topics: ["machine-learning", "pytorch", "fraud-detection", "python"], readme_content: "# Credit Fraud Detection\nThis repository contains the training scripts..." },
        { name: "fastapi-model-server", description: "FastAPI server boilerplate for inference backend.", primary_language: "Python", stars: 4, forks: 1, last_updated: "2026-06-20T12:00:00Z", topics: ["fastapi", "api", "python"], readme_content: "# FastAPI inference server\nTo run: uvicorn app.main:app" },
        { name: "personal-portfolio", description: "A simple static HTML/CSS web layout for my resume.", primary_language: "CSS", stars: 2, forks: 0, last_updated: "2026-01-10T15:00:00Z", topics: ["html", "css", "portfolio"], readme_content: "# Resume web page" }
      ],
      gaps_summary: [
        "Your portfolio lacks machine learning deployment and API integration evidence.",
        "Your resume claims Docker containerization, but there is no Dockerfile found in your repositories.",
        "No cloud infrastructure (AWS) deployment evidence detected."
      ],
      git_recommendations: [
        "3 of your repositories do not have README files. Add descriptive documentation.",
        "Pin your 'credit-fraud-detection' repository to showcase ML engineering.",
        "Add a Dockerfile to the 'fastapi-model-server' repository to verify your Docker skills."
      ]
    };

    const demoRecommendations = [
      {
        id: "rec1",
        title: "End-to-End ML Deployment Platform",
        description: "Build and containerize a FastAPI model server, build automated test workflows, and deploy it to a AWS ECS/Fargate container instance.",
        difficulty: "Intermediate",
        time_estimate: "2-3 weeks",
        skills_gained: ["FastAPI", "Docker", "AWS", "CI/CD"],
        tech_stack: ["Python", "FastAPI", "Docker", "AWS ECS", "GitHub Actions"],
        milestones: [
          "Milestone 1: Create a prediction API in FastAPI with input schemas validation.",
          "Milestone 2: Write a Dockerfile to containerize the server and test it locally.",
          "Milestone 3: Write GitHub Actions workflow to auto-build Docker images.",
          "Milestone 4: Deploy the container to AWS using ECS and expose the API endpoint."
        ]
      },
      {
        id: "rec2",
        title: "Real-time Streaming Feature Pipeline",
        description: "Implement a data pipeline that fetches live stream transactions, extracts features, and stores them in a Redis store for low-latency ML scoring.",
        difficulty: "Advanced",
        time_estimate: "3-4 weeks",
        skills_gained: ["Kafka", "Redis", "Data Engineering", "SQL"],
        tech_stack: ["Python", "Apache Kafka", "Redis", "PostgreSQL"],
        milestones: [
          "Milestone 1: Setup Docker Compose with Kafka, Redis, and Postgres services.",
          "Milestone 2: Build a Kafka producer script to mock streaming records.",
          "Milestone 3: Build consumer logic to process features and store them in Redis.",
          "Milestone 4: Write testing scripts to measure feature lookup latency."
        ]
      }
    ];

    const demoRoadmap = {
      id: "demo-roadmap-uuid",
      title: "Machine Learning Engineer Readiness Pathway",
      items: [
        { id: "r1", week_number: 1, skill: "Docker", explanation: "Learn Docker fundamentals to solve the claimed-but-unverified gap and dockerize your FastAPI server.", objective: "Containerize APIs", task: "Write Dockerfile, build local image, map ports, test api endpoint", milestone: "FastAPI server running in Docker container locally" },
        { id: "r2", week_number: 2, skill: "FastAPI API Dev", explanation: "Deepen FastAPI knowledge to move it from partially verified to fully verified with structured inputs.", objective: "Design robust APIs", task: "Add Pydantic validation, error handlers, and integration tests to fastapi-model-server", milestone: "Code coverage > 80% on API endpoints" },
        { id: "r3", week_number: 3, skill: "AWS ECS/ECR", explanation: "Create cloud deployment foundation to resolve the AWS gap.", objective: "Push and register images", task: "Configure AWS credentials, setup ECR registry, push Docker images", milestone: "Image successfully pushed to AWS ECR registry" },
        { id: "r4", week_number: 4, skill: "Cloud Deployment", explanation: "Finalize deployment and document features in README.", objective: "Deploy to cloud", task: "Deploy ECS service running container, setup load balancer, update repository README with API docs", milestone: "Live deployment endpoint and completed readme file details" }
      ]
    };

    setProfile(demoProfile);
    setAnalysis(demoAnalysis);
    setRoadmap(demoRoadmap);
    setRecommendations(demoRecommendations);
    setCurrentPage('dashboard');
  };

  return (
    <AppContext.Provider value={{
      token,
      userEmail,
      currentPage,
      setCurrentPage,
      profile,
      analysis,
      roadmap,
      recommendations,
      isLoading,
      loadingStep,
      error,
      login,
      register,
      logout,
      setupProfile,
      uploadResume,
      connectGithub,
      triggerAnalysis,
      runSimulation,
      enableDemoMode,
      theme,
      toggleTheme
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
