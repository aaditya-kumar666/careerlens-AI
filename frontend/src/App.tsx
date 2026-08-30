import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LandingPage } from './views/LandingPage';
import { AuthPage } from './views/AuthPage';
import { OnboardingPage } from './views/OnboardingPage';
import { DashboardPage } from './views/DashboardPage';
import { SkillsPage } from './views/SkillsPage';
import { GithubPage } from './views/GithubPage';
import { PortfolioPage } from './views/PortfolioPage';
import { RoadmapPage } from './views/RoadmapPage';
import { ProjectsPage } from './views/ProjectsPage';
import { SimulatorPage } from './views/SimulatorPage';
import { SettingsPage } from './views/SettingsPage';
import { AIInsightsPage } from './views/AIInsightsPage';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-red-400 mb-2">Application Error</h2>
            <p className="text-sm text-slate-400 mb-4">
              An error occurred while rendering the application. Please see details below:
            </p>
            <pre className="p-4 bg-slate-950 border border-slate-900 rounded-xl text-xs text-red-500 font-mono overflow-auto max-h-40">
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { currentPage } = useApp();
  console.log("AppContent rendering, currentPage is:", currentPage);

  switch (currentPage) {
    case 'landing':
      return <LandingPage />;
    case 'login':
    case 'register':
      return <AuthPage />;
    case 'onboarding':
      return <OnboardingPage />;
    case 'dashboard':
      return <DashboardPage />;
    case 'skills':
      return <SkillsPage />;
    case 'github':
      return <GithubPage />;
    case 'portfolio':
      return <PortfolioPage />;
    case 'roadmap':
      return <RoadmapPage />;
    case 'projects':
      return <ProjectsPage />;
    case 'simulator':
      return <SimulatorPage />;
    case 'settings':
      return <SettingsPage />;
    case 'ai-insights':
      return <AIInsightsPage />;
    default:
      return <LandingPage />;
  }
};

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
