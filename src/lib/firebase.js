// src/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, collection, query, getDocs, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { getAuth, signInWithCustomToken, signOut as firebaseSignOut } from "firebase/auth";

// Firebase Config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase variables are set
const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey !== "undefined";

let app;
let firestore;
let auth;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    firestore = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase initialization failed, falling back to LocalStorage:", error);
  }
}

// ----------------------------------------------------
// DEFAULT INITIAL DATA FOR LOCALSTORAGE DEMO MODE
// ----------------------------------------------------
const INITIAL_TUTORS = [
  {
    uid: "tutor_1",
    name: "Dr. Ananya Iyer",
    phone: "9876543210",
    email: "ananya.iyer@gmail.com",
    qualification: "Ph.D. in Physics, IISc Bangalore",
    experience: "8 Years",
    subjects: ["Physics", "Chemistry"],
    classes: ["Class 11", "Class 12", "JEE Prep"],
    preferredAreas: ["Vasant Kunj", "Saket", "Green Park"],
    fees: "1200/hr",
    status: "verified",
    photoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    createdAt: new Date().toISOString()
  },
  {
    uid: "tutor_2",
    name: "Rajesh Malhotra",
    phone: "9876543211",
    email: "rajesh.maths@yahoo.com",
    qualification: "B.Tech, IIT Roorkee",
    experience: "5 Years",
    subjects: ["Mathematics", "Statistics"],
    classes: ["Class 9", "Class 10", "Class 11", "Class 12"],
    preferredAreas: ["Dwarka", "Janakpuri", "Rohini"],
    fees: "800/hr",
    status: "verified",
    photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    createdAt: new Date().toISOString()
  },
  {
    uid: "tutor_3",
    name: "Sarah Fernandes",
    phone: "9876543212",
    email: "sarah.f@outlook.com",
    qualification: "M.A. in English Literature, DU",
    experience: "4 Years",
    subjects: ["English", "Social Studies"],
    classes: ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"],
    preferredAreas: ["GK-2", "Def Col", "Lajpat Nagar"],
    fees: "600/hr",
    status: "pending",
    photoURL: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    createdAt: new Date().toISOString()
  }
];

const INITIAL_LEADS = [
  {
    id: "lead_101",
    studentName: "Aditya Verma",
    parentName: "Sanjay Verma",
    phone: "9911223344",
    class: "Class 12",
    subject: "Physics",
    board: "CBSE",
    location: "Vasant Kunj, Delhi",
    budget: "10000/month",
    timings: "5 PM - 7 PM (Alternate Days)",
    status: "new",
    assignedTutorId: "",
    demoDate: "",
    feedback: "",
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString() // 2 hours ago
  },
  {
    id: "lead_102",
    studentName: "Meera Sen",
    parentName: "Priya Sen",
    phone: "9911223345",
    class: "Class 10",
    subject: "Mathematics",
    board: "ICSE",
    location: "Dwarka Sector 12, Delhi",
    budget: "8000/month",
    timings: "4 PM - 5:30 PM (Mon, Wed, Fri)",
    status: "assigned",
    assignedTutorId: "tutor_2",
    demoDate: "",
    feedback: "",
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString() // 1 day ago
  },
  {
    id: "lead_103",
    studentName: "Kabir Goel",
    parentName: "Amit Goel",
    phone: "9911223346",
    class: "Class 11",
    subject: "Chemistry",
    board: "CBSE",
    location: "Saket, Delhi",
    budget: "12000/month",
    timings: "6 PM - 8 PM (Weekends)",
    status: "demo_scheduled",
    assignedTutorId: "tutor_1",
    demoDate: new Date(Date.now() + 48 * 3600000).toISOString().split('T')[0], // 2 days from now
    feedback: "Awaiting demo response",
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString() // 2 days ago
  },
  {
    id: "lead_104",
    studentName: "Rohan Das",
    parentName: "Siddharth Das",
    phone: "9911223347",
    class: "Class 8",
    subject: "Science & English",
    board: "CBSE",
    location: "Lajpat Nagar, Delhi",
    budget: "6000/month",
    timings: "3 PM - 4:30 PM (Daily)",
    status: "confirmed",
    assignedTutorId: "tutor_3",
    demoDate: new Date(Date.now() - 24 * 3600000).toISOString().split('T')[0],
    feedback: "Demo went excellent. Parent confirmed.",
    createdAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString()
  }
];

const INITIAL_JOBSEEKERS = [
  {
    uid: "js_1",
    name: "Vikram Rathore",
    phone: "9000110022",
    email: "vikram.jobs@gmail.com",
    qualification: "MBA in Operations, DU",
    experience: "2 Years",
    resumeURL: "https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf",
    appliedJobs: ["Center Coordinator", "Academic Consultant"],
    status: "interviewing",
    createdAt: new Date().toISOString()
  },
  {
    uid: "js_2",
    name: "Neha Gupta",
    phone: "9000110023",
    email: "neha.gupta@outlook.com",
    qualification: "B.Ed, IP University",
    experience: "3 Years",
    resumeURL: "https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf",
    appliedJobs: ["Academic Counselor"],
    status: "applied",
    createdAt: new Date().toISOString()
  }
];

const INITIAL_PAYMENTS = [
  {
    id: "pay_201",
    leadId: "lead_104",
    payerId: "parent_das",
    payerName: "Siddharth Das",
    amount: 1500,
    status: "success",
    type: "registration",
    transactionId: "TXN9832749832",
    createdAt: new Date(Date.now() - 4 * 24 * 3600000).toISOString()
  },
  {
    id: "pay_202",
    leadId: "lead_103",
    payerId: "parent_goel",
    payerName: "Amit Goel",
    amount: 2000,
    status: "pending",
    type: "registration",
    transactionId: "TXN-PENDING-9821",
    createdAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString()
  }
];

const INITIAL_REMINDERS = [
  {
    id: "rem_1",
    title: "Call Amit Goel for Registration Fee payment",
    type: "payment",
    date: new Date(Date.now() + 4 * 3600000).toISOString(), // in 4 hours
    leadId: "lead_103",
    status: "pending"
  },
  {
    id: "rem_2",
    title: "Demo Class: Aditya Verma with Rajesh Malhotra",
    type: "demo",
    date: new Date(Date.now() + 26 * 3600000).toISOString(), // tomorrow
    leadId: "lead_102",
    status: "pending"
  }
];

// Helper to initialize local storage
const initLocalStorage = () => {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem("ss_tutors")) {
    localStorage.setItem("ss_tutors", JSON.stringify(INITIAL_TUTORS));
  }
  if (!localStorage.getItem("ss_leads")) {
    localStorage.setItem("ss_leads", JSON.stringify(INITIAL_LEADS));
  }
  if (!localStorage.getItem("ss_jobseekers")) {
    localStorage.setItem("ss_jobseekers", JSON.stringify(INITIAL_JOBSEEKERS));
  }
  if (!localStorage.getItem("ss_payments")) {
    localStorage.setItem("ss_payments", JSON.stringify(INITIAL_PAYMENTS));
  }
  if (!localStorage.getItem("ss_reminders")) {
    localStorage.setItem("ss_reminders", JSON.stringify(INITIAL_REMINDERS));
  }
};

// Call initialization
if (typeof window !== "undefined") {
  initLocalStorage();
}

// ----------------------------------------------------
// UNIFIED DATABASE & AUTH SERVICE
// ----------------------------------------------------
export const dbService = {
  // Check Mode
  isLiveFirebase() {
    return !!firestore;
  },

  // Auth Operations
  async login(phone, role = "parent") {
    // Generate a simulated user session
    const mockUser = {
      uid: `user_${phone}`,
      phone,
      role,
      name: role === "admin" ? "Study Spark Admin" : role === "tutor" ? "Tutor Profile" : role === "jobseeker" ? "Job Seeker" : "Valued Parent",
      email: `${role}_${phone.slice(-4)}@studyspark.com`
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("ss_current_user", JSON.stringify(mockUser));
      
      // Also register this user in our users list if not exists
      const users = JSON.parse(localStorage.getItem("ss_users") || "[]");
      if (!users.some(u => u.phone === phone)) {
        users.push({ ...mockUser, createdAt: new Date().toISOString() });
        localStorage.setItem("ss_users", JSON.stringify(users));
      }
    }

    if (isFirebaseConfigured && firestore) {
      const userDocRef = doc(firestore, "users", mockUser.uid);
      setDoc(userDocRef, mockUser, { merge: true }).catch(e => {
        console.error("Firebase Auth Sync Failed:", e);
      });
    }

    return mockUser;
  },

  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("ss_current_user");
    }
  },

  getCurrentUser() {
    if (typeof window !== "undefined") {
      const u = localStorage.getItem("ss_current_user");
      return u ? JSON.parse(u) : null;
    }
    return null;
  },

  // LEADS Operations
  async getLeads() {
    if (isFirebaseConfigured && firestore) {
      try {
        const q = query(collection(firestore, "leads"));
        const snapshot = await getDocs(q);
        const leads = [];
        snapshot.forEach(doc => leads.push({ id: doc.id, ...doc.data() }));
        return leads;
      } catch (e) {
        console.error("Firestore leads read failed, falling back:", e);
      }
    }
    // Fallback
    return JSON.parse(localStorage.getItem("ss_leads") || "[]");
  },

  async addLead(leadData) {
    const newLead = {
      id: `lead_${Date.now()}`,
      status: "new",
      assignedTutorId: "",
      demoDate: "",
      feedback: "",
      createdAt: new Date().toISOString(),
      ...leadData
    };

    if (isFirebaseConfigured && firestore) {
      setDoc(doc(firestore, "leads", newLead.id), newLead).catch(e => {
        console.error("Firestore lead add failed:", e);
      });
    }

    // Always keep LocalStorage updated for reliable fallback
    const leads = JSON.parse(localStorage.getItem("ss_leads") || "[]");
    leads.unshift(newLead);
    localStorage.setItem("ss_leads", JSON.stringify(leads));
    return newLead;
  },

  async updateLead(leadId, updatedFields) {
    if (isFirebaseConfigured && firestore) {
      updateDoc(doc(firestore, "leads", leadId), updatedFields).catch(e => {
        console.error("Firestore lead update failed:", e);
      });
    }

    const leads = JSON.parse(localStorage.getItem("ss_leads") || "[]");
    const index = leads.findIndex(l => l.id === leadId);
    if (index !== -1) {
      leads[index] = { ...leads[index], ...updatedFields };
      localStorage.setItem("ss_leads", JSON.stringify(leads));
    }
    return leads[index];
  },

  // TUTORS Operations
  async getTutors() {
    if (isFirebaseConfigured && firestore) {
      try {
        const q = query(collection(firestore, "tutors"));
        const snapshot = await getDocs(q);
        const tutors = [];
        snapshot.forEach(doc => tutors.push({ uid: doc.id, ...doc.data() }));
        return tutors;
      } catch (e) {
        console.error("Firestore tutors read failed, falling back:", e);
      }
    }
    return JSON.parse(localStorage.getItem("ss_tutors") || "[]");
  },

  async addTutor(tutorData) {
    const newTutor = {
      uid: tutorData.uid || `tutor_${Date.now()}`,
      status: "pending",
      photoURL: tutorData.photoURL || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?w=150`,
      createdAt: new Date().toISOString(),
      ...tutorData
    };

    if (isFirebaseConfigured && firestore) {
      setDoc(doc(firestore, "tutors", newTutor.uid), newTutor).catch(e => {
        console.error("Firestore tutor add failed:", e);
      });
    }

    const tutors = JSON.parse(localStorage.getItem("ss_tutors") || "[]");
    tutors.unshift(newTutor);
    localStorage.setItem("ss_tutors", JSON.stringify(tutors));
    return newTutor;
  },

  async updateTutor(tutorUid, updatedFields) {
    if (isFirebaseConfigured && firestore) {
      updateDoc(doc(firestore, "tutors", tutorUid), updatedFields).catch(e => {
        console.error("Firestore tutor update failed:", e);
      });
    }

    const tutors = JSON.parse(localStorage.getItem("ss_tutors") || "[]");
    const index = tutors.findIndex(t => t.uid === tutorUid);
    if (index !== -1) {
      tutors[index] = { ...tutors[index], ...updatedFields };
      localStorage.setItem("ss_tutors", JSON.stringify(tutors));
    }
    return tutors[index];
  },

  // JOB SEEKERS Operations
  async getJobSeekers() {
    if (isFirebaseConfigured && firestore) {
      try {
        const q = query(collection(firestore, "jobseekers"));
        const snapshot = await getDocs(q);
        const seekers = [];
        snapshot.forEach(doc => seekers.push({ uid: doc.id, ...doc.data() }));
        return seekers;
      } catch (e) {
        console.error("Firestore jobseekers read failed, falling back:", e);
      }
    }
    return JSON.parse(localStorage.getItem("ss_jobseekers") || "[]");
  },

  async addJobSeeker(seekerData) {
    const newSeeker = {
      uid: seekerData.uid || `js_${Date.now()}`,
      status: "applied",
      createdAt: new Date().toISOString(),
      ...seekerData
    };

    if (isFirebaseConfigured && firestore) {
      setDoc(doc(firestore, "jobseekers", newSeeker.uid), newSeeker).catch(e => {
        console.error("Firestore jobseeker add failed:", e);
      });
    }

    const seekers = JSON.parse(localStorage.getItem("ss_jobseekers") || "[]");
    seekers.unshift(newSeeker);
    localStorage.setItem("ss_jobseekers", JSON.stringify(seekers));
    return newSeeker;
  },

  async updateJobSeeker(seekerUid, updatedFields) {
    if (isFirebaseConfigured && firestore) {
      updateDoc(doc(firestore, "jobseekers", seekerUid), updatedFields).catch(e => {
        console.error("Firestore jobseeker update failed:", e);
      });
    }

    const seekers = JSON.parse(localStorage.getItem("ss_jobseekers") || "[]");
    const index = seekers.findIndex(s => s.uid === seekerUid);
    if (index !== -1) {
      seekers[index] = { ...seekers[index], ...updatedFields };
      localStorage.setItem("ss_jobseekers", JSON.stringify(seekers));
    }
    return seekers[index];
  },

  // PAYMENTS Operations
  async getPayments() {
    if (isFirebaseConfigured && firestore) {
      try {
        const q = query(collection(firestore, "payments"));
        const snapshot = await getDocs(q);
        const payments = [];
        snapshot.forEach(doc => payments.push({ id: doc.id, ...doc.data() }));
        return payments;
      } catch (e) {
        console.error("Firestore payments read failed, falling back:", e);
      }
    }
    return JSON.parse(localStorage.getItem("ss_payments") || "[]");
  },

  async addPayment(paymentData) {
    const newPayment = {
      id: `pay_${Date.now()}`,
      status: "success",
      transactionId: `TXN${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      createdAt: new Date().toISOString(),
      ...paymentData
    };

    if (isFirebaseConfigured && firestore) {
      setDoc(doc(firestore, "payments", newPayment.id), newPayment).catch(e => {
        console.error("Firestore payment add failed:", e);
      });
    }

    const payments = JSON.parse(localStorage.getItem("ss_payments") || "[]");
    payments.unshift(newPayment);
    localStorage.setItem("ss_payments", JSON.stringify(payments));
    return newPayment;
  },

  // REMINDERS Operations
  async getReminders() {
    if (isFirebaseConfigured && firestore) {
      try {
        const q = query(collection(firestore, "reminders"));
        const snapshot = await getDocs(q);
        const reminders = [];
        snapshot.forEach(doc => reminders.push({ id: doc.id, ...doc.data() }));
        return reminders;
      } catch (e) {
        console.error("Firestore reminders read failed, falling back:", e);
      }
    }
    return JSON.parse(localStorage.getItem("ss_reminders") || "[]");
  },

  async addReminder(reminderData) {
    const newReminder = {
      id: `rem_${Date.now()}`,
      status: "pending",
      ...reminderData
    };

    if (isFirebaseConfigured && firestore) {
      setDoc(doc(firestore, "reminders", newReminder.id), newReminder).catch(e => {
        console.error("Firestore reminder add failed:", e);
      });
    }

    const reminders = JSON.parse(localStorage.getItem("ss_reminders") || "[]");
    reminders.unshift(newReminder);
    localStorage.setItem("ss_reminders", JSON.stringify(reminders));
    return newReminder;
  },

  async updateReminder(id, updatedFields) {
    if (isFirebaseConfigured && firestore) {
      updateDoc(doc(firestore, "reminders", id), updatedFields).catch(e => {
        console.error("Firestore reminder update failed:", e);
      });
    }

    const reminders = JSON.parse(localStorage.getItem("ss_reminders") || "[]");
    const index = reminders.findIndex(r => r.id === id);
    if (index !== -1) {
      reminders[index] = { ...reminders[index], ...updatedFields };
      localStorage.setItem("ss_reminders", JSON.stringify(reminders));
    }
    return reminders[index];
  }
};
