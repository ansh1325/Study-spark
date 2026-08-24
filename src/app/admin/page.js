// src/app/admin/page.js
"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, Users, DollarSign, Calendar, MapPin, 
  Sparkles, Check, Trash, Search, ArrowRight, 
  MessageSquare, User, Eye, CheckCircle, Clock, AlertTriangle, FileText, X
} from "lucide-react";
import { dbService } from "@/lib/firebase";

export default function AdminDashboard() {
  const [leads, setLeads] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [jobseekers, setJobseekers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reminders, setReminders] = useState([]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // UI Active panels
  const [activeTab, setActiveTab] = useState("crm"); // crm, tutors, jobs, payments, map
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedJobseeker, setSelectedJobseeker] = useState(null);

  // AI Matches & Copy states
  const [aiMatches, setAiMatches] = useState([]);
  const [isMatching, setIsMatching] = useState(false);
  const [crmTemplate, setCrmTemplate] = useState("");
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);
  const [resumeScreenResult, setResumeScreenResult] = useState(null);
  const [isScreening, setIsScreening] = useState(false);

  // Load dashboard data
  const loadData = async () => {
    const l = await dbService.getLeads();
    const t = await dbService.getTutors();
    const j = await dbService.getJobseekers();
    const p = await dbService.getPayments();
    const r = await dbService.getReminders();
    setLeads(l);
    setTutors(t);
    setJobseekers(j);
    setPayments(p);
    setReminders(r);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync to database updates
  const handleUpdateLeadStatus = async (leadId, nextStatus) => {
    const updated = await dbService.updateLead(leadId, { status: nextStatus });
    setLeads(leads.map(l => l.id === leadId ? updated : l));
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(updated);
    }
  };

  const handleVerifyTutor = async (tutorUid) => {
    const updated = await dbService.updateTutor(tutorUid, { status: "verified" });
    setTutors(tutors.map(t => t.uid === tutorUid ? updated : t));
  };

  const handleAssignTutor = async (leadId, tutorId) => {
    const updated = await dbService.updateLead(leadId, { 
      assignedTutorId: tutorId, 
      status: "assigned" 
    });
    setLeads(leads.map(l => l.id === leadId ? updated : l));
    setSelectedLead(updated);
    
    // Add reminder automatically for Demo Scheduling
    await dbService.addReminder({
      title: `Schedule Demo: Student ${updated.studentName} with tutor ${tutors.find(t => t.uid === tutorId)?.name || 'Shortlisted Tutor'}`,
      type: "demo",
      date: new Date(Date.now() + 24 * 3600000).toISOString(),
      leadId: leadId
    });
    const updatedReminders = await dbService.getReminders();
    setReminders(updatedReminders);
  };

  // AI Matching logic using secure backend API route
  const triggerAiMatching = async (lead) => {
    setIsMatching(true);
    setAiMatches([]);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "match",
          lead,
          tutors: tutors.filter(t => t.status === "verified")
        })
      });
      const data = await response.json();
      setAiMatches(data.result || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsMatching(false);
    }
  };

  // AI Copy Template generation
  const triggerCrmTemplate = async (lead, status) => {
    setIsGeneratingTemplate(true);
    setCrmTemplate("");
    try {
      const tutor = tutors.find(t => t.uid === lead.assignedTutorId);
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "template",
          lead,
          status,
          tutor
        })
      });
      const data = await response.json();
      setCrmTemplate(data.result || "");
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingTemplate(false);
    }
  };

  // AI Resume Screening
  const triggerResumeScreen = async (js) => {
    setIsScreening(true);
    setResumeScreenResult(null);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "screen",
          resumeText: `Name: ${js.name}. Academic Background: ${js.qualification}. Industry Experience: ${js.experience}. Applying for roles: ${js.appliedJobs.join(", ")}.`,
          jobTitle: js.appliedJobs[0] || "Academic Staff"
        })
      });
      const data = await response.json();
      setResumeScreenResult(data.result || null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsScreening(false);
    }
  };

  // Filtered Leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSubject = filterSubject ? lead.subject.toLowerCase().includes(filterSubject.toLowerCase()) : true;
    const matchesClass = filterClass ? lead.class.toLowerCase().includes(filterClass.toLowerCase()) : true;
    const matchesStatus = filterStatus ? lead.status === filterStatus : true;

    return matchesSearch && matchesSubject && matchesClass && matchesStatus;
  });

  // CRM Pipeline details
  const CRM_COLUMNS = [
    { id: "new", label: "New Leads", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
    { id: "contacted", label: "Contacted", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    { id: "assigned", label: "Teacher Assigned", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    { id: "demo_scheduled", label: "Demo Scheduled", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    { id: "confirmed", label: "Confirmed", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    { id: "payment_pending", label: "Payment Pending", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
    { id: "completed", label: "Completed", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  ];

  // Financial calculations
  const totalRevenue = payments.filter(p => p.status === "success").reduce((sum, p) => sum + p.amount, 0);
  const pendingPaymentsCount = leads.filter(l => l.status === "payment_pending").length;

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      
      {/* 1. Admin Metrics Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="glass-card metric-card rounded-2xl p-4 md:p-6 shadow-md flex items-center gap-4">
          <div className="bg-indigo-500/10 p-3.5 rounded-xl text-indigo-500">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Total Leads</p>
            <h4 className="text-2xl font-extrabold">{leads.length}</h4>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-card metric-card rounded-2xl p-4 md:p-6 shadow-md flex items-center gap-4">
          <div className="bg-emerald-500/10 p-3.5 rounded-xl text-emerald-500">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Verified Tutors</p>
            <h4 className="text-2xl font-extrabold">{tutors.filter(t => t.status === "verified").length}</h4>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-card metric-card rounded-2xl p-4 md:p-6 shadow-md flex items-center gap-4">
          <div className="bg-amber-500/10 p-3.5 rounded-xl text-amber-500">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Revenue Collected</p>
            <h4 className="text-2xl font-extrabold">₹{totalRevenue}</h4>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-card metric-card rounded-2xl p-4 md:p-6 shadow-md flex items-center gap-4">
          <div className="bg-rose-500/10 p-3.5 rounded-xl text-rose-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Pending Payments</p>
            <h4 className="text-2xl font-extrabold">{pendingPaymentsCount}</h4>
          </div>
        </div>

      </div>

      {/* 2. Primary Tabs Selector */}
      <div className="flex border-b border-indigo-500/10 gap-4">
        <button
          onClick={() => { setActiveTab("crm"); setSelectedLead(null); }}
          className={`pb-3 text-sm font-bold tracking-wide transition-all border-b-2 cursor-pointer ${
            activeTab === "crm" 
              ? "text-indigo-400 border-indigo-500 font-extrabold scale-102" 
              : "text-muted border-transparent hover:text-foreground"
          }`}
        >
          Leads CRM Pipeline
        </button>
        <button
          onClick={() => setActiveTab("tutors")}
          className={`pb-3 text-sm font-bold tracking-wide transition-all border-b-2 cursor-pointer ${
            activeTab === "tutors" 
              ? "text-indigo-400 border-indigo-500 font-extrabold scale-102" 
              : "text-muted border-transparent hover:text-foreground"
          }`}
        >
          Tutors Management
        </button>
        <button
          onClick={() => { setActiveTab("jobs"); setSelectedJobseeker(null); }}
          className={`pb-3 text-sm font-bold tracking-wide transition-all border-b-2 cursor-pointer ${
            activeTab === "jobs" 
              ? "text-indigo-400 border-indigo-500 font-extrabold scale-102" 
              : "text-muted border-transparent hover:text-foreground"
          }`}
        >
          Staff Jobs
        </button>
        <button
          onClick={() => setActiveTab("reminders")}
          className={`pb-3 text-sm font-bold tracking-wide transition-all border-b-2 cursor-pointer ${
            activeTab === "reminders" 
              ? "text-indigo-400 border-indigo-500 font-extrabold scale-102" 
              : "text-muted border-transparent hover:text-foreground"
          }`}
        >
          Tasks & Reminders ({reminders.filter(r => r.status === "pending").length})
        </button>
        <button
          onClick={() => setActiveTab("map")}
          className={`pb-3 text-sm font-bold tracking-wide transition-all border-b-2 cursor-pointer ${
            activeTab === "map" 
              ? "text-indigo-400 border-indigo-500 font-extrabold scale-102" 
              : "text-muted border-transparent hover:text-foreground"
          }`}
        >
          Lead Heatmap
        </button>
      </div>

      {/* 3. Render Dashboard Tabs */}

      {/* Tab: CRM Pipeline */}
      {activeTab === "crm" && (
        <div className="flex flex-col gap-6">
          
          {/* Search and Filters Bar */}
          <div className="glass-card rounded-2xl p-4 flex flex-wrap gap-4 items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 border border-border rounded-xl bg-background/50 px-3 py-2 w-full max-w-sm">
              <Search className="h-4 w-4 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subject, class, area..."
                className="bg-transparent focus:outline-hidden text-xs w-full"
              />
            </div>
            
            <div className="flex flex-wrap gap-2.5">
              <select 
                value={filterClass} 
                onChange={(e) => setFilterClass(e.target.value)}
                className="bg-background/50 border border-border text-xs px-3 py-2 rounded-xl text-foreground font-semibold"
              >
                <option value="">All Classes</option>
                <option value="Class 10">Class 10</option>
                <option value="Class 12">Class 12</option>
                <option value="Class 8">Class 8</option>
              </select>
              
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-background/50 border border-border text-xs px-3 py-2 rounded-xl text-foreground font-semibold"
              >
                <option value="">All Stages</option>
                {CRM_COLUMNS.map(col => (
                  <option key={col.id} value={col.id}>{col.label}</option>
                ))}
              </select>

              <button 
                onClick={() => { setSearchQuery(""); setFilterClass(""); setFilterStatus(""); }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold px-2 py-1"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* CRM Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left pipeline list (8 Cols) */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              
              {/* Table or Column blocks */}
              <div className="glass-card rounded-2xl p-4 overflow-x-auto shadow-md">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-indigo-500/10 text-muted font-bold uppercase text-[10px]">
                      <th className="py-3 px-2">Student Name</th>
                      <th className="py-3 px-2">Subject / Grade</th>
                      <th className="py-3 px-2">Location</th>
                      <th className="py-3 px-2">CRM Stage</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-muted font-semibold">No leads match the filters. Try adding a new lead on the Homepage.</td>
                      </tr>
                    ) : (
                      filteredLeads.map(lead => (
                        <tr 
                          key={lead.id} 
                          className={`border-b border-indigo-500/5 hover:bg-indigo-600/5 transition-colors cursor-pointer ${
                            selectedLead?.id === lead.id ? "bg-indigo-600/10 border-l-4 border-l-indigo-500" : ""
                          }`}
                          onClick={() => { setSelectedLead(lead); setAiMatches([]); setCrmTemplate(""); }}
                        >
                          <td className="py-3 px-2 font-bold">{lead.studentName}</td>
                          <td className="py-3 px-2">
                            <div>{lead.subject}</div>
                            <div className="text-[10px] text-muted">{lead.class} ({lead.board})</div>
                          </td>
                          <td className="py-3 px-2">{lead.location}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${
                              CRM_COLUMNS.find(c => c.id === lead.status)?.color || "bg-slate-500/10 text-slate-400"
                            }`}>
                              {CRM_COLUMNS.find(c => c.id === lead.status)?.label || lead.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); setAiMatches([]); }}
                              className="px-2.5 py-1.5 rounded-lg border border-indigo-500/20 text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/20 font-bold transition-all text-[10px]"
                            >
                              Open matching
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Right matcher details sidebar (4 Cols) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {selectedLead ? (
                <div className="glass-card rounded-2xl p-6 flex flex-col gap-5 border border-indigo-500/20 shadow-lg animate-slide-up">
                  
                  {/* Lead Info Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-base leading-tight">{selectedLead.studentName}</h3>
                      <p className="text-[10px] text-muted font-semibold mt-0.5">Parent: {selectedLead.parentName} ({selectedLead.phone})</p>
                    </div>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20 px-2 py-0.5 rounded-lg">
                      {selectedLead.class}
                    </span>
                  </div>

                  {/* Lead details list */}
                  <div className="bg-foreground/5 p-3 rounded-xl flex flex-col gap-2 text-xs border border-border/50">
                    <p className="flex justify-between"><span className="text-muted">Subject:</span> <strong>{selectedLead.subject}</strong></p>
                    <p className="flex justify-between"><span className="text-muted">Location:</span> <strong className="text-right max-w-[180px] truncate">{selectedLead.location}</strong></p>
                    <p className="flex justify-between"><span className="text-muted">Budget:</span> <strong>{selectedLead.budget}</strong></p>
                    <p className="flex justify-between"><span className="text-muted">Preferred slots:</span> <strong className="text-right max-w-[180px] truncate">{selectedLead.timings}</strong></p>
                    {selectedLead.assignedTutorId && (
                      <p className="flex justify-between text-purple-400"><span className="text-muted">Tutor Assigned:</span> <strong>{tutors.find(t => t.uid === selectedLead.assignedTutorId)?.name || "Assigned"}</strong></p>
                    )}
                  </div>

                  {/* Stage Update Controls */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-muted uppercase">Advance CRM Stage</label>
                    <div className="flex gap-2">
                      <select
                        value={selectedLead.status}
                        onChange={(e) => handleUpdateLeadStatus(selectedLead.id, e.target.value)}
                        className="flex-1 bg-background/50 border border-border text-xs px-3 py-2 rounded-xl text-foreground font-semibold"
                      >
                        {CRM_COLUMNS.map(col => (
                          <option key={col.id} value={col.id}>{col.label}</option>
                        ))}
                        <option value="cancelled">Cancelled ❌</option>
                      </select>
                    </div>
                  </div>

                  {/* 1. Gemini Tutor Matcher Panel */}
                  <div className="border-t border-indigo-500/10 pt-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse-glow" />
                        <span>AI Tutor Matcher</span>
                      </h4>
                      <button
                        onClick={() => triggerAiMatching(selectedLead)}
                        disabled={isMatching}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] cursor-pointer transition-all shadow-md shadow-indigo-500/10"
                      >
                        {isMatching ? "Scanning..." : "Run AI Matching"}
                      </button>
                    </div>

                    {/* Matching results */}
                    {aiMatches.length > 0 && (
                      <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
                        {aiMatches.map(match => {
                          const tutorObj = tutors.find(t => t.uid === match.uid);
                          return (
                            <div key={match.uid} className="bg-indigo-600/5 border border-indigo-500/20 rounded-xl p-3 flex flex-col gap-2 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="font-bold">{tutorObj?.name || "Tutor"}</span>
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-extrabold px-2 py-0.5 rounded-md border border-emerald-500/20">{match.score}% Fit</span>
                              </div>
                              <p className="text-[10px] text-muted leading-relaxed">{match.matchReason}</p>
                              <button
                                onClick={() => handleAssignTutor(selectedLead.id, match.uid)}
                                className="w-full mt-1 py-1 bg-indigo-500/10 hover:bg-indigo-600 text-indigo-400 hover:text-white font-bold text-[10px] rounded-lg transition-all border border-indigo-500/20"
                              >
                                Assign Tutor
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 2. Gemini Copy Copilot CRM Panel */}
                  <div className="border-t border-indigo-500/10 pt-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold flex items-center gap-1.5">
                        <MessageSquare className="h-4 w-4 text-purple-400" />
                        <span>AI Copywriter Copilot</span>
                      </h4>
                      <button
                        onClick={() => triggerCrmTemplate(selectedLead, selectedLead.status)}
                        disabled={isGeneratingTemplate}
                        className="px-2.5 py-1.5 rounded-xl border border-purple-500/20 text-purple-400 bg-purple-500/5 hover:bg-purple-500/15 font-bold text-[10px] cursor-pointer transition-all"
                      >
                        {isGeneratingTemplate ? "Writing..." : "Write Message Copy"}
                      </button>
                    </div>

                    {crmTemplate && (
                      <div className="bg-purple-600/5 border border-purple-500/20 rounded-xl p-3 flex flex-col gap-2 text-[10px] leading-relaxed">
                        <p className="whitespace-pre-line text-muted">{crmTemplate}</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(crmTemplate);
                            alert("Outreach template copied to clipboard!");
                          }}
                          className="self-end px-3 py-1 bg-purple-600 text-white font-bold text-[9px] rounded-lg hover:bg-purple-500 transition-all shadow-md cursor-pointer"
                        >
                          Copy Text
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="glass-card rounded-2xl p-6 text-center text-xs text-muted border border-border/50 shadow-md">
                  Select a lead from the CRM table to manage status, run AI matching algorithms, or generate personalized WhatsApp follow-ups.
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* Tab: Tutors List */}
      {activeTab === "tutors" && (
        <div className="glass-card rounded-2xl p-6 shadow-md flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Registered Home Tutors</h2>
              <p className="text-xs text-muted">Verify qualifications and verify documents before matching them to parent requirements.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutors.map(tutor => (
              <div 
                key={tutor.uid} 
                className={`glass-card rounded-2xl p-5 border shadow-sm flex flex-col justify-between ${
                  tutor.status === "verified" ? "border-indigo-500/10" : "border-amber-500/20 bg-amber-500/3"
                }`}
              >
                <div className="flex flex-col gap-4">
                  
                  {/* Tutor Header */}
                  <div className="flex items-center gap-3">
                    <img 
                      src={tutor.photoURL} 
                      alt={tutor.name}
                      className="w-12 h-12 rounded-xl object-cover border border-border"
                    />
                    <div>
                      <h4 className="font-bold text-sm">{tutor.name}</h4>
                      <p className="text-[10px] text-muted">{tutor.qualification}</p>
                    </div>
                  </div>

                  {/* Stats list */}
                  <div className="bg-foreground/3 p-3 rounded-xl flex flex-col gap-1.5 text-xs text-muted border border-border/20">
                    <p><strong className="text-foreground">Experience:</strong> {tutor.experience}</p>
                    <p><strong className="text-foreground">Subjects:</strong> {tutor.subjects.join(", ")}</p>
                    <p><strong className="text-foreground">Areas:</strong> {tutor.preferredAreas.join(", ")}</p>
                    <p><strong className="text-foreground">Fee:</strong> {tutor.fees}</p>
                    <p className="flex items-center gap-1.5 mt-1 font-semibold text-[10px]">
                      Status: 
                      {tutor.status === "verified" ? (
                        <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/10">Verified ✅</span>
                      ) : (
                        <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/10">Verification Pending ⚠️</span>
                      )}
                    </p>
                  </div>

                </div>

                {/* Verification CTA */}
                {tutor.status !== "verified" && (
                  <button
                    onClick={() => handleVerifyTutor(tutor.uid)}
                    className="w-full mt-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Verify & Approve Tutor
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Job Seeker Staff */}
      {activeTab === "jobs" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Seekers list (7 Cols) */}
          <div className="lg:col-span-7 glass-card rounded-2xl p-6 shadow-md flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold">Center Staff Applications</h2>
              <p className="text-xs text-muted">Screen job applications and resumes for coaching centers and coordinators.</p>
            </div>

            <div className="flex flex-col gap-4">
              {jobseekers.map(js => (
                <div 
                  key={js.uid} 
                  onClick={() => { setSelectedJobseeker(js); setResumeScreenResult(null); }}
                  className={`border border-border/50 rounded-2xl p-4 hover:bg-foreground/3 transition-all cursor-pointer flex items-center justify-between ${
                    selectedJobseeker?.uid === js.uid ? "bg-indigo-600/5 border-indigo-500/20" : ""
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <h4 className="font-bold text-sm">{js.name}</h4>
                    <p className="text-xs text-muted">{js.qualification} • {js.experience} Exp</p>
                    <p className="text-[10px] font-bold text-indigo-400 capitalize mt-1">Applying: {js.appliedJobs.join(", ")}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold capitalize ${
                    js.status === "applied" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                    js.status === "interviewing" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  }`}>
                    {js.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Screening details side panel (5 Cols) */}
          <div className="lg:col-span-5">
            {selectedJobseeker ? (
              <div className="glass-card rounded-2xl p-6 border border-indigo-500/20 shadow-lg flex flex-col gap-6 animate-slide-up">
                
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-base">{selectedJobseeker.name}</h3>
                    <p className="text-xs text-muted">Phone: {selectedJobseeker.phone} ({selectedJobseeker.email})</p>
                  </div>
                  <span className="text-[10px] bg-purple-500/10 text-purple-400 font-bold border border-purple-500/20 px-2 py-0.5 rounded-lg">
                    Applicant
                  </span>
                </div>

                {/* Resume details */}
                <div className="bg-foreground/3 border border-border/50 rounded-xl p-4 text-xs flex flex-col gap-2">
                  <p className="flex justify-between"><span className="text-muted">Education:</span> <strong>{selectedJobseeker.qualification}</strong></p>
                  <p className="flex justify-between"><span className="text-muted">Experience:</span> <strong>{selectedJobseeker.experience}</strong></p>
                  <a 
                    href={selectedJobseeker.resumeURL} 
                    target="_blank" 
                    rel="noreferrer"
                    className="mt-2 text-indigo-400 font-bold hover:underline flex items-center gap-1.5 w-fit"
                  >
                    <FileText className="h-4 w-4" />
                    <span>View Resume PDF</span>
                  </a>
                </div>

                {/* AI Screening Actions */}
                <div className="border-t border-indigo-500/10 pt-4 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse-glow" />
                      <span>AI Resume Screener Feedback</span>
                    </h4>
                    <button
                      onClick={() => triggerResumeScreen(selectedJobseeker)}
                      disabled={isScreening}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] cursor-pointer transition-all shadow-md"
                    >
                      {isScreening ? "Analyzing..." : "Screen with AI"}
                    </button>
                  </div>

                  {/* Screening result output */}
                  {resumeScreenResult && (
                    <div className="flex flex-col gap-4 bg-indigo-600/5 border border-indigo-500/20 rounded-xl p-4 text-xs animate-slide-up">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">Suitability Index</span>
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-extrabold">{resumeScreenResult.suitabilityScore}% Fit</span>
                      </div>

                      <div className="flex flex-col gap-2">
                        <p className="font-bold text-[10px] text-indigo-400 uppercase tracking-wider">Candidate Strengths:</p>
                        <ul className="list-disc pl-4 text-[10px] text-muted flex flex-col gap-1">
                          {resumeScreenResult.keyStrengths.map((str, i) => <li key={i}>{str}</li>)}
                        </ul>
                      </div>

                      <div className="flex flex-col gap-2">
                        <p className="font-bold text-[10px] text-amber-400 uppercase tracking-wider">Gaps / Enhancements:</p>
                        <ul className="list-disc pl-4 text-[10px] text-muted flex flex-col gap-1">
                          {resumeScreenResult.gapsIdentified.map((gap, i) => <li key={i}>{gap}</li>)}
                        </ul>
                      </div>

                      <div className="flex flex-col gap-2">
                        <p className="font-bold text-[10px] text-purple-400 uppercase tracking-wider">Resume Optimization Tips:</p>
                        <ul className="list-disc pl-4 text-[10px] text-muted flex flex-col gap-1">
                          {resumeScreenResult.optimizationTips.map((tip, i) => <li key={i}>{tip}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            ) : (
              <div className="glass-card rounded-2xl p-6 text-center text-xs text-muted border border-border/50 shadow-md">
                Select an applicant from the list to view profile, download resume files, and perform Gemini-backed AI screening reviews.
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab: Tasks & Reminders */}
      {activeTab === "reminders" && (
        <div className="glass-card rounded-2xl p-6 shadow-md flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-bold">Upcoming Tasks & Reminders</h2>
            <p className="text-xs text-muted">Keep track of scheduled tutor demos, parent follow-ups, and collection calls.</p>
          </div>

          <div className="flex flex-col gap-3">
            {reminders.length === 0 ? (
              <p className="text-xs text-muted font-bold text-center py-6">No scheduled reminders found.</p>
            ) : (
              reminders.map(rem => (
                <div 
                  key={rem.id} 
                  className={`border border-border/50 rounded-2xl p-4 flex items-center justify-between ${
                    rem.status === "completed" ? "opacity-50 bg-foreground/2" : "bg-foreground/3"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl text-white ${
                      rem.type === "payment" ? "bg-rose-500" :
                      rem.type === "demo" ? "bg-amber-500" : "bg-indigo-600"
                    }`}>
                      {rem.type === "payment" ? <DollarSign className="h-4 w-4" /> :
                       rem.type === "demo" ? <Eye className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${rem.status === "completed" ? "line-through" : ""}`}>{rem.title}</h4>
                      <p className="text-[10px] text-muted">Scheduled: {new Date(rem.date).toLocaleString()}</p>
                    </div>
                  </div>

                  {rem.status === "pending" && (
                    <button
                      onClick={async () => {
                        await dbService.updateReminder(rem.id, { status: "completed" });
                        const updated = await dbService.getReminders();
                        setReminders(updated);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-indigo-500/20 text-indigo-400 bg-indigo-500/5 hover:bg-indigo-600 hover:text-white transition-all font-bold text-xs cursor-pointer"
                    >
                      Mark Done
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Hotspots Map */}
      {activeTab === "map" && (
        <div className="glass-card rounded-2xl p-6 shadow-md flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-bold">Delhi NCR Lead Heatmap</h2>
            <p className="text-xs text-muted">Visual distribution of tutoring leads and matching density across Delhi hubs.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Styled Map Widget (7 Cols) */}
            <div className="lg:col-span-7 flex justify-center bg-slate-950 p-8 rounded-3xl border border-indigo-500/10 relative overflow-hidden shadow-inner min-h-[350px]">
              
              {/* Map background grid pattern */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>

              {/* Pulsing Hotspots representing Delhi areas */}
              <div className="relative z-10 w-full max-w-[400px] h-[300px]">
                
                {/* SVG styled map outline */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-indigo-950 stroke-indigo-500/20 fill-indigo-950/20 stroke-2">
                  <path d="M 10 30 Q 30 10, 50 30 T 90 30 Q 95 60, 70 80 T 30 90 Q 5 60, 10 30 Z" />
                </svg>

                {/* Hotspot 1: Dwarka */}
                <div className="absolute top-[50%] left-[20%] flex flex-col items-center">
                  <span className="w-4 h-4 bg-emerald-500 rounded-full animate-ping absolute"></span>
                  <span className="w-3 h-3 bg-emerald-500 rounded-full relative shadow-lg shadow-emerald-500/50"></span>
                  <span className="text-[9px] font-extrabold bg-slate-900 border border-emerald-500/20 px-2 py-0.5 rounded-md mt-1 text-white shadow-md">Dwarka</span>
                </div>

                {/* Hotspot 2: Saket */}
                <div className="absolute top-[70%] left-[55%] flex flex-col items-center">
                  <span className="w-4 h-4 bg-indigo-500 rounded-full animate-ping absolute"></span>
                  <span className="w-3 h-3 bg-indigo-500 rounded-full relative shadow-lg shadow-indigo-500/50"></span>
                  <span className="text-[9px] font-extrabold bg-slate-900 border border-indigo-500/20 px-2 py-0.5 rounded-md mt-1 text-white shadow-md">Saket</span>
                </div>

                {/* Hotspot 3: Vasant Kunj */}
                <div className="absolute top-[62%] left-[40%] flex flex-col items-center">
                  <span className="w-4 h-4 bg-purple-500 rounded-full animate-ping absolute"></span>
                  <span className="w-3 h-3 bg-purple-500 rounded-full relative shadow-lg shadow-purple-500/50"></span>
                  <span className="text-[9px] font-extrabold bg-slate-900 border border-purple-500/20 px-2 py-0.5 rounded-md mt-1 text-white shadow-md">Vasant Kunj</span>
                </div>

                {/* Hotspot 4: Lajpat Nagar */}
                <div className="absolute top-[48%] left-[68%] flex flex-col items-center">
                  <span className="w-4 h-4 bg-pink-500 rounded-full animate-ping absolute"></span>
                  <span className="w-3 h-3 bg-pink-500 rounded-full relative shadow-lg shadow-pink-500/50"></span>
                  <span className="text-[9px] font-extrabold bg-slate-900 border border-pink-500/20 px-2 py-0.5 rounded-md mt-1 text-white shadow-md">Lajpat Nagar</span>
                </div>

              </div>

            </div>

            {/* Region Details (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <h3 className="font-bold text-sm border-b border-indigo-500/10 pb-2">Active Tutoring Hubs</h3>
              <div className="flex flex-col gap-3">
                
                {/* Hub Row 1 */}
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                    <span>South Delhi (Saket/Vasant Kunj)</span>
                  </div>
                  <strong className="text-indigo-400">4 Active Leads</strong>
                </div>

                {/* Hub Row 2 */}
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>West Delhi (Dwarka/Janakpuri)</span>
                  </div>
                  <strong className="text-emerald-400">3 Active Leads</strong>
                </div>

                {/* Hub Row 3 */}
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                    <span>East & Central (Lajpat Nagar)</span>
                  </div>
                  <strong className="text-pink-400">2 Active Leads</strong>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
