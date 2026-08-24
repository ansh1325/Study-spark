// src/lib/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const getApiKey = () => {
  if (typeof window !== "undefined") {
    // Check local storage for a user-provided dev key
    const localKey = localStorage.getItem("ss_gemini_api_key");
    if (localKey) return localKey;
  }
  return process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
};

const initGemini = () => {
  const key = getApiKey();
  if (!key || key === "undefined") return null;
  try {
    return new GoogleGenerativeAI(key);
  } catch (e) {
    console.error("Gemini initialization failed:", e);
    return null;
  }
};

// ----------------------------------------------------
// AI SERVICE OPERATIONS
// ----------------------------------------------------
export const aiService = {
  isConfigured() {
    return !!getApiKey();
  },

  // 1. AI Tutor Matcher
  async matchTutors(lead, tutors) {
    const apiKey = getApiKey();
    const systemPrompt = `You are the Lead Matching AI for "Study Spark". 
Your task is to analyze a student/parent tuition lead and rank the available tutors based on compatibility.
Compatibility factors: Subjects taught, classes taught, budget (tutor fees vs parent budget), location/area preferences, and qualification.

Lead Details:
- Student Name: ${lead.studentName}
- Class/Grade: ${lead.class}
- Subject: ${lead.subject}
- Board: ${lead.board}
- Location: ${lead.location}
- Budget: ${lead.budget}
- Preferred Timings: ${lead.timings}

Tutors Available:
${JSON.stringify(tutors.map(t => ({
  uid: t.uid,
  name: t.name,
  qualification: t.qualification,
  experience: t.experience,
  subjects: t.subjects,
  classes: t.classes,
  preferredAreas: t.preferredAreas,
  fees: t.fees
})), null, 2)}

Provide your output in a JSON array format containing the top matches (maximum 3), ranked by compatibility. Each object must have:
- uid: tutor's unique id
- score: compatibility percentage (e.g., 92)
- matchReason: 2-3 sentences explaining why this tutor is a good fit.
- pitch: A personalized message the Admin can send to the parent explaining why this tutor is recommended for their child.

Output ONLY valid JSON array. Do not wrap in markdown or backticks.`;

    if (!apiKey) {
      // Return high-quality Mock data
      console.log("Gemini API key not found. Returning mock AI matches.");
      return mockMatchTutors(lead, tutors);
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(systemPrompt);
      const responseText = result.response.text().trim();
      
      // Clean up markdown block if model outputted it
      const cleanJson = responseText
        .replace(/^```json\s*/i, "")
        .replace(/```$/, "")
        .trim();
        
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error("Gemini Tutor Matching failed, falling back to mock:", e);
      return mockMatchTutors(lead, tutors);
    }
  },

  // 2. CRM Follow-up Copy Generator
  async generateCRMTemplate(lead, status, tutor = null) {
    const apiKey = getApiKey();
    const prompt = `You are a professional outreach writer for Study Spark, a premium home tutor service.
Create a customized outreach template (suitable for WhatsApp or SMS) for a lead at a specific CRM stage.
Keep it polite, professional, and clear. Use brackets like [Your Name] for places the admin needs to fill, but use the provided details directly in the message.

Lead Details:
- Parent/Student Name: ${lead.parentName || lead.studentName}
- Subject: ${lead.subject} (${lead.class})
- Current CRM Stage: ${status}
${tutor ? `- Assigned Tutor: ${tutor.name} (${tutor.qualification})` : ""}

Generate a WhatsApp/SMS outreach message copy optimized for high responses.
Output ONLY the message text. No subject lines, no markdown wrappers, no introductory comments.`;

    if (!apiKey) {
      return mockCRMTemplate(lead, status, tutor);
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (e) {
      console.error("Gemini CRM copy failed, falling back to mock:", e);
      return mockCRMTemplate(lead, status, tutor);
    }
  },

  // 3. Resume Screener for Job Seekers
  async screenResume(resumeText, jobTitle) {
    const apiKey = getApiKey();
    const prompt = `You are the HR Assistant AI for "Study Spark". 
You are screening a job application for the position of "${jobTitle}".
Analyze the applicant's resume content below and provide a structured review.

Resume Content:
${resumeText}

Provide your feedback in a JSON object format containing:
- suitabilityScore: Percentage score (e.g. 85)
- keyStrengths: Array of top 3 skills or qualifications matching the job.
- gapsIdentified: Array of potential shortcomings or improvements needed.
- optimizationTips: Array of actionable feedback to help the applicant improve their resume for this role.

Output ONLY valid JSON. No markdown wrappers.`;

    if (!apiKey) {
      return mockScreenResume(resumeText, jobTitle);
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      const cleanJson = responseText
        .replace(/^```json\s*/i, "")
        .replace(/```$/, "")
        .trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error("Gemini Resume Screen failed, falling back to mock:", e);
      return mockScreenResume(resumeText, jobTitle);
    }
  },

  // 4. AI Chat Assistant (Parent Advisor / Tutor Help)
  async chatAssistant(message, chatHistory = [], userRole = "parent") {
    const apiKey = getApiKey();
    const roleInstructions = {
      parent: "You are the Study Spark Parent Advisor. Help parents find the best home tutors, give recommendations on study budgets, teaching techniques, subject boards (CBSE, ICSE, IB), and study planning.",
      tutor: "You are the Study Spark Tutor Coach. Guide tutors on how to clear demo classes, structure their fees, communicate with parents, plan lessons, and expand their student base.",
      admin: "You are the Study Spark Dashboard Copilot. Help the admin analyze lead conversions, suggest CRM strategies, and resolve logistics issues."
    };

    const prompt = `System: ${roleInstructions[userRole] || roleInstructions.parent} Keep your response engaging, positive, helpful, and concise (under 150 words). Format with bullet points if helpful.

Chat History:
${JSON.stringify(chatHistory.slice(-4))}

User Message: "${message}"`;

    if (!apiKey) {
      return mockChatResponse(message, userRole);
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (e) {
      console.error("Gemini Chat failed, falling back to mock:", e);
      return mockChatResponse(message, userRole);
    }
  }
};

// ----------------------------------------------------
// INTELLIGENT MOCK AI FALLBACKS
// ----------------------------------------------------

function mockMatchTutors(lead, tutors) {
  // Simple heuristic algorithm to rank tutors for mock fallback
  const matches = tutors.map(tutor => {
    let score = 50; // base score
    
    // Subject Match
    const subjectMatch = tutor.subjects.some(s => s.toLowerCase().includes(lead.subject.toLowerCase()) || lead.subject.toLowerCase().includes(s.toLowerCase()));
    if (subjectMatch) score += 25;
    
    // Class/Grade Match
    const classMatch = tutor.classes.some(c => lead.class.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(lead.class.toLowerCase()));
    if (classMatch) score += 15;
    
    // Area Match
    const areaMatch = tutor.preferredAreas.some(area => lead.location.toLowerCase().includes(area.toLowerCase()));
    if (areaMatch) score += 10;
    
    return {
      uid: tutor.uid,
      score: Math.min(score + Math.floor(Math.random() * 5), 98), // Add subtle randomness, cap at 98
      tutorName: tutor.name,
      qualification: tutor.qualification,
      experience: tutor.experience,
    };
  });

  // Sort and format top 3
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(match => {
      const parentName = lead.parentName || "Parent";
      return {
        uid: match.uid,
        score: match.score,
        matchReason: `${match.tutorName} matches ${match.score > 80 ? 'exceptionally' : 'well'} with this requirement. They teach ${lead.subject} for ${lead.class} and have ${match.experience} of experience, holding credentials like ${match.qualification}.`,
        pitch: `Hi ${parentName}, I have shortlisted a stellar tutor, ${match.tutorName}, for ${lead.studentName}'s ${lead.subject} tuitions. They hold a ${match.qualification} with ${match.experience} of teaching experience, and are comfortable with the ${lead.timings} slots. Let me know if we can schedule a demo session for this week!`
      };
    });
}

function mockCRMTemplate(lead, status, tutor) {
  const name = lead.parentName || lead.studentName || "Parent";
  const sub = lead.subject;
  const grade = lead.class;

  switch (status) {
    case "new":
      return `Hello ${name}, thank you for registering with Study Spark! We have received your requirement for a ${sub} tutor for ${grade}. Our team is matching the best tutors in your area. We will contact you shortly with tutor options. - Team Study Spark`;
    
    case "contacted":
      return `Hello ${name}, this is Team Study Spark. We tried reaching out regarding your requirement for a ${sub} tutor for ${grade}. Please let us know a convenient time to call you and discuss budget and timings. Thank you!`;
    
    case "assigned":
      return `Hi ${name}! Great news! We have assigned ${tutor ? tutor.name : "[Tutor Name]"} (${tutor ? tutor.qualification : "[Qualification]"}) for ${grade} ${sub} tuitions. They have verified backgrounds. We'd like to arrange a call to connect you. - Study Spark`;
    
    case "demo_scheduled":
      return `Hello ${name}, this is a reminder that a free Demo Class for ${sub} has been scheduled for ${lead.studentName} with tutor ${tutor ? tutor.name : "[Tutor Name]"} on ${lead.demoDate || "[Date]"}. Please ensure the student is ready. Let us know if you need to reschedule. - Study Spark`;
    
    case "confirmed":
      return `Hi ${name}, we are glad you loved the demo class! To confirm regular classes for ${sub}, please finalize the registration by paying the token fee through the Study Spark portal. If already paid, classes can start immediately. - Study Spark`;
    
    case "payment_pending":
      return `Dear ${name}, this is a friendly reminder from Study Spark regarding the pending tuition fee payment. Please pay via the secure payment link or UPI to continue uninterrupted classes. Thank you!`;
    
    case "completed":
      return `Hello ${name}, the tutoring cycle for this month is completed! We hope ${lead.studentName} made great progress in ${sub}. Please submit your feedback and rating on our portal to help us maintain elite quality. - Study Spark`;
    
    case "cancelled":
      return `Hello ${name}, we are sorry to hear you cancelled the tutoring requirement. We hope to serve you in the future. Please feel free to register a new lead if your requirements change. - Study Spark`;
    
    default:
      return `Hi ${name}, this is regarding your ${sub} tutoring requirement. Please log in to the Study Spark portal to check updates. - Team Study Spark`;
  }
}

function mockScreenResume(resumeText, jobTitle) {
  return {
    suitabilityScore: 82,
    keyStrengths: [
      "Relevant academic qualifications matching educational roles",
      "Good communication skills demonstrated through background history",
      "Proficient in handling operations and scheduling logistics"
    ],
    gapsIdentified: [
      "Lacks hands-on experience in teaching specific school boards (CBSE/ICSE)",
      "Tech certifications are not explicitly detailed in the resume"
    ],
    optimizationTips: [
      "Add a 'Key Skills' grid highlighting specific teaching subjects and boards.",
      "Detail your accomplishments in previous coordinator roles rather than just listing tasks.",
      "Quantify results: E.g., 'Coordinated classes for 200+ students and improved tutor match speed by 30%'."
    ]
  };
}

function mockChatResponse(message, userRole) {
  const msg = message.toLowerCase();
  
  if (userRole === "tutor") {
    if (msg.includes("demo")) {
      return `💡 **Tips to Ace your Demo Class:**\n\n1. **Prepare thoroughly**: Read the syllabus of the student's board (CBSE/ICSE) beforehand.\n2. **Break the Ice**: Spend the first 5 minutes building rapport with the student and understanding their difficulty level.\n3. **Deliver a visual concept**: Don't just read from books; use a diagram, visual puzzle, or real-life application.\n4. **Get parent feedback**: Conclude the class by outlining a short study plan to the parent to demonstrate professionalism.`;
    }
    if (msg.includes("fee") || msg.includes("charge")) {
      return `💰 **Structuring your Fees:**\n\n- Primary Classes (1-5): ₹400 - ₹500/hr\n- Middle Classes (6-8): ₹500 - ₹700/hr\n- Secondary (9-10): ₹700 - ₹900/hr\n- Senior Secondary (11-12 & Prep): ₹1,000 - ₹1,500/hr\n\n*Pro-tip: If you travel long distances, include a minor travel allowance in your package quote.*`;
    }
    return `Hello! As your Study Spark Coach, I can help you with: \n\n• Responding to matched leads\n• Preparing for demo classes\n• Structuring tutoring packages\n• Retaining students for long term\n\nWhat would you like advice on?`;
  }
  
  if (userRole === "admin") {
    return `📊 **Dashboard Assistant Insights:**\n\n- Match speed is currently averaging 14 hours. You can speed this up by using the **AI Matcher** on new leads.\n- There are **3 pending payments** this week. Recommend triggering the *Payment Pending* WhatsApp reminder.\n- High demand detected for Class 10 Math in Dwarka. Consider onboarding 2 more math tutors for that area.`;
  }

  // Default Parent Advice
  if (msg.includes("math") || msg.includes("science")) {
    return `📈 **Finding the Right Tutor:**\n\nFor STEM subjects (Math/Science), we recommend tutors with a B.Tech or M.Sc background. \n\n• **Class 6-10**: Focus on building fundamental concepts. Budget ranges ₹6,000-₹8,000/mo.\n• **Class 11-12**: Look for tutors with experience in JEE/NEET patterns. Budget ranges ₹10,000-₹15,000/mo.\n\nWould you like me to suggest specific tutors in your region?`;
  }
  if (msg.includes("cost") || msg.includes("price") || msg.includes("budget") || msg.includes("fee")) {
    return `💸 **Average Monthly Tutoring Budgets (Delhi-NCR):**\n\n• **Primary Classes**: ₹4,000 - ₹6,000/mo (3 days/week)\n• **Middle School (6-8)**: ₹5,000 - ₹8,000/mo\n• **High School (9-10)**: ₹7,000 - ₹10,000/mo\n• **Senior Sec (11-12)**: ₹10,000 - ₹15,000/mo\n\n*Note: Fees vary based on teacher qualification (e.g. college students vs certified professors) and board prep intensity.*`;
  }

  return `Welcome to Study Spark! I am your AI Academic Advisor. I can help you:\n\n• Understand typical tutoring fees in Delhi-NCR\n• Recommend study strategies and boards (CBSE/ICSE/IB)\n• Guide you on setting realistic budgets for home tuition\n\nAsk me anything!`;
}
