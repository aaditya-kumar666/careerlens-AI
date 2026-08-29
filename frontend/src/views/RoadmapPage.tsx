import React from 'react';
import { useApp } from '../context/AppContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { Route, CheckCircle, Target, BookOpen, AlertCircle } from 'lucide-react';

export const RoadmapPage: React.FC = () => {
  const { roadmap } = useApp();

  if (!roadmap) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <AlertCircle size={32} className="text-slate-500 mb-4" />
          <p className="text-slate-400">No active roadmap. Complete onboarding and analysis to generate one.</p>
        </div>
      </DashboardLayout>
    );
  }

  const items = roadmap.items || [];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Career Readiness Roadmap</h1>
          <p className="text-slate-400 text-sm mt-1">A step-by-step 4-week timeline targeting priority skill deficiencies.</p>
        </div>

        {/* Timeline representation */}
        <div className="relative border-l border-slate-900 ml-6 pl-8 flex flex-col gap-8">
          {items.map((item: any, index: number) => (
            <div key={item.id || index} className="relative flex flex-col gap-3">
              {/* Timeline circle indicator */}
              <div className="absolute left-[-45px] top-0 w-8 h-8 rounded-full bg-slate-950 border-2 border-blue-600 flex items-center justify-center font-bold text-xs text-blue-500 font-mono shadow-md">
                {item.week_number}
              </div>

              {/* Roadmap step card */}
              <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 hover:border-slate-800 hover:bg-slate-900/40 transition-all flex flex-col gap-4">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div>
                    <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider font-mono">WEEK {item.week_number} FOCUS</span>
                    <h3 className="text-lg font-bold text-white mt-0.5">{item.skill}</h3>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed font-light">{item.explanation}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-950/50 pt-4 text-xs">
                  {/* Objective & Tasks */}
                  <div className="flex flex-col gap-2">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5"><Target size={14} className="text-slate-500" /> Learning Objective</span>
                    <p className="text-slate-400 font-light leading-relaxed">{item.objective}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5"><BookOpen size={14} className="text-slate-500" /> Coding Assignment</span>
                    <p className="text-slate-400 font-light leading-relaxed">{item.task}</p>
                  </div>
                </div>

                {/* Milestone banner */}
                <div className="p-3 bg-slate-950/60 border border-slate-900/80 rounded-xl flex items-center gap-2 text-xs">
                  <CheckCircle size={15} className="text-blue-500 shrink-0" />
                  <span className="text-slate-400 font-light">Milestone: <strong className="text-white font-medium">{item.milestone}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};
