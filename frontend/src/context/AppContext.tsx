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
  | 'settings'
  | 'ai-insights';

interface AppContextType {
  token: string | null;
  userEmail: string | null;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  profile: any | null;
  analysis: any | null;
  roadmap: any | null;
  recommendations: any[] | null;
  aiInsights: any | null;
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
  updateRoadmapProgress: (itemId: string, status: string) => Promise<boolean>;
  toggleResourceComplete: (resourceId: string, completed: boolean) => Promise<boolean>;
  reassessSkills: () => Promise<boolean>;
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
  const [aiInsights, setAIInsights] = useState<any | null>(null);
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
          
          // Fetch AI Assistance Insights safely (non-blocking)
          try {
            const aiRes = await fetch(`${API_BASE}/ai-insights/latest`, { headers: authHeaders });
            if (aiRes.ok) {
              const aiData = await aiRes.json();
              setAIInsights(aiData);
            } else {
              setAIInsights(null);
            }
          } catch (aiErr) {
            console.error("Failed to retrieve AI insights (non-blocking):", aiErr);
            setAIInsights(null);
          }
          
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
    setAIInsights(null);
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

  const updateRoadmapProgress = async (itemId: string, status: string): Promise<boolean> => {
    if (!token) return false;
    if (token === 'demo_token_12345') {
      setRoadmap((prev: any) => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map((item: any) => {
            if (item.id === itemId) {
              return { ...item, status };
            }
            return item;
          })
        };
      });
      return true;
    }
    
    try {
      const res = await fetch(`${API_BASE}/roadmap/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ item_id: itemId, status })
      });
      if (res.ok) {
        fetchLatestData();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error updating roadmap item progress", err);
      return false;
    }
  };

  const toggleResourceComplete = async (resourceId: string, completed: boolean): Promise<boolean> => {
    if (!token) return false;
    if (token === 'demo_token_12345') {
      setRoadmap((prev: any) => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map((item: any) => {
            return {
              ...item,
              resources: item.resources.map((res: any) => {
                if (res.id === resourceId) {
                  return { ...res, completed };
                }
                return res;
              })
            };
          })
        };
      });
      return true;
    }
    
    try {
      const res = await fetch(`${API_BASE}/roadmap/resource-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ resource_id: resourceId, completed })
      });
      if (res.ok) {
        fetchLatestData();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error toggling resource completion", err);
      return false;
    }
  };

  const reassessSkills = async (): Promise<boolean> => {
    if (!token) return false;
    setIsLoading(true);
    setLoadingStep('Reassessing portfolio capability proofs...');
    try {
      if (token === 'demo_token_12345') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Upgrade SQL to verified
        setAnalysis((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            readiness_score: 82, // Increase score!
            skills: prev.skills.map((s: any) => {
              if (s.skill_name === 'SQL') {
                return { ...s, status: 'VERIFIED' };
              }
              return s;
            })
          };
        });
        
        // Mark SQL roadmap completed
        setRoadmap((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            items: prev.items.map((item: any) => {
              if (item.skill === 'SQL') {
                return { ...item, status: 'COMPLETED' };
              }
              return item;
            })
          };
        });
        
        setIsLoading(false);
        setLoadingStep('');
        return true;
      }
      
      const res = await fetch(`${API_BASE}/roadmap/reassess`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        await fetchLatestData();
        setIsLoading(false);
        setLoadingStep('');
        return true;
      }
      setIsLoading(false);
      setLoadingStep('');
      return false;
    } catch (err) {
      console.error("Error reassessing skills", err);
      setIsLoading(false);
      setLoadingStep('');
      return false;
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
      title: "Data Scientist Skill Mastery Pathway",
      items: [
        {
          id: "r1",
          week_number: 1,
          skill: "SQL",
          explanation: "SQL is required for the Data Scientist role and your current GitHub evidence shows limited SQL queries.",
          objective: "Learn database design, basic SQL statements (SELECT, JOIN, WHERE), and aggregate queries.",
          task: "Create a Student Performance Database using SQLite and write query scripts.",
          milestone: "Database query scripts pushed to GitHub.",
          why_it_matters: "SQL is required for the Data Scientist role and your current GitHub evidence shows limited SQL queries.",
          current_level: "Beginner",
          target_level: "Intermediate",
          priority: "HIGH",
          prerequisites: ["Basic Databases"],
          estimated_time: "2-3 weeks",
          status: "COMPLETED",
          practice_resources: ["Complete Kaggle SQL Zoo exercises", "Design 5 SELECT queries using JOINs"],
          project_recommendation: {
            title: "Student Performance Analytics Dashboard",
            description: "Design SQLite databases holding student grades and write JOIN query reports.",
            difficulty: "Beginner"
          },
          resources: [
            {
              id: "res-sql-1",
              title: "Kudvenkat SQL Server Tutorial Playlist",
              provider: "kudvenkat",
              url: "https://www.youtube.com/playlist?list=PL08903FB7ACA1C2FB",
              resource_type: "Playlist",
              skill: "SQL",
              difficulty: "Beginner",
              duration: "12 hours",
              is_free: true,
              is_verified: true,
              hands_on: true,
              description: "Extremely popular and structured video series covering relational schemas, indexes, keys, joins, subqueries, and stored procedures.",
              youtube_playlist_id: "PL08903FB7ACA1C2FB",
              channel_name: "kudvenkat",
              view_count: 15000000,
              like_count: 750000,
              like_view_ratio: 0.05,
              video_count: 150,
              completeness_score: 96,
              language: "English",
              recommendation_score: 93,
              why_recommended: "Recommended as top choice. Offers complete syllabus coverage, highly verified student engagement, and maps directly to your SQL gap. [DEMO DATA]",
              completed: true,
              is_demo_data: true
            },
            {
              id: "res-sql-2",
              title: "Intro to SQL Interactive Course",
              provider: "Kaggle",
              url: "https://www.kaggle.com/learn/intro-to-sql",
              resource_type: "Interactive Course",
              skill: "SQL",
              difficulty: "Beginner",
              duration: "3 hours",
              is_free: true,
              is_verified: true,
              hands_on: true,
              description: "Learn to write SQL queries using Google BigQuery with real-world datasets and live interactive workspace coding.",
              completeness_score: 90,
              language: "English",
              recommendation_score: 87,
              why_recommended: "Interactive practice environment. Recommended for hands-on query writing. [DEMO DATA]",
              completed: true,
              is_demo_data: true
            }
          ]
        },
        {
          id: "r2",
          week_number: 2,
          skill: "Statistics",
          explanation: "Statistics provides the mathematical foundation for evaluating models and experimental data.",
          objective: "Understand probability distributions, hypothesis testing, and central tendency metrics.",
          task: "Analyze a public dataset and output statistical summary summaries in a Jupyter Notebook.",
          milestone: "Statistics analysis notebook committed.",
          why_it_matters: "Statistics provides the mathematical foundation for evaluating models and experimental data.",
          current_level: "Beginner",
          target_level: "Intermediate",
          priority: "HIGH",
          prerequisites: ["Python"],
          estimated_time: "2-3 weeks",
          status: "IN_PROGRESS",
          practice_resources: ["Run t-tests on a public dataset", "Plot statistical data summaries in a Jupyter notebook"],
          project_recommendation: {
            title: "Descriptive Statistics Notebook",
            description: "Analyze a public dataset and output statistical summary summaries in a Jupyter Notebook.",
            difficulty: "Beginner"
          },
          resources: [
            {
              id: "res-stat-1",
              title: "Statistics - A Full University Course",
              provider: "freeCodeCamp",
              url: "https://www.youtube.com/watch?v=XXgne3wS3hU",
              resource_type: "Video",
              skill: "Statistics",
              difficulty: "Beginner",
              duration: "8 hours",
              is_free: true,
              is_verified: true,
              hands_on: false,
              description: "Full statistics college course covering data graphics, measures of central tendency, z-scores, probability, normal distributions, and hypothesis tests.",
              youtube_video_id: "XXgne3wS3hU",
              channel_name: "freeCodeCamp.org",
              view_count: 2500000,
              like_count: 110000,
              like_view_ratio: 0.044,
              completeness_score: 90,
              language: "English",
              recommendation_score: 89,
              why_recommended: "Recommended as top choice. Offers comprehensive descriptive statistics coverage and high learner ratings. [DEMO DATA]",
              completed: false,
              is_demo_data: true
            }
          ]
        },
        {
          id: "r3",
          week_number: 3,
          skill: "Machine Learning",
          explanation: "Machine Learning is the core engine behind predictive modeling pipelines for the target role.",
          objective: "Understand supervised algorithms, overfitting, and validation metrics.",
          task: "Build a predictive classifier using Scikit-Learn on a local csv dataset.",
          milestone: "ML model script with accuracy logs committed.",
          why_it_matters: "Machine Learning is the core engine behind predictive modeling pipelines for the target role.",
          current_level: "Not Started",
          target_level: "Intermediate",
          priority: "HIGH",
          prerequisites: ["Python", "Pandas", "Statistics"],
          estimated_time: "4-6 weeks",
          status: "NOT_STARTED",
          practice_resources: ["Train scikit-learn models on local housing data", "Evaluate precision/recall scores"],
          project_recommendation: {
            title: "Credit Fraud Classifier Pipeline",
            description: "Train a model using Scikit-Learn to detect transaction fraud and plot confusion metrics.",
            difficulty: "Intermediate"
          },
          resources: [
            {
              id: "res-ml-1",
              title: "100 Days of Machine Learning Playlist",
              provider: "CampusX",
              url: "https://www.youtube.com/playlist?list=PLKnIAqWlhFTV2Q14piE64e0Wj1W7n1bB3",
              resource_type: "Playlist",
              skill: "Machine Learning",
              difficulty: "Intermediate",
              duration: "30 hours",
              is_free: true,
              is_verified: true,
              hands_on: true,
              description: "Comprehensive structured syllabus from scratch covering math fundamentals, Scikit-Learn algorithms, model tuning, pipelines, and end-to-end deployments.",
              youtube_playlist_id: "PLKnIAqWlhFTV2Q14piE64e0Wj1W7n1bB3",
              channel_name: "CampusX",
              view_count: 13000000,
              like_count: 650000,
              like_view_ratio: 0.05,
              video_count: 134,
              completeness_score: 98,
              language: "Hindi-English",
              recommendation_score: 95,
              why_recommended: "Top recommendation based on high completeness, verified engagement, and strong relevance to your Machine Learning gap. [DEMO DATA]",
              completed: false,
              is_demo_data: true
            },
            {
              id: "res-ml-2",
              title: "Machine Learning Algorithms Video Course",
              provider: "freeCodeCamp",
              url: "https://www.youtube.com/watch?v=GwIo3gTOB3I",
              resource_type: "Video",
              skill: "Machine Learning",
              difficulty: "Intermediate",
              duration: "10 hours",
              is_free: true,
              is_verified: true,
              hands_on: true,
              description: "Deep-dive video lectures explaining regressions, decision trees, neural networks, SVMs, and Scikit-Learn code patterns.",
              youtube_video_id: "GwIo3gTOB3I",
              channel_name: "freeCodeCamp.org",
              view_count: 4500000,
              like_count: 180000,
              like_view_ratio: 0.04,
              completeness_score: 85,
              language: "English",
              recommendation_score: 88,
              why_recommended: "Recommended for its structured lesson progression and hands-on algorithms walk-through. [DEMO DATA]",
              completed: false,
              is_demo_data: true,
              recommendation_type: "FALLBACK_1"
            },
            {
              id: "res-ml-3",
              title: "Machine Learning Tutorial for Beginners (GeeksforGeeks)",
              provider: "GeeksforGeeks",
              url: "https://www.youtube.com/watch?v=yW6aXGf2_qM",
              resource_type: "Video",
              skill: "Machine Learning",
              difficulty: "Beginner",
              duration: "2 hours",
              is_free: true,
              is_verified: true,
              hands_on: true,
              description: "A comprehensive introductory tutorial to regression and classification algorithms from GeeksforGeeks.",
              youtube_video_id: "yW6aXGf2_qM",
              channel_name: "GeeksforGeeks",
              view_count: 800000,
              like_count: 24000,
              like_view_ratio: 0.03,
              completeness_score: 80,
              language: "English",
              recommendation_score: 82,
              why_recommended: "No higher-ranked matching YouTube or freeCodeCamp resource was available, so CareerLens selected a verified GeeksforGeeks resource for this skill. [DEMO DATA]",
              completed: false,
              is_demo_data: true,
              recommendation_type: "FALLBACK_2",
              is_fallback: true
            }
          ]
        },
        {
          id: "r4",
          week_number: 4,
          skill: "Docker",
          explanation: "Your resume lists Docker, but your current portfolio does not provide containerized deployable code proofs.",
          objective: "Understand containers, images, port routing, and multi-container docker-compose setups.",
          task: "Write a Dockerfile and docker-compose.yml configuration to launch an API server.",
          milestone: "Dockerfile configuration file pushed to GitHub.",
          why_it_matters: "Your resume lists Docker, but your current portfolio does not provide containerized deployable code proofs.",
          current_level: "Not Started",
          target_level: "Intermediate",
          priority: "MEDIUM",
          prerequisites: ["Git"],
          estimated_time: "1-2 weeks",
          status: "NOT_STARTED",
          practice_resources: ["Create a Dockerfile configuration", "Run multi-container servers with docker-compose"],
          project_recommendation: {
            title: "Containerize and Deploy ML Pipeline",
            description: "Write a multi-stage Dockerfile packaging your Credit Fraud Classifier script.",
            difficulty: "Intermediate"
          },
          resources: [
            {
              id: "res-doc-1",
              title: "Docker Tutorial for Beginners Course",
              provider: "TechWorld with Nana",
              url: "https://www.youtube.com/watch?v=3c-iBgEXNEw",
              resource_type: "Video",
              skill: "Docker",
              difficulty: "Beginner",
              duration: "3 hours",
              is_free: true,
              is_verified: true,
              hands_on: true,
              description: "Highly structured guide containerizing web projects. Details volumes, networks, registries, Dockerfiles, and compose scripts.",
              youtube_video_id: "3c-iBgEXNEw",
              channel_name: "TechWorld with Nana",
              view_count: 7000000,
              like_count: 240000,
              like_view_ratio: 0.034,
              completeness_score: 88,
              language: "English",
              recommendation_score: 91,
              why_recommended: "Recommended as top choice. Offers complete environment configuration walkthroughs and high learner engagement. [DEMO DATA]",
              completed: false,
              is_demo_data: true
            }
          ]
        }
      ]
    };

    const demoAIInsights = {
      id: "demo-ai-insights-uuid",
      overall_score: 43,
      confidence: "MEDIUM",
      github_score: 55,
      resume_score: 31,
      commit_score: 61,
      doc_score: 45,
      consistency_score: 84,
      signals: [
        {
          signal: "style_shift",
          severity: "MEDIUM",
          confidence: 0.68,
          description: "Recently added files show a notable difference in naming and commenting style compared with earlier repository files.",
          source: "credit-fraud-detection"
        },
        {
          signal: "large_burst",
          severity: "HIGH",
          confidence: 0.90,
          description: "An unusually large amount of code (8,000+ lines across 150 files) was added in a single commit.",
          source: "fastapi-model-server"
        },
        {
          signal: "doc_mismatch",
          severity: "MEDIUM",
          confidence: 0.70,
          description: "README contains highly generic/template-like descriptions that claim advanced features not fully visible in the current implementation.",
          source: "personal-portfolio"
        },
        {
          signal: "consistent_style",
          severity: "LOW",
          confidence: 0.85,
          description: "Several older repositories show consistent coding and naming conventions.",
          source: "credit-fraud-detection"
        },
        {
          signal: "claim_evidence_gap",
          severity: "MEDIUM",
          confidence: 0.80,
          description: "Resume claims Docker and AWS experience, but no related configurations or deployment files were found in your public repositories.",
          source: "Resume PDF"
        }
      ],
      repo_breakdowns: [
        {
          name: "credit-fraud-detection",
          score: 35,
          confidence: "MEDIUM",
          signals: ["✓ Consistent coding style", "✓ Incremental commits", "⚠ Minor style shift detected"],
          recommendations: ["Ensure style consistency is maintained across new branches."]
        },
        {
          name: "fastapi-model-server",
          score: 68,
          confidence: "HIGH",
          signals: ["⚠ Unusually large code burst", "✓ Standard file structure", "✓ Technical README"],
          recommendations: ["Maintain smaller, incremental commits for better project transparency."]
        },
        {
          name: "personal-portfolio",
          score: 50,
          confidence: "MEDIUM",
          signals: ["⚠ Generic README template description", "✓ Normal CSS/HTML file changes"],
          recommendations: ["Add implementation details and actual screenshots of your work rather than template placeholders."]
        }
      ],
      recommendations: [
        "Maintain smaller incremental commits instead of uploading entire projects in a single commit.",
        "Ensure your repository READMEs describe code implementations rather than using generic buzzwords.",
        "Add Dockerfiles and deployment configurations to back up the Docker and AWS claims made on your resume."
      ]
    };

    setProfile(demoProfile);
    setAnalysis(demoAnalysis);
    setRoadmap(demoRoadmap);
    setRecommendations(demoRecommendations);
    setAIInsights(demoAIInsights);
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
      aiInsights,
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
      updateRoadmapProgress,
      toggleResourceComplete,
      reassessSkills,
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
