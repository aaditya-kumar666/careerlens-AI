import React from 'react';
import { useApp } from '../context/AppContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { Github, Star, GitFork, AlertCircle, FileText, CheckCircle2, ChevronRight } from 'lucide-react';

export const GithubPage: React.FC = () => {
  const { analysis } = useApp();

  if (!analysis) return null;

  const ghProfile = analysis.github_profile;
  const repositories = analysis.repositories || [];
  const gitRecs = analysis.git_recommendations || [];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">GitHub Intelligence</h1>
          <p className="text-slate-400 text-sm mt-1">Repository quality scans and demonstrated project proof logs.</p>
        </div>

        {/* Profile Card & Recommendations split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* GitHub User Summary */}
          {ghProfile && (
            <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[50px] pointer-events-none" />
              
              <img 
                src={ghProfile.avatar_url} 
                alt={ghProfile.username}
                className="w-16 h-16 rounded-2xl border border-slate-800 shadow-xl mb-4 bg-slate-950" 
              />
              
              <h2 className="font-extrabold text-white text-lg flex items-center gap-1.5 justify-center">
                <Github size={18} className="text-slate-400" /> {ghProfile.username}
              </h2>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">Linked public developer account</span>
              
              <div className="grid grid-cols-3 gap-4 mt-6 w-full text-center text-xs border-t border-slate-900/50 pt-6">
                <div>
                  <span className="text-slate-500 block mb-0.5">Repos</span>
                  <span className="font-bold text-white text-sm">{ghProfile.public_repos}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Followers</span>
                  <span className="font-bold text-white text-sm">{ghProfile.followers}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Following</span>
                  <span className="font-bold text-white text-sm">{ghProfile.following}</span>
                </div>
              </div>
            </div>
          )}

          {/* Git Cleanliness Advice */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between">
            <div>
              <span className="text-slate-400 text-xs font-semibold block mb-4">Improvement Recommendations</span>
              
              <div className="flex flex-col gap-4">
                {gitRecs.map((rec: string, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl flex gap-3 text-xs leading-relaxed">
                    <AlertCircle size={15} className="text-blue-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300 font-light">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <p className="text-[10px] text-slate-500 font-mono leading-relaxed mt-6">
              Recruiters judge repositories by README quality, technology topics, and continuous commit updates. Clean project settings maximize verification scoring.
            </p>
          </div>
        </div>

        {/* Repositories listing */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Public Repositories Scan ({repositories.length})</h2>
          
          <div className="flex flex-col gap-3">
            {repositories.map((repo: any) => {
              // Estimate README score for display
              const hasReadme = !!repo.readme_content;
              const readmeScore = hasReadme ? Math.min(100, 30 + (repo.readme_content.length / 50)) : 10;
              
              return (
                <div key={repo.id} className="p-5 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-800 hover:bg-slate-900/40 transition-all">
                  <div className="flex-1 flex flex-col gap-1.5 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-white text-sm">{repo.name}</h3>
                      {repo.primary_language && (
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 text-[10px] border border-slate-900 font-mono">
                          {repo.primary_language}
                        </span>
                      )}
                    </div>
                    {repo.description && (
                      <p className="text-xs text-slate-400 leading-relaxed font-light">{repo.description}</p>
                    )}
                    
                    {/* Topics badges */}
                    {repo.topics && repo.topics.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap mt-1">
                        {repo.topics.slice(0, 4).map((t: string, idx: number) => (
                          <span key={idx} className="text-[9px] font-semibold text-slate-500 font-mono">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quality indicators */}
                  <div className="flex items-center gap-6 self-start sm:self-auto">
                    <div className="flex gap-3 text-xs text-slate-500 font-mono border-r border-slate-900 pr-6 hidden sm:flex">
                      <span className="flex items-center gap-1"><Star size={13} /> {repo.stars}</span>
                      <span className="flex items-center gap-1"><GitFork size={13} /> {repo.forks}</span>
                    </div>

                    <div className="flex flex-col gap-1.5 text-right w-24 shrink-0">
                      <span className="text-[10px] text-slate-500 block font-mono">README Score</span>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              readmeScore >= 70 ? 'bg-emerald-500' : readmeScore >= 40 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${readmeScore}%` }} 
                          />
                        </div>
                        <span className="text-[10px] font-bold text-white font-mono shrink-0">{readmeScore.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
