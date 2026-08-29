import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, FileText, Github, ChevronRight, ChevronLeft, Upload, Check, AlertCircle, Sparkles } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { setupProfile, uploadResume, connectGithub, triggerAnalysis, logout } = useApp();
  const [step, setStep] = useState(1);
  const [targetRole, setTargetRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [githubUser, setGithubUser] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const roles = [
    'Data Scientist',
    'Machine Learning Engineer',
    'AI Engineer',
    'Backend Developer',
    'Full Stack Developer',
    'DevOps Engineer',
    'Cybersecurity Analyst'
  ];

  const handleNextStep = async () => {
    setErrorMsg('');
    if (step === 1) {
      const selectedRole = targetRole === 'Other' ? customRole : targetRole;
      if (!selectedRole) {
        setErrorMsg('Please select or specify a target career role.');
        return;
      }
      setIsSubmitting(true);
      const success = await setupProfile(selectedRole, jobDescription);
      setIsSubmitting(false);
      if (success) setStep(2);
      else setErrorMsg('Failed to save profile settings. Please try again.');
    } else if (step === 2) {
      if (!resumeFile) {
        setErrorMsg('Please upload a PDF copy of your resume.');
        return;
      }
      setIsSubmitting(true);
      const success = await uploadResume(resumeFile);
      setIsSubmitting(false);
      if (success) setStep(3);
      else setErrorMsg('Failed to upload and parse resume PDF.');
    } else if (step === 3) {
      if (!githubUser.trim()) {
        setErrorMsg('Please provide your GitHub username.');
        return;
      }
      setIsSubmitting(true);
      const success = await connectGithub(githubUser);
      setIsSubmitting(false);
      if (success) setStep(4);
      else setErrorMsg('Failed to verify GitHub username.');
    }
  };

  const handleTriggerAnalysis = async () => {
    setIsSubmitting(true);
    await triggerAnalysis();
    setIsSubmitting(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setErrorMsg('Only PDF files are supported.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Resume size limit is 5MB.');
        return;
      }
      setResumeFile(file);
      setErrorMsg('');
    }
  };

  const renderRoleStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-6 text-left"
    >
      <div>
        <h3 className="text-xl font-bold mb-1 text-white">Select target career role</h3>
        <p className="text-slate-400 text-xs">Choose the role you want us to match your skills and repositories against.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {roles.map(r => (
          <button
            key={r}
            type="button"
            onClick={() => { setTargetRole(r); setErrorMsg(''); }}
            className={`p-3 rounded-xl border text-xs font-semibold transition-all text-left ${
              targetRole === r 
                ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-md' 
                : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 text-slate-300'
            }`}
          >
            {r}
          </button>
        ))}
        <button
          type="button"
          onClick={() => { setTargetRole('Other'); setErrorMsg(''); }}
          className={`p-3 rounded-xl border text-xs font-semibold transition-all text-left ${
            targetRole === 'Other' 
              ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-md' 
              : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 text-slate-300'
          }`}
        >
          Other Custom Role...
        </button>
      </div>

      {targetRole === 'Other' && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300">Custom Target Role</label>
          <input
            type="text"
            value={customRole}
            onChange={(e) => setCustomRole(e.target.value)}
            placeholder="e.g. Frontend Engineer, Cloud Solutions Architect"
            className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-300">Paste Job Description (Optional)</label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste requirements, stack parameters, or details from a target job posting to extract precise custom required skills..."
          rows={4}
          className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition-colors resize-none font-sans"
        />
      </div>
    </motion.div>
  );

  const renderResumeStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-6 text-left"
    >
      <div>
        <h3 className="text-xl font-bold mb-1 text-white">Upload your resume</h3>
        <p className="text-slate-400 text-xs">We extract education, claims, and past technologies to seed verification matrices.</p>
      </div>

      <div className="border border-dashed border-slate-800 bg-slate-900/20 hover:bg-slate-900/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center relative group cursor-pointer transition-all">
        <input 
          type="file" 
          accept=".pdf"
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        <div className="w-12 h-12 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Upload size={20} />
        </div>
        {resumeFile ? (
          <div>
            <span className="font-bold text-xs text-white block mb-1">{resumeFile.name}</span>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 justify-center">
              <Check size={12} /> Ready to parse ({(resumeFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
        ) : (
          <div>
            <span className="text-xs text-slate-300 font-bold block mb-1">Click to select PDF or drag it here</span>
            <span className="text-[10px] text-slate-500 font-mono block">Supports PDF format up to 5MB</span>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderGithubStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-6 text-left"
    >
      <div>
        <h3 className="text-xl font-bold mb-1 text-white">Link your GitHub profile</h3>
        <p className="text-slate-400 text-xs">We extract repository READMEs, topics, and structures to search for skill evidence.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-300">GitHub Username</label>
        <div className="relative">
          <input
            type="text"
            value={githubUser}
            onChange={(e) => setGithubUser(e.target.value)}
            placeholder="e.g. torvalds"
            className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition-colors"
          />
          <Github size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
        </div>
        <span className="text-[10px] text-slate-500 font-mono leading-relaxed mt-1 block">
          Ensure your repositories are public so our platform intelligence parser can access project structures and readmes.
        </span>
      </div>
    </motion.div>
  );

  const renderConfirmStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-6 text-left"
    >
      <div className="text-center py-4 flex flex-col items-center">
        <div className="w-14 h-14 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4 animate-bounce">
          <Sparkles size={26} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Ready to verify credentials</h3>
        <p className="text-slate-400 text-xs max-w-sm">
          We have configured your targets and collected your upload materials. We are ready to scan and verify.
        </p>
      </div>

      <div className="rounded-xl border border-slate-900 bg-slate-900/30 p-4 flex flex-col gap-3.5 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-medium">Target Role:</span>
          <span className="font-bold text-white bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
            {targetRole === 'Other' ? customRole : targetRole}
          </span>
        </div>
        <div className="flex justify-between items-center border-t border-slate-900/50 pt-3">
          <span className="text-slate-500 font-medium">Resume File:</span>
          <span className="font-bold text-white flex items-center gap-1.5">
            <FileText size={14} className="text-slate-400" /> {resumeFile?.name}
          </span>
        </div>
        <div className="flex justify-between items-center border-t border-slate-900/50 pt-3">
          <span className="text-slate-500 font-medium">GitHub Account:</span>
          <span className="font-bold text-white flex items-center gap-1.5">
            <Github size={14} className="text-slate-400" /> {githubUser}
          </span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] w-[500px] h-[500px] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full bg-slate-950 border border-slate-900 rounded-3xl p-8 shadow-2xl relative z-10 flex flex-col gap-8">
        {/* Step dots */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-900">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step 
                    ? 'w-8 bg-blue-500' 
                    : s < step 
                      ? 'w-2.5 bg-emerald-500' 
                      : 'w-2.5 bg-slate-800'
                }`}
              />
            ))}
          </div>
          <button onClick={logout} className="text-xs font-semibold text-slate-500 hover:text-red-400 transition-colors">
            Cancel
          </button>
        </div>

        {/* Errors banner */}
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-3">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Wizard screens */}
        <div className="min-h-[220px]">
          <AnimatePresence mode="wait">
            {step === 1 && renderRoleStep()}
            {step === 2 && renderResumeStep()}
            {step === 3 && renderGithubStep()}
            {step === 4 && renderConfirmStep()}
          </AnimatePresence>
        </div>

        {/* Wizard Controls */}
        <div className="flex gap-4">
          {step > 1 && (
            <button
              onClick={() => { setStep(step - 1); setErrorMsg(''); }}
              disabled={isSubmitting}
              className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <ChevronLeft size={16} /> Back
            </button>
          )}
          
          {step < 4 ? (
            <button
              onClick={handleNextStep}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-blue-600/10 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Next Step'} <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleTriggerAnalysis}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? 'Analyzing...' : 'Start Extraction & Analysis'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
