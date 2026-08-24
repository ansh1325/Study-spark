// src/app/page.js
"use client";

import { useState, useEffect } from "react";
import { Sparkles, MapPin, GraduationCap, Briefcase, BookOpen, Send, User, ChevronRight, Check } from "lucide-react";
import { dbService } from "@/lib/firebase";

export default function Home() {
  // Parent Lead Form State
  const [studentName, setStudentName] = useState("");
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("Class 10");
  const [board, setBoard] = useState("CBSE");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [timings, setTimings] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);

  // AI Assistant Chat State
  const [chatMessages, setChatMessages] = useState([
    { sender: "ai", text: "Hello! I am your Study Spark AI Advisor. Ask me anything about home tuition budgets, study boards (CBSE vs ICSE), prep tips, or rates in Delhi-NCR!" }
  ]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Form submission handler
  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    if (!studentName || !phone || !subject || !location) {
      alert("Please fill out Name, Phone, Subject, and Location.");
      return;
    }
    
    try {
      await dbService.addLead({
        studentName,
        parentName: parentName || studentName + "'s Parent",
        phone,
        class: grade,
        subject,
        board,
        location,
        budget: budget ? `${budget}/month` : "Discussable",
        timings: timings || "Flexible"
      });
      setFormSubmitted(true);
      // Reset form
      setStudentName("");
      setParentName("");
      setPhone("");
      setSubject("");
      setLocation("");
      setBudget("");
      setTimings("");
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Submission Error: " + error.message);
    }
  };

  // AI Assistant chat submit
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMessage = userInput.trim();
    setChatMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setUserInput("");
    setIsTyping(true);

    try {
      // Call secure Next.js API route
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          message: userMessage,
          chatHistory: chatMessages,
          userRole: "parent"
        })
      });
      const data = await response.json();
      
      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", text: data.result || "I apologize, but I am unable to reply at the moment. Please verify your Gemini API key." }
      ]);
    } catch (e) {
      console.error("Chat failure:", e);
      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Something went wrong. Let me help you with general budgets: Typical primary school home tuitions cost between ₹4,000 to ₹6,000/mo." }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col gap-12 py-4 animate-fade-in">
      
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-radial from-indigo-950/20 via-background to-background border border-indigo-500/10 p-8 md:p-16 text-center shadow-xl">
        <div className="absolute inset-0 bg-linear-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col gap-6 items-center">
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider animate-pulse-glow">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Driven Home Tutor Network</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Spark Academic Excellence with{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent glow-text">
              Personalized Tutoring
            </span>
          </h1>

          <p className="text-muted text-base md:text-lg max-w-2xl leading-relaxed">
            Study Spark bridges the gap between expert home educators and parents. Powered by advanced Gemini AI matching, we secure the perfect match for your child in minutes.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-2">
            <a
              href="#post-requirement"
              className="px-6 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
            >
              Post Tutor Requirement
            </a>
            <a
              href="/login"
              className="px-6 py-3 rounded-xl font-bold border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-foreground transition-all hover:-translate-y-0.5"
            >
              Access Dashboard
            </a>
          </div>

        </div>
      </section>

      {/* 2. Core CTA Role Columns */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Parents */}
        <div className="glass-card glass-card-hover rounded-3xl p-6 flex flex-col justify-between shadow-md">
          <div className="flex flex-col gap-4">
            <div className="bg-indigo-500/10 p-3 w-fit rounded-2xl text-indigo-500">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Find a Private Tutor</h3>
            <p className="text-xs text-muted leading-relaxed">
              Submit your subject, class, board prep, location, and budget constraints. Let our team (and AI matching algorithm) find the top tutor options for you.
            </p>
          </div>
          <a
            href="#post-requirement"
            className="mt-6 flex items-center justify-between text-sm font-bold text-indigo-400 hover:text-indigo-300 group cursor-pointer"
          >
            <span>Post Requirement</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Card 2: Tutors */}
        <div className="glass-card glass-card-hover rounded-3xl p-6 flex flex-col justify-between shadow-md">
          <div className="flex flex-col gap-4">
            <div className="bg-purple-500/10 p-3 w-fit rounded-2xl text-purple-500">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Register as a Teacher</h3>
            <p className="text-xs text-muted leading-relaxed">
              Are you a qualified educator, college student, or subject specialist? Build your tutor profile, submit documents, set your rates, and get verified tutoring leads.
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.setItem("ss_current_user", JSON.stringify({ uid: "new_tutor", role: "tutor", name: "Guest Tutor", phone: "9876540001" }));
              window.location.href = "/tutor";
            }}
            className="mt-6 text-left flex items-center justify-between text-sm font-bold text-purple-400 hover:text-purple-300 group cursor-pointer w-full"
          >
            <span>Register as Tutor</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Card 3: Job Seekers */}
        <div className="glass-card glass-card-hover rounded-3xl p-6 flex flex-col justify-between shadow-md">
          <div className="flex flex-col gap-4">
            <div className="bg-pink-500/10 p-3 w-fit rounded-2xl text-pink-500">
              <Briefcase className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Staff & Center Jobs</h3>
            <p className="text-xs text-muted leading-relaxed">
              Explore job opportunities in local educational institutes, coaching centers, or academic coordinator roles. Upload your resume and check matching status.
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.setItem("ss_current_user", JSON.stringify({ uid: "new_js", role: "jobseeker", name: "Guest Job Seeker", phone: "9000110001" }));
              window.location.href = "/jobs";
            }}
            className="mt-6 text-left flex items-center justify-between text-sm font-bold text-pink-400 hover:text-pink-300 group cursor-pointer w-full"
          >
            <span>Browse Center Jobs</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </section>

      {/* 3. Core Lead Form & AI Chat Widget Grid */}
      <section id="post-requirement" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Parent Requirement Form (7 Cols) */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-6 md:p-8 shadow-lg">
          <div className="flex flex-col gap-2 mb-6">
            <h2 className="text-2xl font-bold">Quick Tutor Request Form</h2>
            <p className="text-xs text-muted">Fill out this requirement and it will instantly populate in the Admin Lead Database and CRM pipeline.</p>
          </div>

          {formSubmitted ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center animate-slide-up">
              <div className="bg-emerald-500/10 text-emerald-500 p-4 rounded-full">
                <Check className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold">Requirement Submitted!</h3>
              <p className="text-sm text-muted max-w-sm">
                Your request has been added to our active Leads Database. We are now running the AI Matching algorithm to find available tutors.
              </p>
              <button
                onClick={() => setFormSubmitted(false)}
                className="mt-4 px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} className="flex flex-col gap-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted uppercase">Student Name *</label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter student name"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted uppercase">Parent/Client Name</label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Enter parent name"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted uppercase">Contact Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted uppercase">Subject Required *</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Mathematics, Science, French"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted uppercase">Class / Grade</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-foreground"
                  >
                    <option>Primary (1-5)</option>
                    <option>Class 6</option>
                    <option>Class 7</option>
                    <option>Class 8</option>
                    <option>Class 9</option>
                    <option>Class 10</option>
                    <option>Class 11</option>
                    <option>Class 12</option>
                    <option>JEE / NEET Prep</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted uppercase">Academic Board</label>
                  <select
                    value={board}
                    onChange={(e) => setBoard(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-foreground"
                  >
                    <option>CBSE</option>
                    <option>ICSE / ISC</option>
                    <option>State Board</option>
                    <option>IB / IGCSE</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted uppercase">Monthly Budget (₹)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. 8000"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted uppercase">Preferred Location / Area *</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Dwarka, South Delhi"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted uppercase">Preferred Timings</label>
                  <input
                    type="text"
                    value={timings}
                    onChange={(e) => setTimings(e.target.value)}
                    placeholder="e.g. 4 PM - 6 PM Alternate Days"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-4 w-full py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
              >
                Submit Tuition Requirement
              </button>

            </form>
          )}
        </div>

        {/* Right Side: Gemini AI Advisor Widget (5 Cols) */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-6 flex flex-col h-[520px] shadow-lg border border-indigo-500/20">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="bg-indigo-500/10 p-2.5 rounded-2xl text-indigo-500">
              <Sparkles className="h-5 w-5 animate-pulse-glow" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">AI Academic Advisor</h3>
              <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Powered by Gemini 1.5 Flash</p>
            </div>
          </div>

          {/* Chat Messages */}
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

          {/* Chat Input */}
          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask rates, prep guidelines..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background/50 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/10 cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

      </section>

    </div>
  );
}
