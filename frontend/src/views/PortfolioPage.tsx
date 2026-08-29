import React from 'react';
import { useApp } from '../context/AppContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { FolderGit, CheckSquare, AlertTriangle, ShieldCheck, PlayCircle, PlusCircle, ArrowRight } from 'lucide-react';

export const PortfolioPage: React.FC = () => {
  const { analysis, setCurrentPage } = useApp();

  if (!analysis) return null;

  const gaps = analysis.gaps_summary || [];
  const activeRepos = analysis.repositories || [];
  
  // Calculate simulated details
  const dockerGap = gaps.some((g: string) => g.toLowerCase().includes('docker'));
  const cloudGap = gaps.some((g: string) => g.toLowerCase().includes('cloud') || g.toLowerCase().includes('aws'));
  const apiGap = gaps.some((g: string) => g.toLowerCase().includes('api') || g.toLowerCase().includes('fastapi'));

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Portfolio Gaps</h1>
          <p className="text-slate-400 text-sm mt-1">Analyzing repository themes against target role industry frameworks.</p>
        </div>

        {/* Visual Gaps summary banner */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-yellow-500/5 blur-[50px] pointer-events-none" />
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Gaps Summary</h2>
          
          <div className="flex flex-col gap-4">
            {gaps.map((gap: string, i: number) => (
              <div key={i} className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl flex items-start gap-3">
                <AlertTriangle size={18} className="text-yellow-500 shrink-0 mt-0.5" />
                <div className="flex-1 flex flex-col gap-1 text-xs">
                  <span className="font-bold text-slate-200">Gap detected in repository proof:</span>
                  <p className="text-slate-400 font-light leading-relaxed">{gap}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Breakdown of typical gap indicators */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Required Evidence Checklist</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* API Backend indicator */}
            <div className={`p-5 rounded-2xl border bg-slate-900/20 flex flex-col justify-between ${
              !apiGap ? 'border-emerald-500/20' : 'border-slate-900'
            }`}>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-sm text-white">Inference Backend API</span>
                  {!apiGap ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold">VERIFIED</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[9px] font-bold">MISSING</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-light mb-4">
                  Target job descriptions request deployment endpoints. Having a FastAPI, Flask, or Express backend in your projects verifies your server capabilities.
                </p>
              </div>
              {apiGap && (
                <button 
                  onClick={() => setCurrentPage('projects')}
                  className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1 self-start transition-all"
                >
                  Solve this gap <ArrowRight size={13} />
                </button>
              )}
            </div>

            {/* Containerization indicator */}
            <div className={`p-5 rounded-2xl border bg-slate-900/20 flex flex-col justify-between ${
              !dockerGap ? 'border-emerald-500/20' : 'border-slate-900'
            }`}>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-sm text-white">Docker Containerization</span>
                  {!dockerGap ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold">VERIFIED</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[9px] font-bold">MISSING</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-light mb-4">
                  Hiring managers search files for Dockerfiles or configurations. Container logs guarantee environment portability and cloud readiness.
                </p>
              </div>
              {dockerGap && (
                <button 
                  onClick={() => setCurrentPage('projects')}
                  className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1 self-start transition-all"
                >
                  Solve this gap <ArrowRight size={13} />
                </button>
              )}
            </div>

            {/* Cloud deployment indicator */}
            <div className={`p-5 rounded-2xl border bg-slate-900/20 flex flex-col justify-between ${
              !cloudGap ? 'border-emerald-500/20' : 'border-slate-900'
            }`}>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-sm text-white">Cloud Deployment (AWS/GCP)</span>
                  {!cloudGap ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold">VERIFIED</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[9px] font-bold">MISSING</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-light mb-4">
                  Proof of hosting infrastructure (such as AWS ECS, EC2, or S3 configurations in readmes or action scripts) confirms end-to-end pipelines.
                </p>
              </div>
              {cloudGap && (
                <button 
                  onClick={() => setCurrentPage('projects')}
                  className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1 self-start transition-all"
                >
                  Solve this gap <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
