import React from 'react';
import { useApp } from '../context/AppContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { 
  TrendingUp, 
  Award, 
  AlertTriangle, 
  ArrowRight, 
  Compass, 
  BookOpen, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export const DashboardPage: React.FC = () => {
  const { analysis, roadmap, recommendations, aiInsights, setCurrentPage } = useApp();
  const [showWhyModal, setShowWhyModal] = React.useState(false);

  if (!analysis) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-slate-400 mb-4">No analysis data available yet.</p>
          <button 
            onClick={() => setCurrentPage('onboarding')}
            className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-semibold"
          >
            Configure Profile
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate potential improvement from highest priority skills in missing list
  const missingRequired = analysis.skills?.filter((s: any) => s.is_required_by_role && (s.status === 'MISSING' || s.status === 'CLAIMED_BUT_UNVERIFIED')) || [];
  const potentialImprovement = Math.min(100, analysis.readiness_score + (missingRequired.length * 5)) - analysis.readiness_score;

  // Recharts Radar data
  const chartData = [
    { subject: 'Skill Match', A: analysis.skill_match_score, fullMark: 100 },
    { subject: 'Verification', A: analysis.skill_verification_score, fullMark: 100 },
    { subject: 'Relevance', A: analysis.portfolio_relevance_score, fullMark: 100 },
    { subject: 'Quality', A: analysis.project_quality_score, fullMark: 100 },
    { subject: 'Activity', A: analysis.activity_score, fullMark: 100 },
  ];

  const featuredProject = recommendations && recommendations.length > 0 ? recommendations[0] : null;
  const nextRoadmapItem = roadmap && roadmap.items && roadmap.items.length > 0 ? roadmap.items[0] : null;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        {/* Top Header Card */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Overview Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Your career, backed by evidence.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setCurrentPage('simulator')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg shadow-blue-600/10"
            >
              Launch Simulator <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Readiness and Radar Score Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Circular Score Panel */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between items-center text-center relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[50px] pointer-events-none" />
            <span className="text-slate-400 text-xs font-semibold mb-4">Career Readiness Score</span>
            
            <div className="relative w-36 h-36 flex items-center justify-center mb-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="rgba(30, 41, 59, 0.5)" strokeWidth="8" fill="transparent" />
                <circle cx="50" cy="50" r="42" stroke="#3b82f6" strokeWidth="8" fill="transparent"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * analysis.readiness_score) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black text-white">{analysis.readiness_score}%</span>
                <span className="text-[10px] text-slate-500 font-mono">Job Ready</span>
              </div>
            </div>

            {potentialImprovement > 0 && (
              <div className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                <TrendingUp size={12} /> ↑ +{potentialImprovement}% potential improvement
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-4 leading-relaxed max-w-[220px]">
              Ready score combines skill matching, repository proof rates, and code qualities.
            </p>
          </div>

          {/* Radar Chart Panel */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-400 text-xs font-semibold">Metrics Breakdown</span>
              <button 
                onClick={() => alert("Ready score weights: Skill Match 40%, Claims Verification 20%, Portfolio Relevance 20%, Project Quality 10%, Git Activity 10%.")}
                className="text-[10px] text-slate-500 hover:text-white flex items-center gap-1"
              >
                <HelpCircle size={12} /> How is this calculated?
              </button>
            </div>
            
            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569' }} />
                  <Radar name="User Score" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Skill Credibility and Gaps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Credibility Card */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-400 text-xs font-semibold">Skill Credibility Score</span>
                <span className="text-lg font-bold text-blue-400">{analysis.credibility_score}%</span>
              </div>
              
              <div className="flex flex-col gap-4 mt-2">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-3 bg-slate-950/50 border border-slate-900 rounded-xl">
                    <span className="text-slate-500 block mb-1">Claimed</span>
                    <span className="font-bold text-white text-base">
                      {analysis.skills?.filter((s: any) => s.evidences?.some((e: any) => e.source_type === 'resume')).length || 0}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950/50 border border-slate-900 rounded-xl">
                    <span className="text-slate-500 block mb-1">Verified</span>
                    <span className="font-bold text-emerald-400 text-base">
                      {analysis.skills?.filter((s: any) => s.status === 'VERIFIED' && s.evidences?.some((e: any) => e.source_type === 'resume')).length || 0}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950/50 border border-slate-900 rounded-xl">
                    <span className="text-slate-500 block mb-1">Unverified</span>
                    <span className="font-bold text-yellow-400 text-base">
                      {analysis.skills?.filter((s: any) => s.status === 'CLAIMED_BUT_UNVERIFIED').length || 0}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-950/80 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${analysis.credibility_score}%` }} 
                  />
                </div>
              </div>
            </div>
            
            <p className="text-[11px] text-slate-500 mt-6 leading-relaxed">
              This score measures the alignment of resume claims against project proof. Higher scores signal verified capability to hiring teams.
            </p>
          </div>

          {/* Portfolio Gaps Card */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <span className="text-slate-400 text-xs font-semibold block mb-4">Critical Portfolio Gaps</span>
              
              <div className="flex flex-col gap-3">
                {analysis.gaps_summary?.slice(0, 3).map((gap: string, i: number) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <AlertTriangle size={15} className="text-yellow-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300 leading-relaxed">{gap}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              onClick={() => setCurrentPage('portfolio')}
              className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 self-start mt-6 transition-colors"
            >
              Analyze Portfolio Gaps <ChevronRight size={14} />
            </button>
          </div>

          {/* AI Assistance Insights Card */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-[-25%] right-[-25%] w-[45%] h-[45%] rounded-full bg-blue-500/5 blur-[45px] pointer-events-none" />
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-400 text-xs font-semibold">AI Assistance Insights</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  aiInsights?.confidence === 'HIGH' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : aiInsights?.confidence === 'MEDIUM' 
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                    : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                }`}>
                  Confidence: {aiInsights?.confidence || 'LOW'}
                </span>
              </div>

              <div className="flex items-center gap-4 mt-2">
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-white">{aiInsights?.overall_score || 15}%</span>
                  <span className="text-[10px] text-slate-500 font-mono">Assistance Est.</span>
                </div>
                <div className="flex-1 flex flex-col gap-1.5 text-xs text-slate-400 border-l border-slate-800 pl-4">
                  <div className="flex justify-between items-center">
                    <span>GitHub:</span>
                    <span className="font-bold text-white">{aiInsights?.github_score || 20}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Resume:</span>
                    <span className="font-bold text-white">{aiInsights?.resume_score || 15}%</span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 mt-4 leading-relaxed">
                AI assistance estimates are heuristic indicators based on observable patterns. They cannot prove whether content was generated or assisted by AI.
              </p>
            </div>

            <div className="flex gap-2 mt-6">
              <button 
                onClick={() => setShowWhyModal(true)}
                className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-300 rounded-xl transition-colors text-center"
              >
                Show Me Why
              </button>
              <button 
                onClick={() => setCurrentPage('ai-insights')}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-[11px] font-bold text-white rounded-xl transition-all shadow-md"
              >
                Detailed Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Show Me Why Modal Overlay */}
        {showWhyModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl flex flex-col gap-4 text-left">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-lg text-white">Evidence Behind AI Assistance Estimate</h3>
                <button 
                  onClick={() => setShowWhyModal(false)}
                  className="text-xs text-slate-400 hover:text-white px-2.5 py-1 bg-slate-950 border border-slate-900 rounded-lg"
                >
                  Close
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Below are the specific signals detected during the code and document scans.
              </p>

              <div className="flex flex-col gap-3 py-2">
                {aiInsights?.signals && aiInsights.signals.length > 0 ? (
                  aiInsights.signals.map((sig: any, i: number) => (
                    <div key={i} className="p-3 bg-slate-950 border border-slate-900 rounded-2xl flex flex-col gap-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className={`font-bold uppercase tracking-wider text-[9px] px-1.5 py-0.5 rounded ${
                          sig.severity === 'HIGH' ? 'bg-red-500/10 text-red-400 border border-red-500/10' :
                          sig.severity === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/10' :
                          'bg-blue-500/10 text-blue-400 border border-blue-500/10'
                        }`}>
                          {sig.severity} Severity
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">Source: {sig.source || 'GitHub'}</span>
                      </div>
                      <p className="text-slate-300 mt-1.5 leading-relaxed font-light">{sig.description}</p>
                      <span className="text-[10px] text-slate-500 font-mono mt-1">Confidence: {Math.round(sig.confidence * 100)}%</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-500 text-xs font-mono border border-dashed border-slate-800 rounded-2xl">
                    No significant flags detected. Repository structure and resume text appear consistent and organic.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Featured Project and Roadmap overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Featured Project card */}
          {featuredProject && (
            <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between group">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold rounded-md mb-4">
                  <Compass size={12} /> FEATURED RECOMMENDATION
                </div>
                <h3 className="font-extrabold text-lg text-white group-hover:text-blue-400 transition-colors">{featuredProject.title}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{featuredProject.description}</p>
                
                <div className="flex gap-4 mt-4 text-xs font-mono text-slate-500">
                  <span>Difficulty: <strong className="text-white">{featuredProject.difficulty}</strong></span>
                  <span>Time: <strong className="text-white">{featuredProject.time_estimate}</strong></span>
                </div>
              </div>
              
              <button 
                onClick={() => setCurrentPage('projects')}
                className="mt-6 w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                View Project Plan <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* Timeline Roadmap Overview */}
          {nextRoadmapItem && (
            <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <span className="text-slate-400 text-xs font-semibold block mb-4">Next Learning Roadmap Task</span>
                
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                    Wk {nextRoadmapItem.week_number}
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="font-bold text-white">Focus: {nextRoadmapItem.skill}</span>
                    <p className="text-slate-400 leading-relaxed font-light">{nextRoadmapItem.explanation}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setCurrentPage('roadmap')}
                className="mt-6 text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 self-start transition-colors"
              >
                View Weekly Roadmap <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
