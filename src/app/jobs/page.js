// src/app/jobs/page.js
"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, Briefcase, FileText, Send, User, 
  MapPin, CheckCircle, Clock, ChevronRight, Upload, Check 
} from "lucide-react";
import { dbService } from "@/lib/firebase";

export default function JobsDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [seekerProfile, setSeekerProfile] = useState(null);
  const [appliedHistory, setAppliedHistory] = useState([]);
  
  // Job Board Postings
  const OPEN_JOBS = [
    { id: "job_1", title: "Academic Coordinator", center: "South Delhi Hub", salary: "₹35k - ₹45k / mo", reqs: "MBA/B.Ed, 2+ Years Coordination Experience, Strong Comm Skills" },
    { id: "job_2", title: "Student Counselor", center: "Dwarka Center", salary: "₹25k - ₹35k / mo", reqs: "Graduate, Punctual, Experience in educational sales" },
    { id: "job_3", title: "Senior Mathematics Lecturer", center: "Rohini Coaching Inst.", salary: "₹60k - ₹80k / mo", reqs: "M.Sc./B.Tech from reputed institute, IIT JEE coaching experience preferred" }
  ];

  // Selected job for apply
  const [selectedJob, setSelectedJob] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [fileAttached, setFileAttached] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  // Resume AI Optimizer State
  const [aiFeedback, setAiFeedback] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const loadSeekerDetails = async (user) => {
    const seekers = await dbService.getJobSeekers();
    const profile = seekers.find(s => s.phone === user.phone);
    setSeekerProfile(profile);
    
    if (profile) {
      setAppliedHistory(profile.appliedJobs || []);
    }
  };

  useEffect(() => {
    const user = dbService.getCurrentUser();
    if (!user) {
      const mockJsUser = {
        uid: "js_1",
        phone: "9000110022",
        role: "jobseeker",
        name: "Vikram Rathore",
        email: "vikram.jobs@gmail.com"
      };
      localStorage.setItem("ss_current_user", JSON.stringify(mockJsUser));
      setCurrentUser(mockJsUser);
      loadSeekerDetails(mockJsUser);
    } else {
      setCurrentUser(user);
      loadSeekerDetails(user);
    }
  }, []);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!resumeText) {
      alert("Please enter a short resume summary or paste your text.");
      return;
    }
    setIsApplying(true);

    try {
      // Register seeker if not already in DB
      let updatedProfile = seekerProfile;
      if (!seekerProfile) {
        updatedProfile = await dbService.addJobSeeker({
          uid: currentUser.uid,
          name: currentUser.name,
          phone: currentUser.phone,
          email: currentUser.email,
          qualification: "Graduate",
          experience: "1-2 Years",
          resumeURL: "https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf",
          appliedJobs: [selectedJob.title],
          status: "applied"
        });
      } else {
        const nextJobs = [...seekerProfile.appliedJobs, selectedJob.title];
        updatedProfile = await dbService.updateJobSeeker(seekerProfile.uid, {
          appliedJobs: nextJobs
        });
      }

      setSeekerProfile(updatedProfile);
      setAppliedHistory(updatedProfile.appliedJobs);
      setIsApplying(false);
      setApplySuccess(true);
      
      setTimeout(() => {
        setSelectedJob(null);
        setApplySuccess(false);
      }, 1500);
    } catch (e) {
      console.error(e);
      setIsApplying(false);
    }
  };

  // Run Gemini AI Resume Optimizer
  const triggerResumeOptimize = async () => {
    if (!resumeText) {
      alert("Please paste your resume text in the text area first to let Gemini optimize it.");
      return;
    }
    setIsOptimizing(true);
    setAiFeedback(null);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "screen",
          resumeText,
          jobTitle: selectedJob ? selectedJob.title : "Educational Staff"
        })
      });
      const data = await response.json();
      setAiFeedback(data.result || null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in py-4">
      
      {/* Left panel: Job Board listings (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        
        <div className="glass-card rounded-3xl p-6 md:p-8 shadow-md">
          <div className="flex flex-col gap-1 mb-6">
            <h2 className="text-xl font-bold">Center Staff Openings</h2>
            <p className="text-xs text-muted">Join leading institutions and tuition centers in local hubs.</p>
          </div>

          <div className="flex flex-col gap-4">
            {OPEN_JOBS.map(job => (
              <div 
                key={job.id} 
                className={`border border-border/50 rounded-2xl p-5 bg-foreground/3 shadow-xs flex flex-col md:flex-row justify-between gap-4 items-start md:items-center ${
                  selectedJob?.id === job.id ? "bg-indigo-600/5 border-indigo-500/20" : ""
                }`}
              >
                <div className="flex flex-col gap-1.5 text-xs">
                  <h4 className="font-extrabold text-sm text-foreground">{job.title}</h4>
                  <p className="text-muted"><strong className="text-foreground">Location:</strong> {job.center} • <strong className="text-foreground">Budget:</strong> {job.salary}</p>
                  <p className="text-[10px] text-muted italic max-w-[420px]">{job.reqs}</p>
                </div>
                
                <button
                  onClick={() => { setSelectedJob(job); setAiFeedback(null); setResumeText(""); }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer shrink-0"
                >
                  Apply & Optimize
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Applied History */}
        <div className="glass-card rounded-3xl p-6 shadow-md">
          <h3 className="font-bold text-sm border-b border-indigo-500/10 pb-2 mb-4">My Applied Applications</h3>
          {appliedHistory.length === 0 ? (
            <p className="text-xs text-muted font-semibold text-center py-4">No applications submitted yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {appliedHistory.map((jobTitle, i) => (
                <div key={i} className="bg-foreground/3 border border-border/50 rounded-xl p-4 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-xl text-white">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold">{jobTitle}</h4>
                      <p className="text-[10px] text-muted">Applied Date: {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-lg font-bold">
                    Applied
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Right panel: Application portal & Resume Optimizer (5 Cols) */}
      <div className="lg:col-span-5">
        {selectedJob ? (
          <div className="glass-card rounded-2xl p-6 border border-indigo-500/20 shadow-xl flex flex-col gap-5 animate-slide-up">
            
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-base leading-tight">Apply for {selectedJob.title}</h3>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">{selectedJob.center}</p>
              </div>
              <button 
                onClick={() => setSelectedJob(null)}
                className="p-1 rounded-md hover:bg-foreground/10 text-muted font-bold"
              >
                Close
              </button>
            </div>

            {applySuccess ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center animate-scale-up">
                <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-full border border-emerald-500/20">
                  <Check className="h-8 w-8" />
                </div>
                <h4 className="font-bold text-sm">Application Sent!</h4>
                <p className="text-[10px] text-muted">Your resume has been submitted to the center manager.</p>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="flex flex-col gap-4">
                
                {/* Form fields */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase">1. Upload Resume File</label>
                  <button
                    type="button"
                    onClick={() => setFileAttached(true)}
                    className={`border border-dashed p-4 rounded-xl text-center text-xs text-muted flex flex-col items-center gap-1.5 bg-indigo-500/3 hover:bg-indigo-500/5 cursor-pointer ${
                      fileAttached ? "border-emerald-500 text-emerald-400 bg-emerald-500/3" : "border-indigo-500/20"
                    }`}
                  >
                    <Upload className="h-5 w-5" />
                    <span>{fileAttached ? "Resume_Vikram_Rathore.pdf attached!" : "Drag & drop your Resume PDF file"}</span>
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-muted uppercase">2. Paste Resume Text / Summary *</label>
                    <button
                      type="button"
                      onClick={triggerResumeOptimize}
                      disabled={isOptimizing}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3 animate-pulse-glow" />
                      <span>{isOptimizing ? "Analyzing..." : "Optimize with AI"}</span>
                    </button>
                  </div>
                  <textarea
                    required
                    rows="4"
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="E.g. Vikram Rathore. Completed MBA in Operations from DU in 2024. 2 years experience managing class schedules, resolving teacher payrolls, and handling student queries. Proficient in MS Excel and CRM tools..."
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 focus:outline-hidden text-xs resize-none"
                  ></textarea>
                </div>

                {/* AI feedback panel */}
                {aiFeedback && (
                  <div className="bg-indigo-600/5 border border-indigo-500/20 rounded-xl p-3 flex flex-col gap-2 text-[10px] leading-relaxed animate-slide-up">
                    <div className="flex justify-between items-center border-b border-indigo-500/10 pb-1.5">
                      <span className="font-bold flex items-center gap-1 text-indigo-400">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>AI Optimization Score</span>
                      </span>
                      <strong className="text-emerald-400">{aiFeedback.suitabilityScore}% Fit</strong>
                    </div>
                    
                    <div className="flex flex-col gap-1 mt-1">
                      <p className="font-bold text-slate-400">Gaps Identified:</p>
                      <ul className="list-disc pl-3 text-muted flex flex-col gap-0.5">
                        {aiFeedback.gapsIdentified.map((gap, i) => <li key={i}>{gap}</li>)}
                      </ul>
                    </div>

                    <div className="flex flex-col gap-1">
                      <p className="font-bold text-indigo-400">Actionable Tips:</p>
                      <ul className="list-disc pl-3 text-muted flex flex-col gap-0.5">
                        {aiFeedback.optimizationTips.map((tip, i) => <li key={i}>{tip}</li>)}
                      </ul>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isApplying}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {isApplying ? "Submitting Application..." : "Submit Staff Application"}
                </button>

              </form>
            )}

          </div>
        ) : (
          <div className="glass-card rounded-2xl p-6 text-center text-xs text-muted border border-border/50 shadow-md">
            Select an open staff position from the list to upload details, screen and optimize your resume summary using Gemini AI, and apply instantly.
          </div>
        )}
      </div>

    </div>
  );
}

// Inline custom X icon to resolve imports
function X({ className, ...props }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className} 
      {...props}
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
