import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { Settings, Save, AlertCircle, CheckCircle } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { profile, analysis, setupProfile, connectGithub, triggerAnalysis } = useApp();
  const [targetRole, setTargetRole] = useState(profile?.target_role || '');
  const [jobDescription, setJobDescription] = useState(profile?.job_description || '');
  const [githubUser, setGithubUser] = useState(analysis?.github_username || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!targetRole) {
      setErrorMsg('Target role cannot be empty.');
      return;
    }
    
    setIsSaving(true);
    try {
      // Save profile setup
      const pSuccess = await setupProfile(targetRole, jobDescription);
      if (!pSuccess) {
        setErrorMsg('Failed to update target role details.');
        return;
      }

      // Save github username connection if provided
      if (githubUser) {
        const gSuccess = await connectGithub(githubUser);
        if (!gSuccess) {
          setErrorMsg('Failed to update GitHub account connection.');
          return;
        }
      }

      setSuccessMsg('Profile settings updated successfully!');
      
      // Auto-retrigger verification analysis if they changed settings
      if (githubUser && analysis) {
        setSuccessMsg('Settings updated. Running background re-verification analysis...');
        await triggerAnalysis();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Profile Settings</h1>
          <p className="text-slate-400 text-sm mt-1">Manage target roles, job descriptions, and linked developer credentials.</p>
        </div>

        <div className="max-w-2xl bg-slate-900/40 border border-slate-900 rounded-3xl p-6 relative overflow-hidden">
          {successMsg && (
            <div className="p-3 mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-3">
              <CheckCircle size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-3">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="flex flex-col gap-5 text-xs text-left">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 font-semibold">Target Career Role</label>
              <input
                type="text"
                required
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Machine Learning Engineer"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 font-semibold">Target Job Description (Optional)</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description to extract custom role requirements..."
                rows={5}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none font-sans"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 font-semibold">Connected GitHub Username</label>
              <input
                type="text"
                value={githubUser}
                onChange={(e) => setGithubUser(e.target.value)}
                placeholder="GitHub Username"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99] transition-all self-start mt-2 shadow-lg shadow-blue-600/10 disabled:opacity-50"
            >
              <Save size={14} /> {isSaving ? 'Saving Configurations...' : 'Save Settings'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};
