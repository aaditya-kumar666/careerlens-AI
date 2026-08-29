import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { Compass, Clock, Award, ShieldAlert, CheckSquare, Layers } from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const { recommendations } = useApp();
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  if (!recommendations || recommendations.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <ShieldAlert size={32} className="text-slate-500 mb-4" />
          <p className="text-slate-400">No projects recommended. Complete onboarding first.</p>
        </div>
      </DashboardLayout>
    );
  }

  // Auto-select first project
  if (activeProjectId === null && recommendations.length > 0) {
    setActiveProjectId(recommendations[0].id);
  }

  const selectedProject = recommendations.find(r => r.id === activeProjectId);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Recommended Projects</h1>
          <p className="text-slate-400 text-sm mt-1">Structured project blue-prints designed to solve multiple skill and portfolio gaps simultaneously.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Projects sidebar */}
          <div className="flex flex-col gap-3 lg:col-span-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Suggested Projects</span>
            {recommendations.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveProjectId(p.id)}
                className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all ${
                  activeProjectId === p.id 
                    ? 'bg-blue-600/10 border-blue-500' 
                    : 'bg-slate-900/20 border-slate-900 hover:border-slate-800'
                }`}
              >
                <span className="font-bold text-xs text-white block truncate">{p.title}</span>
                <div className="flex justify-between items-center w-full text-[10px] text-slate-500 font-mono">
                  <span>Diff: <strong className="text-slate-300">{p.difficulty}</strong></span>
                  <span>Est: <strong className="text-slate-300">{p.time_estimate}</strong></span>
                </div>
              </button>
            ))}
          </div>

          {/* Project Details Panel */}
          {selectedProject && (
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex flex-col gap-6">
              {/* Header */}
              <div>
                <h2 className="text-xl font-bold text-white mb-2">{selectedProject.title}</h2>
                <p className="text-xs text-slate-400 leading-relaxed font-light">{selectedProject.description}</p>
              </div>

              {/* Stats badges */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 bg-slate-950/50 border border-slate-900 rounded-xl flex items-center gap-2">
                  <Award size={16} className="text-blue-500 shrink-0" />
                  <span>Difficulty: <strong className="text-white">{selectedProject.difficulty}</strong></span>
                </div>
                <div className="p-3 bg-slate-950/50 border border-slate-900 rounded-xl flex items-center gap-2">
                  <Clock size={16} className="text-blue-500 shrink-0" />
                  <span>Estimate: <strong className="text-white">{selectedProject.time_estimate}</strong></span>
                </div>
              </div>

              {/* Skills Gained & Tech Stack */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-950/60 pt-6">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Skills Addressed</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {selectedProject.skills_gained?.map((s: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Suggested Tech Stack</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {selectedProject.tech_stack?.map((t: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Milestones timeline checkmarks */}
              <div className="flex flex-col gap-3 border-t border-slate-950/60 pt-6">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Implementation Milestones</span>
                <div className="flex flex-col gap-2.5">
                  {selectedProject.milestones?.map((m: string, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-950/30 border border-slate-900/60 rounded-xl flex items-start gap-3 text-xs leading-relaxed">
                      <CheckSquare size={14} className="text-blue-500 shrink-0 mt-0.5" />
                      <span className="text-slate-300 font-light">{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
