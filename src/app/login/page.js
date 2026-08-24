// src/app/login/page.js
"use client";

import { useState, useEffect } from "react";
import { Sparkles, Phone, Lock, ArrowRight, ShieldCheck, CheckCircle2, MessageSquare, AlertCircle } from "lucide-react";
import { dbService } from "@/lib/firebase";

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [role, setRole] = useState("parent");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [showSmsBanner, setShowSmsBanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setErrorMessage("Please enter a valid 10-digit phone number.");
      return;
    }
    setErrorMessage("");
    setIsSubmitting(true);

    // Simulate OTP generation
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setOtpSent(true);
      setShowSmsBanner(true);
      setIsSubmitting(false);
    }, 1000);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpCode !== generatedOtp) {
      setErrorMessage("Incorrect OTP code. Please look at the SMS notification banner.");
      return;
    }
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      // Trigger login database sync
      await dbService.login(phoneNumber, role);
      
      // Redirect based on role
      setTimeout(() => {
        if (role === "admin") window.location.href = "/admin";
        else if (role === "parent") window.location.href = "/parent";
        else if (role === "tutor") window.location.href = "/tutor";
        else if (role === "jobseeker") window.location.href = "/jobs";
      }, 800);

    } catch (error) {
      console.error(error);
      setErrorMessage("Login failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-10 animate-fade-in relative">
      
      {/* MOCK SMS BANNER (Gives amazing wow factor for OTP Testing) */}
      {showSmsBanner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
          <div className="bg-slate-900 border border-indigo-500 text-white p-4 rounded-2xl shadow-2xl flex gap-3 items-center animate-slide-up">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">Study Spark SMS Gateway</p>
              <p className="text-xs font-semibold">Your verification OTP code is: <span className="text-sm font-bold text-indigo-300 tracking-widest">{generatedOtp}</span></p>
            </div>
            <button 
              onClick={() => setShowSmsBanner(false)}
              className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md font-bold transition-all"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Login Card */}
      <div className="w-full max-w-md glass-card rounded-3xl p-8 shadow-xl flex flex-col gap-6 relative overflow-hidden border border-indigo-500/10">
        
        {/* Glow Element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Heading */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold mt-2">Secure OTP Login</h2>
          <p className="text-xs text-muted">Enter your details to generate a secure authentication code.</p>
        </div>

        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-xl flex gap-2 items-center">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {!otpSent ? (
          /* Phone Form */
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Select Dashboard Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background/50 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-foreground"
              >
                <option value="parent">👨‍👩‍👧 Parent / Client</option>
                <option value="tutor">🎓 Teacher / Tutor</option>
                <option value="jobseeker">💼 Center Job Seeker</option>
                <option value="admin">🔑 System Admin</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Enter Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background/50 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              <span>{isSubmitting ? "Generating OTP..." : "Request Verification Code"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

          </form>
        ) : (
          /* OTP Verification Form */
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            
            <div className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-xs p-3.5 rounded-xl flex gap-2 items-center">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-500" />
              <span>We've generated an OTP code for <span className="font-bold">{phoneNumber}</span>. See the simulator banner above.</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Enter 6-Digit OTP</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter verification code"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background/50 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm tracking-widest text-center font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              <span>{isSubmitting ? "Authenticating Session..." : "Verify & Sign In"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtpCode("");
              }}
              className="text-xs text-muted hover:text-foreground text-center font-semibold cursor-pointer transition-colors"
            >
              Go Back & Change Details
            </button>

          </form>
        )}

      </div>
    </div>
  );
}
