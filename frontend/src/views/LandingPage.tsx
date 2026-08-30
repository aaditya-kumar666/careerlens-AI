import React from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';
import { ShieldCheck, LineChart, Route, Award, ArrowRight, Github, FileText, CheckCircle2, Sun, Moon } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setCurrentPage, enableDemoMode, token, theme, toggleTheme } = useApp();

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 0, opacity: 1 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: 'easeOut' as any } }
  };

  const startJourney = () => {
    if (token) {
      setCurrentPage('onboarding');
    } else {
      setCurrentPage('login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentPage('landing')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            C
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            CareerLens<span className="text-blue-500 font-bold">AI</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-lg transition-all"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {token ? (
            <button 
              onClick={() => setCurrentPage('dashboard')}
              className="px-4 py-2 text-sm font-semibold hover:text-white transition-colors"
            >
              Dashboard
            </button>
          ) : (
            <button 
              onClick={() => setCurrentPage('login')}
              className="px-4 py-2 text-sm font-semibold hover:text-white transition-colors"
            >
              Sign In
            </button>
          )}
          <button 
            onClick={enableDemoMode}
            className="px-4 py-2 text-sm font-semibold bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:border-slate-700 transition-all"
          >
            Launch Demo
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-16 md:py-24 flex flex-col items-center justify-center text-center relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl flex flex-col items-center"
        >
          {/* Badge */}
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6 uppercase tracking-wider"
          >
            <ShieldCheck size={14} /> AI-Powered Skill Verification
          </motion.div>

          {/* Heading */}
          <motion.h1 
            variants={itemVariants}
            className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6 text-white"
          >
            Know exactly what stands <br />
            between you and your <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-indigo-600 bg-clip-text text-transparent">dream job</span>.
          </motion.h1>

          {/* Subheading */}
          <motion.p 
            variants={itemVariants}
            className="text-slate-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed font-light"
          >
            CareerLens AI analyzes your resume, GitHub portfolio, and target role to identify verified skills, career gaps, and the fastest path to becoming job-ready.
          </motion.p>

          {/* CTAs */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md mb-16"
          >
            <button
              onClick={startJourney}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Analyze My Career <ArrowRight size={18} />
            </button>
            <button
              onClick={enableDemoMode}
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-300 font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Try Demo Analysis
            </button>
          </motion.div>

          {/* Core Feature Previews */}
          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left"
          >
            <motion.div 
              variants={itemVariants}
              className="p-6 rounded-2xl bg-slate-900/50 border border-slate-900 backdrop-blur hover:border-slate-800 hover:bg-slate-900/80 transition-all flex flex-col gap-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <h3 className="font-bold text-lg text-white">Skill Verification</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Matches skills listed in your resume with actual commit histories, readme structures, and code evidence inside your GitHub.
              </p>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="p-6 rounded-2xl bg-slate-900/50 border border-slate-900 backdrop-blur hover:border-slate-800 hover:bg-slate-900/80 transition-all flex flex-col gap-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <LineChart size={24} />
              </div>
              <h3 className="font-bold text-lg text-white">Readiness Scoring</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Receive an explainable Readiness Score derived from skill relevance, claim verification rates, and portfolio depth.
              </p>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="p-6 rounded-2xl bg-slate-900/50 border border-slate-900 backdrop-blur hover:border-slate-800 hover:bg-slate-900/80 transition-all flex flex-col gap-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Route size={24} />
              </div>
              <h3 className="font-bold text-lg text-white">Learning Simulator</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Toggle skills on the simulator to see your readiness score climb. Receive custom roadmaps and project plans to make it real.
              </p>
            </motion.div>
          </motion.div>

          {/* Product flow preview mockup */}
          <motion.div 
            variants={itemVariants}
            className="mt-16 w-full max-w-5xl rounded-2xl border border-slate-900 bg-slate-900/20 p-4 shadow-2xl relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 rounded-2xl pointer-events-none" />
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div className="text-xs text-slate-500 ml-4 font-mono">careerlens-dashboard.app</div>
            </div>
            
            {/* Visual simulation of dashboard mockup inside landing */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left p-4 bg-slate-950/60 rounded-xl relative">
              <div className="md:col-span-1 border-r border-slate-900/50 pr-4 flex flex-col gap-2">
                <div className="h-6 bg-slate-900 rounded w-3/4 mb-4" />
                <div className="h-10 bg-slate-900/50 rounded flex items-center px-3 gap-2">
                  <Github size={16} className="text-slate-500" />
                  <div className="h-3 bg-slate-800 rounded w-1/2" />
                </div>
                <div className="h-10 bg-slate-900/50 rounded flex items-center px-3 gap-2">
                  <FileText size={16} className="text-slate-500" />
                  <div className="h-3 bg-slate-800 rounded w-1/2" />
                </div>
              </div>

              <div className="md:col-span-3 flex flex-col gap-4 pl-0 md:pl-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-white">Target: Machine Learning Engineer</h4>
                    <p className="text-[11px] text-slate-500">Alex's Career Verification Overview</p>
                  </div>
                  <div className="px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                    Ready Score: 72%
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-900/40 rounded border border-slate-900 flex flex-col gap-2">
                    <div className="text-xs text-slate-500">Verified Stack</div>
                    <div className="flex gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20">Python</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20">PyTorch</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900/40 rounded border border-slate-900 flex flex-col gap-2">
                    <div className="text-xs text-slate-500">Claimed (No Repo Proof)</div>
                    <div className="flex gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 text-[10px] border border-yellow-500/20">Docker</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-600 mt-auto max-w-7xl mx-auto w-full">
        &copy; {new Date().getFullYear()} CareerLens AI. Crafted for hackathons and professional portfolio validation.
      </footer>
    </div>
  );
};
