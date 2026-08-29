import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Loader2, Mail, Lock, ShieldAlert } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, register, error, isLoading, currentPage, setCurrentPage } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isLogin = currentPage === 'login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (!isLogin) {
      if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }
      const success = await register(email, password);
      if (success) {
        setCurrentPage('onboarding');
      }
    } else {
      const success = await login(email, password);
      if (success) {
        // If login successful, context checks if profile exists and redirects
        // but default is dashboard/onboarding.
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Left visual side */}
      <div className="md:w-1/2 bg-slate-900 flex flex-col justify-between p-8 md:p-12 relative overflow-hidden border-r border-slate-900">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
        
        {/* Brand logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer relative z-10 self-start"
          onClick={() => setCurrentPage('landing')}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            C
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            CareerLens<span className="text-blue-500 font-bold">AI</span>
          </span>
        </div>

        {/* Informational pitch */}
        <div className="my-auto py-12 relative z-10 max-w-md">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-snug">
            Verify claimed skills with project-based proof.
          </h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Standard career tools only analyze keywords. CareerLens AI connects directly to your GitHub repository and parses READMEs, structures, and languages to build a credible score.
          </p>
          <div className="flex flex-col gap-4 text-xs font-mono text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Verify claims from PDF resumes automatically</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Scan git repositories for skill relevance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>Create deterministic career readiness pathway</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-500 relative z-10">
          CareerLens AI Platform &bull; Security Compliant
        </div>
      </div>

      {/* Right form side */}
      <div className="md:w-1/2 bg-slate-950 flex flex-col justify-center p-8 md:p-12">
        <div className="max-w-md w-full mx-auto">
          {/* Back button */}
          <button 
            onClick={() => setCurrentPage('landing')}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white mb-8 transition-colors self-start"
          >
            <ArrowLeft size={14} /> Back to Landing Page
          </button>

          {/* Form header */}
          <h3 className="text-2xl font-bold mb-2">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h3>
          <p className="text-slate-400 text-xs mb-8">
            {isLogin 
              ? 'Enter your credentials to access your career insights dashboard.' 
              : 'Sign up to build your portfolio credibility report today.'}
          </p>

          {/* Error Message */}
          {error && (
            <div className="p-3 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-center gap-3">
              <ShieldAlert size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative">
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <div className="relative">
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              </div>
            </div>

            {!isLogin && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
                <div className="relative">
                  <input 
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all text-sm mt-2 shadow-lg shadow-blue-600/20"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Please wait...
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Form switcher */}
          <div className="text-center mt-6 text-xs text-slate-400">
            {isLogin ? (
              <span>
                Don't have an account?{' '}
                <button 
                  onClick={() => setCurrentPage('register')}
                  className="text-blue-500 hover:underline font-semibold"
                >
                  Sign Up
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button 
                  onClick={() => setCurrentPage('login')}
                  className="text-blue-500 hover:underline font-semibold"
                >
                  Sign In
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
