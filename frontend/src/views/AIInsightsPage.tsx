import React from 'react';
import { useApp } from '../context/AppContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { 
  ShieldAlert, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Sparkles, 
  Code, 
  BookOpen, 
  FileText,
  History,
  GitBranch,
  Info
} from 'lucide-react';

export const AIInsightsPage: React.FC = () => {
  const { aiInsights, setCurrentPage } = useApp();

  // If no insights calculated yet, show a nice loading state
  if (!aiInsights) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto">
          <ShieldAlert size={48} className="text-blue-500 mb-4 animate-bounce" />
          <h2 className="text-xl font-bold text-white mb-2">No AI Insights Available</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Please run the main profile scan first on the onboarding wizard to parse repositories and compute assistance scores.
          </p>
          <button 
            onClick={() => setCurrentPage('onboarding')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded-xl transition-all shadow-lg shadow-blue-600/10"
          >
            Go to Onboarding Flow
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Get color helper based on score
  const getScoreColor = (score: number) => {
    if (score < 40) return 'text-emerald-400';
    if (score < 70) return 'text-blue-400';
    return 'text-yellow-400';
  };

  const getScoreBg = (score: number) => {
    if (score < 40) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score < 70) return 'bg-blue-500/10 border-blue-500/20';
    return 'bg-yellow-500/10 border-yellow-500/20';
  };

  const getStrokeColor = (score: number) => {
    if (score < 40) return '#34d399'; // Emerald
    if (score < 70) return '#60a5fa'; // Blue
    return '#facc15'; // Yellow
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 text-left">
        {/* Page Title Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
              AI Assistance Insights
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Transparent, pattern-based estimation of code and documentation construction.
            </p>
          </div>
          <button 
            onClick={() => setCurrentPage('dashboard')}
            className="px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 rounded-xl hover:bg-slate-800 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Global Transparency Tooltip Disclaimer */}
        <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex gap-3 text-xs leading-relaxed text-slate-300">
          <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block mb-1">AI Insights Disclaimer</strong>
            AI assistance estimates are heuristic indicators based on observable patterns. They cannot prove whether content was generated or assisted by AI, as developers frequently mix code templates, scaffolding, or AI autocomplete in modern development pipelines.
          </div>
        </div>

        {/* Upper Dashboard: Circular Gauge & Confidence */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Heuristic Gauge */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex flex-col items-center justify-between text-center relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[50px] pointer-events-none" />
            <span className="text-slate-400 text-xs font-semibold mb-4">AI Assistance Estimate</span>
            
            <div className="relative w-36 h-36 flex items-center justify-center mb-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="rgba(30, 41, 59, 0.5)" strokeWidth="8" fill="transparent" />
                <circle cx="50" cy="50" r="42" stroke={getStrokeColor(aiInsights.overall_score)} strokeWidth="8" fill="transparent"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * aiInsights.overall_score) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black text-white">{aiInsights.overall_score}%</span>
                <span className="text-[10px] text-slate-500 font-mono">Assistance Likeness</span>
              </div>
            </div>

            <div className={`text-[10px] font-bold px-3 py-1 rounded-full border ${getScoreBg(aiInsights.overall_score)} ${getScoreColor(aiInsights.overall_score)}`}>
              {aiInsights.overall_score < 40 ? 'Minimal AI Patterns' : aiInsights.overall_score < 70 ? 'Moderate AI Patterns' : 'Substantial AI Patterns'}
            </div>
            
            <p className="text-[10px] text-slate-500 mt-4 leading-relaxed max-w-[220px]">
              Estimate aggregates syntax consistency, commit burst logs, and document patterns.
            </p>
          </div>

          {/* Separate Confidence Scale Card */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
            <div>
              <span className="text-slate-400 text-xs font-semibold block mb-4">Analysis Confidence</span>
              
              <div className="flex flex-col gap-2 mt-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Evidence Level:</span>
                  <strong className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded border ${
                    aiInsights.confidence === 'HIGH' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    aiInsights.confidence === 'MEDIUM' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                    'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                  }`}>
                    {aiInsights.confidence}
                  </strong>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mt-4">
                  <div className={`h-2.5 rounded-full ${
                    aiInsights.confidence === 'LOW' || aiInsights.confidence === 'MEDIUM' || aiInsights.confidence === 'HIGH'
                      ? 'bg-blue-500' : 'bg-slate-800'
                  }`} />
                  <div className={`h-2.5 rounded-full ${
                    aiInsights.confidence === 'MEDIUM' || aiInsights.confidence === 'HIGH'
                      ? 'bg-blue-500' : 'bg-slate-800'
                  }`} />
                  <div className={`h-2.5 rounded-full ${
                    aiInsights.confidence === 'HIGH'
                      ? 'bg-blue-500' : 'bg-slate-800'
                  }`} />
                </div>
              </div>

              <div className="flex flex-col gap-3.5 mt-6 text-xs text-slate-400 font-light">
                <div className="flex gap-2">
                  <CheckCircle2 size={14} className="text-blue-500 shrink-0 mt-0.5" />
                  <span>Inspected up to 3 selected repositories.</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 size={14} className="text-blue-500 shrink-0 mt-0.5" />
                  <span>Parsed source file casing structures (max 50KB).</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 mt-4 leading-relaxed border-t border-slate-900 pt-3">
              Confidence scale measures evidence volume. Fewer files and repositories lower our estimate reliability.
            </p>
          </div>

          {/* Breakdown Score List */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between">
            <span className="text-slate-400 text-xs font-semibold block mb-4">Indicators Breakdown (Weighted)</span>
            
            <div className="flex flex-col gap-3">
              {/* Slide 1 */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-400 flex items-center gap-1"><Code size={12} /> Code Signals (25%):</span>
                  <span className="font-bold text-white">{aiInsights.github_score || 0}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${aiInsights.github_score || 0}%` }} />
                </div>
              </div>

              {/* Slide 2 */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-400 flex items-center gap-1"><History size={12} /> Commit Patterns (20%):</span>
                  <span className="font-bold text-white">{aiInsights.commit_score || 0}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${aiInsights.commit_score || 0}%` }} />
                </div>
              </div>

              {/* Slide 3 */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-400 flex items-center gap-1"><BookOpen size={12} /> Docs & READMEs (15%):</span>
                  <span className="font-bold text-white">{aiInsights.doc_score || 0}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${aiInsights.doc_score || 0}%` }} />
                </div>
              </div>

              {/* Slide 4 */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-400 flex items-center gap-1"><FileText size={12} /> Resume Language (15%):</span>
                  <span className="font-bold text-white">{aiInsights.resume_score || 0}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${aiInsights.resume_score || 0}%` }} />
                </div>
              </div>

              {/* Slide 5 */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-400 flex items-center gap-1"><GitBranch size={12} /> Claim-Evidence Gap (10%):</span>
                  <span className="font-bold text-white">{100 - (aiInsights.consistency_score || 0)}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${100 - (aiInsights.consistency_score || 0)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Signals Timeline & Repository Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Timeline List (Show Me Why) */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 md:col-span-2 flex flex-col justify-between">
            <div>
              <span className="text-slate-400 text-xs font-semibold block mb-4 flex items-center gap-1.5">
                <Sparkles size={14} className="text-blue-500" /> Evidence Timeline (Detected Signals)
              </span>

              <div className="flex flex-col gap-3.5 max-h-[360px] overflow-y-auto pr-2">
                {aiInsights.signals && aiInsights.signals.length > 0 ? (
                  aiInsights.signals.map((sig: any, idx: number) => (
                    <div key={idx} className="p-4 bg-slate-950 border border-slate-900 rounded-2xl flex flex-col gap-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className={`font-bold text-[9px] px-1.5 py-0.5 rounded ${
                          sig.severity === 'HIGH' ? 'bg-red-500/10 text-red-400 border border-red-500/10' :
                          sig.severity === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/10' :
                          'bg-blue-500/10 text-blue-400 border border-blue-500/10'
                        }`}>
                          {sig.severity} Severity
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">Source: {sig.source || 'Portfolio'}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed font-light">{sig.description}</p>
                      <div className="flex justify-between items-center mt-1 border-t border-slate-900 pt-2 text-[10px] text-slate-500">
                        <span>Signal type: <strong className="text-slate-400">{sig.signal}</strong></span>
                        <span>Confidence: {Math.round(sig.confidence * 100)}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-500 text-xs border border-dashed border-slate-800 rounded-3xl font-mono">
                    No matching AI signals detected. Coding habits and styling appear organic and consistent.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Repository Level Breaks */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <span className="text-slate-400 text-xs font-semibold block mb-4">Repository Checklists</span>
              
              <div className="flex flex-col gap-4 max-h-[360px] overflow-y-auto pr-1">
                {aiInsights.repo_breakdowns && aiInsights.repo_breakdowns.length > 0 ? (
                  aiInsights.repo_breakdowns.map((repo: any, idx: number) => (
                    <div key={idx} className="p-3.5 bg-slate-950 border border-slate-900 rounded-2xl flex flex-col gap-2.5 text-xs">
                      <div className="flex justify-between items-center">
                        <strong className="text-white truncate max-w-[130px]" title={repo.name}>{repo.name}</strong>
                        <span className="text-[10px] font-bold text-blue-400">Est: {repo.score}%</span>
                      </div>

                      <div className="flex flex-col gap-1.5 text-[11px] text-slate-400 border-t border-slate-900 pt-2 font-light">
                        {repo.signals.map((sig: string, i: number) => (
                          <div key={i} className="flex gap-1.5 items-start">
                            <span className="shrink-0">{sig.startsWith('✓') ? '🟢' : '🟡'}</span>
                            <span className="leading-tight">{sig}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-500 text-xs border border-dashed border-slate-800 rounded-3xl font-mono">
                    No repositories inspected.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Constructive Recommendations Panel */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6">
          <span className="text-slate-400 text-xs font-semibold block mb-4">Strategic Transparency Recommendations</span>
          
          <div className="flex flex-col gap-3 text-xs leading-relaxed text-slate-300">
            {aiInsights.recommendations && aiInsights.recommendations.length > 0 ? (
              aiInsights.recommendations.map((rec: string, i: number) => (
                <div key={i} className="p-3 bg-slate-950/50 border border-slate-900 rounded-2xl flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span>{rec}</span>
                </div>
              ))
            ) : (
              <div className="text-slate-500">Your profile shows excellent transparency! No adjustments needed.</div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
