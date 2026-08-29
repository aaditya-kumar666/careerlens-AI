import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { ShieldCheck, ChevronDown, ChevronUp, FileText, Github, HelpCircle, Check, X, AlertCircle } from 'lucide-react';

export const SkillsPage: React.FC = () => {
  const { analysis } = useApp();
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);

  if (!analysis) return null;

  const userSkills = analysis.skills || [];
  
  // Categorize
  const requiredSkills = userSkills.filter((s: any) => s.is_required_by_role);
  const additionalSkills = userSkills.filter((s: any) => !s.is_required_by_role);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
            <Check size={10} /> VERIFIED
          </span>
        );
      case 'PARTIALLY_VERIFIED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center gap-1">
            <Check size={10} /> PARTIALLY VERIFIED
          </span>
        );
      case 'CLAIMED_BUT_UNVERIFIED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-bold flex items-center gap-1">
            <AlertCircle size={10} /> CLAIMED UNVERIFIED
          </span>
        );
      case 'MISSING':
        return (
          <span className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold flex items-center gap-1">
            <X size={10} /> MISSING
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
            UNVERIFIED
          </span>
        );
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedSkillId === id) setExpandedSkillId(null);
    else setExpandedSkillId(id);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Skill Verification Matrix</h1>
          <p className="text-slate-400 text-sm mt-1">Cross-referencing claims from your resume with public project code proofs.</p>
        </div>

        {/* Required Skills list */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Required by Target Role</h2>
            <span className="text-xs text-slate-500 font-mono">Matched {requiredSkills.filter((s: any) => s.status === 'VERIFIED' || s.status === 'PARTIALLY_VERIFIED').length}/{requiredSkills.length}</span>
          </div>

          <div className="flex flex-col gap-3">
            {requiredSkills.map((s: any) => {
              const isExpanded = expandedSkillId === s.id;
              return (
                <div 
                  key={s.id}
                  className={`border rounded-2xl bg-slate-900/30 overflow-hidden transition-all duration-200 ${
                    isExpanded ? 'border-slate-800 bg-slate-900/50' : 'border-slate-900 hover:border-slate-800'
                  }`}
                >
                  {/* Skill main row */}
                  <div 
                    onClick={() => s.status !== 'MISSING' && toggleExpand(s.id)}
                    className={`p-4 flex justify-between items-center select-none ${
                      s.status !== 'MISSING' ? 'cursor-pointer' : 'opacity-65'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center font-bold text-xs text-slate-400 font-mono">
                        {s.skill_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-white text-sm block">{s.skill_name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{s.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {getStatusBadge(s.status)}
                      {s.status !== 'MISSING' && (
                        isExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Expanded evidence details */}
                  {isExpanded && s.evidences && s.evidences.length > 0 && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-950/60 bg-slate-950/20 flex flex-col gap-3">
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Verifiable Evidence Log</span>
                      
                      <div className="flex flex-col gap-2.5">
                        {s.evidences.map((ev: any) => (
                          <div key={ev.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-900 flex items-start gap-3">
                            <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5 text-slate-400">
                              {ev.source_type === 'resume' ? <FileText size={14} /> : <Github size={14} />}
                            </div>
                            <div className="flex-1 flex flex-col gap-1 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-300">
                                  {ev.source_type === 'resume' ? 'Resume Claim' : `GitHub Repo: ${ev.source_name}`}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">
                                  Confidence: <strong className="text-blue-400">{(ev.confidence * 100).toFixed(0)}%</strong>
                                </span>
                              </div>
                              <p className="text-slate-400 leading-relaxed font-light">{ev.details}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Additional Skills */}
        {additionalSkills.length > 0 && (
          <div className="flex flex-col gap-4 mt-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Additional Profile Skills</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {additionalSkills.map((s: any) => (
                <div key={s.id} className="p-3 bg-slate-900/20 border border-slate-900 rounded-xl flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-white">{s.skill_name}</span>
                    <span className="text-[9px] text-slate-500 font-mono mt-0.5">{s.category}</span>
                  </div>
                  {getStatusBadge(s.status)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
