// src/app/layout.js
"use client";

import { useEffect, useState } from "react";
import { Sparkles, Sun, Moon, RefreshCw, UserCheck } from "lucide-react";
import "./globals.css";

export default function RootLayout({ children }) {
  const [theme, setTheme] = useState("dark");
  const [currentUser, setCurrentUser] = useState(null);
  const [isOpenRoleMenu, setIsOpenRoleMenu] = useState(false);

  useEffect(() => {
    // Load default theme
    const localTheme = localStorage.getItem("ss_theme") || "dark";
    setTheme(localTheme);
    document.documentElement.className = localTheme === "dark" ? "dark-theme" : "";

    // Load user
    const user = localStorage.getItem("ss_current_user");
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("ss_theme", nextTheme);
    document.documentElement.className = nextTheme === "dark" ? "dark-theme" : "";
  };

  const switchRole = (role) => {
    const rolesConfig = {
      admin: { uid: "admin_test", phone: "9999999999", role: "admin", name: "Spark Admin", email: "admin@studyspark.com" },
      parent: { uid: "parent_test", phone: "9876500001", role: "parent", name: "Sanjay Verma", email: "sanjay.v@studyspark.com" },
      tutor: { uid: "tutor_1", phone: "9876543210", role: "tutor", name: "Dr. Ananya Iyer", email: "ananya.iyer@gmail.com" },
      jobseeker: { uid: "js_1", phone: "9000110022", role: "jobseeker", name: "Vikram Rathore", email: "vikram.jobs@gmail.com" }
    };

    const selectedUser = rolesConfig[role];
    localStorage.setItem("ss_current_user", JSON.stringify(selectedUser));
    setCurrentUser(selectedUser);
    setIsOpenRoleMenu(false);
    
    // Redirect depending on role
    if (role === "admin") window.location.href = "/admin";
    else if (role === "parent") window.location.href = "/parent";
    else if (role === "tutor") window.location.href = "/tutor";
    else if (role === "jobseeker") window.location.href = "/jobs";
  };

  const handleLogout = () => {
    localStorage.removeItem("ss_current_user");
    setCurrentUser(null);
    window.location.href = "/";
  };

  return (
    <html lang="en" className={theme === "dark" ? "dark-theme" : ""}>
      <head>
        <title>Study Spark - Tutor Lead CRM & AI Matching Portal</title>
        <meta name="description" content="Premium Home Tutor search, CRM pipeline management, and AI teacher matching platform." />
      </head>
      <body className="min-h-screen flex flex-col grid-bg transition-colors duration-300">
        {/* Floating Top Nav */}
        <header className="sticky top-0 z-50 w-full px-4 py-3 md:px-8">
          <div className="mx-auto max-w-7xl glass-card rounded-2xl px-4 py-2 flex items-center justify-between shadow-md">
            
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 group">
              <div className="bg-indigo-600 p-2 rounded-xl text-white group-hover:scale-110 transition-all duration-300 shadow-indigo-500/30 shadow-lg">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent tracking-wide">
                Study Spark
              </span>
            </a>

            {/* Quick Actions (Right side) */}
            <div className="flex items-center gap-3">
              
              {/* Role Switcher Selector for Client Testing */}
              <div className="relative">
                <button
                  onClick={() => setIsOpenRoleMenu(!isOpenRoleMenu)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 transition-all cursor-pointer"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Test Roles</span>
                </button>
                {isOpenRoleMenu && (
                  <div className="absolute right-0 mt-2 w-48 glass-card border border-indigo-500/30 rounded-2xl shadow-xl py-2 animate-slide-up">
                    <p className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-indigo-400">Switch Session To:</p>
                    <button onClick={() => switchRole("admin")} className="w-full text-left px-4 py-2 text-sm hover:bg-indigo-600/20 text-foreground transition-colors cursor-pointer">🔑 Admin Portal</button>
                    <button onClick={() => switchRole("parent")} className="w-full text-left px-4 py-2 text-sm hover:bg-indigo-600/20 text-foreground transition-colors cursor-pointer">👨‍👩‍👧 Parent Dashboard</button>
                    <button onClick={() => switchRole("tutor")} className="w-full text-left px-4 py-2 text-sm hover:bg-indigo-600/20 text-foreground transition-colors cursor-pointer">🎓 Tutor Portal</button>
                    <button onClick={() => switchRole("jobseeker")} className="w-full text-left px-4 py-2 text-sm hover:bg-indigo-600/20 text-foreground transition-colors cursor-pointer">💼 Job Seeker Board</button>
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl hover:bg-foreground/10 text-foreground/80 hover:text-foreground cursor-pointer transition-colors"
                title="Toggle Theme"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* Session Profile / Login */}
              {currentUser ? (
                <div className="flex items-center gap-3 pl-2 border-l border-foreground/10">
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-xs font-bold leading-tight">{currentUser.name}</span>
                    <span className="text-[10px] text-indigo-400 font-medium capitalize">{currentUser.role}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-400 cursor-pointer transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <a
                  href="/login"
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all"
                >
                  Login / OTP
                </a>
              )}
            </div>

          </div>
        </header>

        {/* Core Main Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-4">
          {children}
        </main>

        {/* Footer */}
        <footer className="w-full py-6 mt-12 border-t border-indigo-500/10 bg-background/50 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <span className="text-xs font-semibold text-muted">© 2026 Study Spark. Empowering Home Tutors & Students.</span>
            </div>
            <div className="flex gap-4 text-xs font-semibold text-indigo-400">
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Terms of Service</a>
              <a href="#" className="hover:underline">Contact Support</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
