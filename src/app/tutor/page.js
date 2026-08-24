// src/app/tutor/page.js
"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, FileText, Send, User, MapPin, 
  DollarSign, Check, GraduationCap, Clock, BookOpen, RefreshCw 
} from "lucide-react";
import { dbService } from "@/lib/firebase";

export default function TutorDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tutorProfile, setTutorProfile] = useState(null);
  const [availableLeads, setAvailableLeads] = useState([]);
  
  // Registration Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [qualification, setQualification] = useState("");
  const [experience, setExperience] = useState("");
  const [subjects, setSubjects] = useState("");
  const [classes, setClasses] = useState("");
  const [areas, setAreas] = useState("");
  const [fees, setFees] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  // Chatbot State
  const [chatMessages, setChatMessages] = useState([
    { sender: "ai", text: "Hello! I am your Tutor Coach AI. Ask me how to clear demo classes, structure your packages, or communicate with parents!" }
  ]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const loadTutorDetails = async (user) => {
    const tutorsList = await dbService.getTutors();
    // Match by phone (simulated credentials)
    const profile = tutorsList.find(t => t.phone === user.phone);
    setTutorProfile(profile);

    // If profile exists and is verified, load matching leads
    if (profile && profile.status === "verified") {
      const leads = await dbService.getLeads();
      
      // Filter leads that match subjects or location
      const matched = leads.filter(lead => {
        const matchesSubject = profile.subjects.some(s => lead.subject.toLowerCase().includes(s.toLowerCase()));
        const matchesLocation = profile.preferredAreas.some(area => lead.location.toLowerCase().includes(area.toLowerCase()));
        return matchesSubject || matchesLocation;
      });
      setAvailableLeads(matched);
    }
  };

  useEffect(() => {
    const user = dbService.getCurrentUser();
    if (!user) {
      // Setup mock logged-in tutor
      const mockTutorUser = {
        uid: "tutor_1",
        phone: "9876543210",
        role: "tutor",
        name: "Dr. Ananya Iyer",
        email: "ananya.iyer@gmail.com"
      };
      localStorage.setItem("ss_current_user", JSON.stringify(mockTutorUser));
      setCurrentUser(mockTutorUser);
      loadTutorDetails(mockTutorUser);
    } else {
      setCurrentUser(user);
      loadTutorDetails(user);
    }
  }, []);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone || !subjects || !fees) {
      alert("Please fill out Name, Phone, Subjects and Fees.");
      return;
    }
    setIsSubmitting(true);

    try {
      const newTutor = await dbService.addTutor({
        uid: currentUser.uid,
        name,
        phone,
        email,
        qualification,
        experience,
        subjects: subjects.split(",").map(s => s.trim()),
        classes: classes.split(",").map(c => c.trim()),
        preferredAreas: areas.split(",").map(a => a.trim()),
        fees: `${fees}/hr`,
      });

      setTutorProfile(newTutor);
      setIsRegistered(true);
      setIsSubmitting(false);
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMessage = userInput.trim();
    setChatMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setUserInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          message: userMessage,
          chatHistory: chatMessages,
          userRole: "tutor"
        })
      });
      const data = await response.json();
      setChatMessages((prev) => [...prev, { sender: "ai", text: data.result }]);
    } catch (e) {
      console.error(e);
      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Sorry, I had trouble answering. Tips for demo classes: Focus first on building rapport, and prepare a visual concept!" }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in py-4">
      
      {tutorProfile ? (
        /* REGISTERED TUTOR DASHBOARD VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: Matched Leads and profile stats (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Tutor Profile Header Card */}
            <div className="glass-card rounded-3xl p-6 flex flex-col md:flex-row justify-between gap-6 shadow-md">
              <div className="flex items-center gap-4">
                <img 
                  src={tutorProfile.photoURL} 
                  alt={tutorProfile.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-border"
                />
                <div>
                  <h2 className="text-xl font-bold">{tutorProfile.name}</h2>
                  <p className="text-xs text-indigo-400 font-semibold">{tutorProfile.qualification} • {tutorProfile.experience} Exp</p>
                  
                  <div className="flex items-center gap-1.5 mt-2">
                    {tutorProfile.status === "verified" ? (
                      <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">Verified Account ✅</span>
                    ) : (
                      <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full">Awaiting Admin Verification ⚠️</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Earnings summary */}
              <div className="bg-foreground/3 p-4 rounded-2xl flex flex-col justify-center min-w-[150px] border border-border/50">
                <p className="text-[10px] text-muted uppercase font-bold tracking-wider">Estimated Earnings</p>
                <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">₹18,500.00</h3>
                <span className="text-[8px] text-muted mt-0.5">Updated this week</span>
              </div>
            </div>

            {/* Matching Tuition Leads */}
            <div className="glass-card rounded-3xl p-6 shadow-md">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-lg">Matched Tuition Leads</h3>
                  <p className="text-xs text-muted">Leads matching your subject specializations or area preferences.</p>
                </div>
                <button
                  onClick={() => loadTutorDetails(currentUser)}
                  className="p-2 rounded-xl border border-indigo-500/20 text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10 cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {tutorProfile.status !== "verified" ? (
                <div className="text-center py-8 text-xs text-muted">
                  <p className="font-bold">Your profile is currently awaiting validation.</p>
                  <p className="mt-1">Once approved by Admin, matching tutoring requirements will appear here.</p>
                </div>
              ) : availableLeads.length === 0 ? (
                <p className="text-xs text-muted text-center py-6">No matching leads found at the moment.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {availableLeads.map(lead => (
                    <div key={lead.id} className="border border-border/50 rounded-2xl p-4 bg-foreground/3 flex justify-between items-center gap-4">
                      <div className="flex flex-col gap-1.5 text-xs">
                        <h4 className="font-bold text-sm text-foreground">{lead.subject} tutor required</h4>
                        <p className="text-muted">{lead.class} ({lead.board}) • Budget: {lead.budget}</p>
                        <p className="text-muted"><strong className="text-foreground">Area:</strong> {lead.location}</p>
                      </div>
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-xl font-bold capitalize">
                        Matched
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right panel: Tutor Coach chatbot (4 Cols) */}
          <div className="lg:col-span-4 glass-card rounded-3xl p-6 border border-indigo-500/20 shadow-lg flex flex-col h-[500px]">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className="bg-indigo-500/10 p-2.5 rounded-2xl text-indigo-500">
                <Sparkles className="h-5 w-5 animate-pulse-glow" />
              </div>
              <div>
                <h3 className="font-bold text-sm">AI Tutor Coach</h3>
                <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Gemini Powered Assistant</p>
              </div>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-3 my-4 scrollbar-thin">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white self-end rounded-tr-none"
                      : "bg-foreground/5 text-foreground self-start rounded-tl-none border border-border/50"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              ))}
              {isTyping && (
                <div className="bg-foreground/5 text-muted self-start rounded-2xl rounded-tl-none p-3 text-xs border border-border/50 animate-pulse">
                  Thinking...
                </div>
              )}
            </div>

            {/* Input form */}
            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ask advice: 'how to clear demo class'..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background/50 focus:outline-hidden focus:border-indigo-500 text-xs"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

        </div>
      ) : (
        /* TUTOR REGISTRATION VIEW */
        <div className="max-w-2xl mx-auto glass-card rounded-3xl p-6 md:p-8 shadow-lg border border-indigo-500/10">
          <div className="flex flex-col gap-2 mb-6">
            <h2 className="text-2xl font-bold">Register as a Study Spark Tutor</h2>
            <p className="text-xs text-muted">Join our elite network of private educators. Complete your profile for verification.</p>
          </div>

          {isRegistered ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center animate-slide-up">
              <div className="bg-emerald-500/10 text-emerald-500 p-4 rounded-full">
                <Check className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold">Profile Registered!</h3>
              <p className="text-sm text-muted max-w-sm">
                Your profile has been created and sent to our Admin team. Once verified, matches for your subjects will appear in your matching inbox.
              </p>
              <button
                onClick={() => loadTutorDetails(currentUser)}
                className="mt-4 px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                Go to Tutor Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted uppercase">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 focus:outline-hidden text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted uppercase">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 focus:outline-hidden text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted uppercase">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teacher@gmail.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 focus:outline-hidden text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted uppercase">Highest Qualification *</label>
                  <input
                    type="text"
                    required
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="e.g. M.Sc. Mathematics, B.Tech"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 focus:outline-hidden text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted uppercase">Years of Experience</label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 5 Years"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 focus:outline-hidden text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted uppercase">Expected Fee (₹ / hr) *</label>
                  <input
                    type="number"
                    required
                    value={fees}
                    onChange={(e) => setFees(e.target.value)}
                    placeholder="e.g. 800"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 focus:outline-hidden text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted uppercase">Subjects Taught (Comma separated) *</label>
                <input
                  type="text"
                  required
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  placeholder="e.g. Mathematics, Physics, Chemistry"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 focus:outline-hidden text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted uppercase">Preferred Classes (Comma separated)</label>
                  <input
                    type="text"
                    value={classes}
                    onChange={(e) => setClasses(e.target.value)}
                    placeholder="e.g. Class 9, Class 10, Class 11, Class 12"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 focus:outline-hidden text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted uppercase">Preferred Teaching Areas (Comma separated)</label>
                  <input
                    type="text"
                    value={areas}
                    onChange={(e) => setAreas(e.target.value)}
                    placeholder="e.g. Dwarka, Saket, Vasant Kunj"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 focus:outline-hidden text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-xs font-bold text-muted uppercase">Upload Credentials (Photo & Resume PDF)</label>
                <div className="border border-dashed border-indigo-500/30 rounded-xl p-6 text-center text-xs text-muted flex flex-col items-center gap-2 bg-indigo-500/3 hover:bg-indigo-500/5 transition-all">
                  <FileText className="h-8 w-8 text-indigo-400" />
                  <p>Drag and drop or click to upload certifications / Resume PDF</p>
                  <span className="text-[10px] text-muted">PDF, PNG, JPG accepted (Mock upload simulated)</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
              >
                {isSubmitting ? "Registering profile..." : "Register Tutor Profile"}
              </button>

            </form>
          )}

        </div>
      )}

    </div>
  );
}
