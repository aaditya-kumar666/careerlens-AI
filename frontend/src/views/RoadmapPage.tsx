import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { 
  CheckCircle, 
  Target, 
  BookOpen, 
  AlertCircle, 
  TrendingUp, 
  Calendar, 
  Play, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Info,
  Clock,
  Layers,
  Youtube,
  Globe,
  SlidersHorizontal,
  Flame,
  ThumbsUp,
  Eye,
  Award
} from 'lucide-react';

export const RoadmapPage: React.FC = () => {
  const { 
    roadmap, 
    analysis, 
    profile, 
    updateRoadmapProgress, 
    toggleResourceComplete, 
    reassessSkills 
  } = useApp();

  const [filter, setFilter] = useState<'ALL' | 'YOUTUBE' | 'PLAYLIST' | 'INTERACTIVE' | 'PRACTICE' | 'DOCS'>('ALL');
  const [langFilter, setLangFilter] = useState<'ALL' | 'ENGLISH' | 'HINDI' | 'HINDI_ENGLISH'>('ALL');
  const [sortBy, setSortBy] = useState<'RECOMMENDED' | 'VIEWS' | 'LIKES' | 'ENGAGEMENT'>('RECOMMENDED');
  const [reassessing, setReassessing] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  if (!roadmap) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto">
          <AlertCircle size={40} className="text-slate-500 mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">No Active Roadmap</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Please complete onboarding and trigger your profile verification to generate your learning roadmap.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const items = roadmap.items || [];
  
  // Calculate dynamic metrics
  const totalItems = items.length;
  const completedItems = items.filter((item: any) => item.status === 'COMPLETED').length;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const highPriorityGaps = items.filter((item: any) => item.priority === 'HIGH' && item.status !== 'COMPLETED').length;
  const remainingWeeks = items.filter((item: any) => item.status !== 'COMPLETED').length * 2;

  const handleReassess = async () => {
    setReassessing(true);
    await reassessSkills();
    setReassessing(false);
  };

  const toggleExpandResources = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const formatViewCount = (views: number | null): string => {
    if (views === null || views === undefined) return 'N/A';
    if (views >= 1000000) return `${(views / 1000000).toFixed(0)}M+`;
    if (views >= 1000) return `${(views / 1000).toFixed(0)}K+`;
    return views.toString();
  };

  // Main resource compiler (filter, sort, limit)
  const getProcessedResources = (itemId: string, rawResources: any[]) => {
    if (!rawResources) return [];
    
    // 1. Filter
    let list = rawResources.filter((res: any) => {
      // Type checks
      const isYoutube = !!(res.youtube_video_id || res.youtube_playlist_id);
      const isPlaylist = res.resource_type.toLowerCase() === 'playlist' || !!res.youtube_playlist_id;
      
      if (filter === 'YOUTUBE') return isYoutube;
      if (filter === 'PLAYLIST') return isPlaylist;
      if (filter === 'INTERACTIVE') return res.resource_type.toLowerCase().includes('interactive');
      if (filter === 'PRACTICE') return res.description?.toLowerCase().includes('practice') || res.provider?.toLowerCase().includes('zoo');
      if (filter === 'DOCS') return res.resource_type.toLowerCase().includes('documentation') || res.resource_type.toLowerCase().includes('tutorial');
      return true;
    });

    // Language checks
    list = list.filter((res: any) => {
      if (langFilter === 'ALL') return true;
      const resLang = (res.language || 'English').toUpperCase();
      if (langFilter === 'ENGLISH') return resLang === 'ENGLISH';
      if (langFilter === 'HINDI') return resLang === 'HINDI';
      if (langFilter === 'HINDI_ENGLISH') return resLang === 'HINDI-ENGLISH' || resLang === 'HINGLISH';
      return true;
    });

    // 2. Sort
    list = [...list].sort((a: any, b: any) => {
      if (sortBy === 'VIEWS') return (b.view_count || 0) - (a.view_count || 0);
      if (sortBy === 'LIKES') return (b.like_count || 0) - (a.like_count || 0);
      if (sortBy === 'ENGAGEMENT') return (b.like_view_ratio || 0) - (a.like_view_ratio || 0);
      // Default: RECOMMENDED
      return (b.recommendation_score || 0) - (a.recommendation_score || 0);
    });

    return list;
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 text-left">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Learning & Action Plan</h1>
            <p className="text-slate-400 text-sm mt-1">
              Your personalized pathway to close verified skill gaps and verify your capability.
            </p>
          </div>
          
          <button
            onClick={handleReassess}
            disabled={reassessing}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-xs font-bold text-white rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-blue-600/10 cursor-pointer"
          >
            <RefreshCw size={14} className={reassessing ? 'animate-spin' : ''} />
            {reassessing ? 'Reassessing Skills...' : 'Reassess My Skills'}
          </button>
        </div>

        {/* Top Summary Metrics Panel */}
        <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 relative overflow-hidden grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="absolute top-[-30%] left-[-10%] w-[30%] h-[60%] rounded-full bg-blue-600/5 blur-[60px] pointer-events-none" />
          
          <div className="flex flex-col justify-center">
            <span className="text-slate-500 text-xs font-mono uppercase">Target Career</span>
            <h2 className="text-xl font-bold text-white mt-1">{profile?.target_role || 'Developer'}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-slate-400 bg-slate-950 border border-slate-900 px-2 py-0.5 rounded font-mono">
                Readiness: {analysis?.readiness_score || 0}/100
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-center border-l border-slate-800/50 pl-0 md:pl-6">
            <span className="text-slate-500 text-xs font-mono uppercase">Plan Progress</span>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-2xl font-extrabold text-white">{progressPercent}%</span>
              <div className="flex-1 max-w-[120px] bg-slate-950 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">{completedItems} / {totalItems} skills mastered</span>
          </div>

          <div className="flex flex-col justify-center border-l border-slate-800/50 pl-0 md:pl-6">
            <span className="text-slate-500 text-xs font-mono uppercase">Priority Gaps Remaining</span>
            <h3 className="text-2xl font-extrabold text-yellow-400 mt-1">{highPriorityGaps}</h3>
            <span className="text-[10px] text-slate-400 mt-1">High-priority required topics</span>
          </div>

          <div className="flex flex-col justify-center border-l border-slate-800/50 pl-0 md:pl-6">
            <span className="text-slate-500 text-xs font-mono uppercase">Est. Learning Time</span>
            <h3 className="text-2xl font-extrabold text-white mt-1 flex items-center gap-1.5">
              <Clock size={18} className="text-slate-500" /> ~{remainingWeeks} Weeks
            </h3>
            <span className="text-[9px] text-slate-500 mt-1 italic">Varies by experience and hours per week.</span>
          </div>
        </div>

        {/* Filters Controls Panel */}
        <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col gap-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Filter buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 font-mono uppercase text-[10px] mr-2">Resource:</span>
              {(['ALL', 'YOUTUBE', 'PLAYLIST', 'INTERACTIVE', 'PRACTICE', 'DOCS'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFilter(opt)}
                  className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                    filter === opt 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-900/50 text-slate-400 hover:text-white border border-slate-900'
                  }`}
                >
                  {opt === 'ALL' ? 'All' :
                   opt === 'YOUTUBE' ? '🎥 YouTube' :
                   opt === 'PLAYLIST' ? '📺 Playlist' :
                   opt === 'INTERACTIVE' ? '💻 Interactive' :
                   opt === 'PRACTICE' ? '🧪 Practice' :
                   '📚 Docs'}
                </button>
              ))}
            </div>

            {/* Language filter */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-mono uppercase text-[10px] flex items-center gap-1">
                <Globe size={11} /> Language:
              </span>
              <select
                value={langFilter}
                onChange={(e) => setLangFilter(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 text-slate-300 font-bold px-2 py-1 rounded-lg outline-none cursor-pointer text-[11px]"
              >
                <option value="ALL">All Languages</option>
                <option value="ENGLISH">English</option>
                <option value="HINDI">Hindi</option>
                <option value="HINDI_ENGLISH">Hindi-English</option>
              </select>
            </div>

            {/* Sorter */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-mono uppercase text-[10px] flex items-center gap-1">
                <SlidersHorizontal size={11} /> Sort by:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 text-slate-300 font-bold px-2 py-1 rounded-lg outline-none cursor-pointer text-[11px]"
              >
                <option value="RECOMMENDED">⭐ Recommended</option>
                <option value="VIEWS">👁 Most Viewed</option>
                <option value="LIKES">👍 Most Liked</option>
                <option value="ENGAGEMENT">🔥 Highest Engagement</option>
              </select>
            </div>
          </div>
        </div>

        {/* Week-by-Week Learning Plan Timeline */}
        <div className="relative border-l border-slate-900 ml-6 pl-8 flex flex-col gap-10">
          {items.map((item: any, index: number) => {
            const processedRes = getProcessedResources(item.id, item.resources);
            
            // Limit checks (only render 3 by default unless expanded)
            const isExpanded = !!expandedItems[item.id];
            const visibleRes = isExpanded ? processedRes : processedRes.slice(0, 3);
            const hasMore = processedRes.length > 3;
            
            return (
              <div key={item.id || index} className="relative flex flex-col gap-4">
                {/* Timeline circle indicator */}
                <div className={`absolute left-[-45px] top-0 w-8 h-8 rounded-full bg-slate-950 border-2 flex items-center justify-center font-bold text-xs font-mono shadow-md ${
                  item.status === 'COMPLETED' 
                    ? 'border-emerald-500 text-emerald-400' 
                    : item.status === 'IN_PROGRESS'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-slate-800 text-slate-500'
                }`}>
                  {item.week_number}
                </div>

                {/* Main Week Card */}
                <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 hover:border-slate-850 hover:bg-slate-900/40 transition-all flex flex-col gap-6">
                  {/* Step Metadata Header */}
                  <div className="flex justify-between items-start gap-4 flex-wrap border-b border-slate-950 pb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-slate-400 bg-slate-950 border border-slate-900 px-2 py-0.5 rounded font-mono">
                          WEEK {item.week_number} PLAN
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                          item.priority === 'HIGH' 
                            ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                            : item.priority === 'MEDIUM' 
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                            : 'bg-slate-800/10 border-slate-800/20 text-slate-400'
                        }`}>
                          {item.priority} Priority
                        </span>
                        <span className="text-[10px] text-slate-500 bg-slate-950/40 border border-slate-900/80 px-2 py-0.5 rounded">
                          Level: {item.current_level || 'Beginner'} → {item.target_level || 'Intermediate'}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-white mt-1.5">{item.skill}</h3>
                    </div>

                    {/* Progress Dropdown State Trigger */}
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-900 p-1.5 rounded-xl text-xs">
                      <span className="text-slate-500 font-mono pl-1.5">Status:</span>
                      <select
                        value={item.status || 'NOT_STARTED'}
                        onChange={(e) => updateRoadmapProgress(item.id, e.target.value)}
                        className="bg-transparent text-white font-bold outline-none border-none pr-4 cursor-pointer"
                      >
                        <option value="NOT_STARTED" className="bg-slate-950 text-slate-400">Not Started</option>
                        <option value="IN_PROGRESS" className="bg-slate-950 text-blue-400">In Progress</option>
                        <option value="COMPLETED" className="bg-slate-950 text-emerald-400">Completed</option>
                      </select>
                    </div>
                  </div>

                  {/* Why Learn & Prerequisites */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                    <div className="md:col-span-2 flex flex-col gap-1.5">
                      <span className="text-slate-500 font-mono uppercase text-[10px]">Why learn this?</span>
                      <p className="text-slate-300 leading-relaxed font-light">{item.why_it_matters || item.explanation}</p>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 bg-slate-950/40 border border-slate-900/80 p-4 rounded-2xl">
                      <span className="text-slate-500 font-mono uppercase text-[10px] flex items-center gap-1">
                        <Layers size={11} /> Prerequisites
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {item.prerequisites && item.prerequisites.length > 0 ? (
                          item.prerequisites.map((p: string, i: number) => (
                            <span key={i} className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-lg">
                              ✓ {p}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 italic">None required</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Weekly Objectives & Practice Exercises */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-950 pt-4 text-xs">
                    <div className="flex flex-col gap-2">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <Target size={14} className="text-slate-500" /> Learning Objective
                      </span>
                      <p className="text-slate-400 font-light leading-relaxed">{item.objective}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <BookOpen size={14} className="text-slate-500" /> Practice Exercises
                      </span>
                      <div className="flex flex-col gap-1.5">
                        {item.practice_resources && Array.isArray(item.practice_resources) ? (
                          item.practice_resources.map((t: string, i: number) => (
                            <div key={i} className="flex gap-2 items-start text-slate-400 font-light leading-relaxed">
                              <span className="text-blue-500 mt-0.5">🧪</span>
                              <span>{t}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-500 italic">No exercises seeded</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Enriched Free Resources Section */}
                  <div className="border-t border-slate-950 pt-4">
                    <span className="text-slate-400 text-xs font-semibold block mb-3">
                      Recommended Learning Resources
                    </span>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {visibleRes.length > 0 ? (
                        visibleRes.map((res: any, rIdx: number) => {
                          const isTop = rIdx === 0 && sortBy === 'RECOMMENDED';
                          const isYoutube = !!(res.youtube_video_id || res.youtube_playlist_id);
                          const isPlaylist = (res.resource_type && res.resource_type.toLowerCase() === 'playlist') || !!res.youtube_playlist_id;
                          
                          return (
                            <div 
                              key={res.id || rIdx} 
                              className={`bg-slate-950 border rounded-2xl p-4 flex flex-col justify-between gap-4 text-left relative transition-all ${
                                isTop 
                                  ? 'border-yellow-500/40 shadow-lg shadow-yellow-500/5 ring-1 ring-yellow-500/10' 
                                  : 'border-slate-900'
                              }`}
                            >
                              {/* Top recommendation indicator */}
                              {res.is_fallback ? (
                                <div className="absolute top-[-10px] left-4 bg-blue-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md border border-blue-500/20">
                                  <Award size={10} /> 📺 CareerLens Fallback Recommendation
                                </div>
                              ) : isTop ? (
                                <div className="absolute top-[-10px] left-4 bg-yellow-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                                  <Award size={10} /> 🥇 TOP RECOMMENDATION
                                </div>
                              ) : null}

                              <div>
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="font-bold text-slate-200 text-xs truncate max-w-[170px]" title={res.title}>
                                    {isYoutube ? '🎥' : '📄'} {res.title}
                                  </h4>
                                  <span className="text-[10px] text-slate-500">{res.provider}</span>
                                </div>
                                
                                {/* Resource badges */}
                                <div className="flex flex-wrap gap-1 mt-2">
                                  <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded-lg flex items-center gap-1">
                                    {isPlaylist ? '📺 Playlist' : isYoutube ? '🎥 Video' : '📚 Docs'}
                                  </span>
                                  {res.video_count && (
                                    <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-lg font-mono">
                                      {res.video_count} videos
                                    </span>
                                  )}
                                  <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded-lg">
                                    {res.language || 'English'}
                                  </span>
                                  {res.is_free && (
                                    <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-lg font-bold">
                                      FREE
                                    </span>
                                  )}
                                  {res.is_demo_data && (
                                    <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-lg font-mono font-bold tracking-wider">
                                      DEMO DATA
                                    </span>
                                  )}
                                </div>

                                {/* Replacement Alert Box */}
                                {res.replacement_found && (
                                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mt-3 flex items-start gap-2 text-[10px]">
                                    <AlertCircle size={14} className="text-yellow-500 shrink-0 mt-0.5" />
                                    <div className="flex flex-col gap-0.5 text-left">
                                      <span className="text-yellow-400 font-bold">Resource Replaced</span>
                                      <p className="text-slate-300 leading-relaxed font-light">
                                        The original video <strong>"{res.original_title}"</strong> is no longer available. We found a better alternative for you.
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Engagement stats for Youtube */}
                                {isYoutube && (
                                  <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-400 font-mono">
                                    <span className="flex items-center gap-1">
                                      <Eye size={11} className="text-slate-500" /> {formatViewCount(res.view_count)} views
                                    </span>
                                    {res.like_count && (
                                      <span className="flex items-center gap-1">
                                        <ThumbsUp size={11} className="text-slate-500" /> {formatViewCount(res.like_count)} likes
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Recommendation score */}
                                {res.recommendation_score !== undefined && (
                                  <div className="mt-3 bg-slate-900/50 border border-slate-900 p-2 rounded-xl flex items-center justify-between text-[10px]">
                                    <span className="text-slate-500 font-mono">Recommendation score:</span>
                                    <strong className="text-yellow-400 font-mono text-[11px]">{res.recommendation_score}/100</strong>
                                  </div>
                                )}
                                
                                <p className="text-[11px] text-slate-400 mt-3 font-light leading-relaxed">
                                  {res.description || 'No description provided.'}
                                </p>

                                {/* Justification text */}
                                {res.why_recommended && (
                                  <div className="mt-3 border-t border-slate-900/50 pt-2 text-[10px] text-slate-400 leading-normal font-light">
                                    <span className="text-yellow-500 font-medium font-mono text-[9px] uppercase block mb-0.5">
                                      {res.is_fallback ? 'Why Recommended (Fallback):' : 'Why Recommended:'}
                                    </span>
                                    {res.why_recommended}
                                  </div>
                                )}
                              </div>
                              
                              {/* Bottom action trigger bar */}
                              <div className="flex gap-2 border-t border-slate-900/50 pt-3">
                                <a 
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-slate-300 rounded-lg flex items-center justify-center gap-1 transition-colors"
                                >
                                  {isYoutube ? 'Watch on YouTube' : 'Open Resource'} <ExternalLink size={10} />
                                </a>
                                <button
                                  onClick={() => toggleResourceComplete(res.id, !res.completed)}
                                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                                    res.completed 
                                      ? 'bg-emerald-600 text-white animate-pulse-once' 
                                      : 'bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400'
                                  }`}
                                >
                                  {res.completed ? 'Completed ✓' : 'Mark Complete'}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="lg:col-span-3 flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-900 rounded-2xl bg-slate-950/20">
                          <AlertCircle size={24} className="text-slate-600 mb-2" />
                          <span className="text-slate-400 font-bold text-xs">
                            No suitable verified YouTube resource is currently available.
                          </span>
                          <p className="text-[10px] text-slate-500 mt-1 max-w-sm">
                            Please check other verified learning pathways for this skill:
                          </p>
                          <div className="flex gap-2 mt-3 flex-wrap justify-center">
                            <button onClick={() => setFilter('DOCS')} className="px-3 py-1 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 rounded-lg text-[10px] font-mono cursor-pointer">
                              📚 Documentation
                            </button>
                            <button onClick={() => setFilter('INTERACTIVE')} className="px-3 py-1 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 rounded-lg text-[10px] font-mono cursor-pointer">
                              💻 Interactive Course
                            </button>
                            <button onClick={() => setFilter('PRACTICE')} className="px-3 py-1 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 rounded-lg text-[10px] font-mono cursor-pointer">
                              🧪 Practice
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* View more resources toggle */}
                    {hasMore && (
                      <div className="flex justify-center mt-4">
                        <button
                          onClick={() => toggleExpandResources(item.id)}
                          className="px-4 py-1.5 bg-slate-950 border border-slate-900 hover:bg-slate-900 text-slate-400 hover:text-white rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                        >
                          {isExpanded 
                            ? 'Show Less Resources' 
                            : `Show All Recommended Resources (${processedRes.length})`}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Recommended Hands-on Project Card */}
                  {item.project_recommendation && (
                    <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                      <div className="flex gap-3 items-start">
                        <span className="text-xl">🚀</span>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-slate-500 font-mono uppercase">WEEK {item.week_number} CAPSTONE</span>
                          <strong className="text-white text-xs">{item.project_recommendation.title}</strong>
                          <p className="text-slate-400 font-light leading-relaxed mt-1">
                            {item.project_recommendation.description}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-1 rounded-lg font-mono shrink-0">
                        Difficulty: {item.project_recommendation.difficulty || 'Intermediate'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};
