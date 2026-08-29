import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { PlayCircle, ShieldAlert, Award, ChevronRight, CheckSquare, RefreshCw, Sparkles } from 'lucide-react';

export const SimulatorPage: React.FC = () => {
  const { analysis, runSimulation } = useApp();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [simResults, setSimResults] = useState<any | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  if (!analysis) return null;

  // Find missing required / preferred skills
  const missingSkills = analysis.skills?.filter((s: any) => 
    s.is_required_by_role && (s.status === 'MISSING' || s.status === 'CLAIMED_BUT_UNVERIFIED')
  ) || [];

  // Re-run simulation whenever selected skills change
  useEffect(() => {
    handleSimulate();
  }, [selectedSkills]);

  const handleSimulate = async () => {
    setIsCalculating(true);
    try {
      const results = await runSimulation(selectedSkills);
      setSimResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleToggleSkill = (skillName: string) => {
    if (selectedSkills.includes(skillName)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skillName));
    } else {
      setSelectedSkills([...selectedSkills, skillName]);
    }
  };

  const currentScore = simResults?.current_readiness ?? analysis.readiness_score;
  const simulatedScore = simResults?.simulated_readiness ?? currentScore;
  const improvement = simResults?.improvement ?? 0;

  const currentBreakdown = simResults?.breakdown_current || {
    skill_match: analysis.skill_match_score,
    verification: analysis.skill_verification_score,
    relevance: analysis.portfolio_relevance_score,
    quality: analysis.project_quality_score,
    activity: analysis.activity_score
  };

  const simulatedBreakdown = simResults?.breakdown_simulated || currentBreakdown;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Career Readiness Simulator</h1>
          <p className="text-slate-400 text-sm mt-1">Select missing target skills to model their projected impact on your Career Readiness score.</p>
        </div>

        {missingSkills.length === 0 ? (
          <div className="p-6 bg-slate-900/20 border border-slate-900 rounded-3xl text-center">
            <Award size={32} className="text-emerald-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-white">You have verified all target role skills!</p>
            <p className="text-xs text-slate-500 mt-1">Your profile meets the target role requirements. Keep repositories active.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Skills selection sidebar */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex flex-col gap-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Select Skills to Simulate</span>
              
              <div className="flex flex-col gap-3">
                {missingSkills.map((s: any) => {
                  const isChecked = selectedSkills.includes(s.skill_name);
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleToggleSkill(s.skill_name)}
                      className={`p-3.5 rounded-xl border text-left flex justify-between items-center transition-all ${
                        isChecked 
                          ? 'bg-blue-600/10 border-blue-500 text-white' 
                          : 'bg-slate-950/40 border-slate-900 hover:border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex flex-col text-xs">
                        <span className="font-bold">{s.skill_name}</span>
                        <span className="text-[9px] text-slate-500 font-mono mt-0.5">{s.status.replace(/_/g, ' ')}</span>
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isChecked ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-800 bg-slate-950'
                      }`}>
                        {isChecked && <span className="text-[10px] font-bold">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Score Simulation Display */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Score comparisons */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex flex-col sm:flex-row justify-around items-center text-center gap-6 relative overflow-hidden">
                <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[50px] pointer-events-none" />
                
                {/* Current */}
                <div className="flex flex-col items-center">
                  <span className="text-slate-500 text-xs font-semibold mb-2">Current Readiness</span>
                  <span className="text-4xl font-black text-slate-500">{currentScore}%</span>
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center justify-center">
                  {isCalculating ? (
                    <RefreshCw size={20} className="text-blue-500 animate-spin" />
                  ) : (
                    <ChevronRight size={24} className="text-slate-700 rotate-90 sm:rotate-0" />
                  )}
                  {improvement > 0 && (
                    <span className="text-[10px] font-bold text-emerald-400 font-mono mt-1">+{improvement}%</span>
                  )}
                </div>

                {/* Simulated */}
                <div className="flex flex-col items-center">
                  <span className="text-slate-400 text-xs font-semibold mb-2">Simulated Potential</span>
                  <span className={`text-4xl font-black transition-all ${
                    improvement > 0 ? 'text-emerald-400 scale-105' : 'text-slate-300'
                  }`}>
                    {simulatedScore}%
                  </span>
                </div>
              </div>

              {/* Comparative breakdowns progress bars */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex flex-col gap-5">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Simulated Metrics Impact</span>
                
                <div className="flex flex-col gap-4 text-xs">
                  {/* Skill Match bar */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">Skill Match (40% Weight)</span>
                      <span>{currentBreakdown.skill_match}% → <strong className="text-white">{simulatedBreakdown.skill_match}%</strong></span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden relative">
                      <div 
                        className="bg-slate-800 h-2 absolute left-0 rounded-full transition-all duration-300"
                        style={{ width: `${currentBreakdown.skill_match}%` }}
                      />
                      <div 
                        className="bg-blue-600 h-2 absolute left-0 rounded-full transition-all duration-500 opacity-60"
                        style={{ width: `${simulatedBreakdown.skill_match}%` }}
                      />
                    </div>
                  </div>

                  {/* Verification bar */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">Claims Verification (20% Weight)</span>
                      <span>{currentBreakdown.verification}% → <strong className="text-white">{simulatedBreakdown.verification}%</strong></span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden relative">
                      <div 
                        className="bg-slate-800 h-2 absolute left-0 rounded-full transition-all duration-300"
                        style={{ width: `${currentBreakdown.verification}%` }}
                      />
                      <div 
                        className="bg-blue-600 h-2 absolute left-0 rounded-full transition-all duration-500 opacity-60"
                        style={{ width: `${simulatedBreakdown.verification}%` }}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 leading-relaxed font-mono border-t border-slate-950/60 pt-4 mt-2">
                  * Note: Portfolio Relevance, Code Quality, and Git Update Frequencies are held constant in this simulator, isolating only the direct impact of resolving skill gaps.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
