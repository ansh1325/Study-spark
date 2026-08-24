// src/app/parent/page.js
"use client";

import { useState, useEffect } from "react";
import { 
  BookOpen, Clock, CheckCircle2, AlertCircle, DollarSign, 
  Star, Send, Smartphone, CreditCard, ChevronRight, Check, RefreshCw 
} from "lucide-react";
import { dbService } from "@/lib/firebase";

export default function ParentDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [myLeads, setMyLeads] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [payments, setPayments] = useState([]);
  
  // Payment states
  const [payingLead, setPayingLead] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("upi"); // upi or card
  const [upiId, setUpiId] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Review states
  const [reviewLead, setReviewLead] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const loadData = async (user) => {
    const leads = await dbService.getLeads();
    const tutorsList = await dbService.getTutors();
    const payHistory = await dbService.getPayments();
    
    // Filter by parent phone (our simulated login credential)
    const phone = user?.phone || "9876500001";
    setMyLeads(leads.filter(l => l.phone === phone));
    setTutors(tutorsList);
    setPayments(payHistory.filter(p => p.payerName.includes(user?.name || "Verma")));
  };

  useEffect(() => {
    const user = dbService.getCurrentUser();
    // Default fallback parent if not logged in
    if (!user) {
      const mockParent = {
        uid: "parent_test",
        phone: "9876500001",
        role: "parent",
        name: "Sanjay Verma",
        email: "sanjay.v@studyspark.com"
      };
      localStorage.setItem("ss_current_user", JSON.stringify(mockParent));
      setCurrentUser(mockParent);
      loadData(mockParent);
    } else {
      setCurrentUser(user);
      loadData(user);
    }
  }, []);

  const handleMockPayment = async (e) => {
    e.preventDefault();
    if (paymentMethod === "upi" && !upiId.includes("@")) {
      alert("Please enter a valid UPI ID (e.g. name@okhdfcbank)");
      return;
    }
    setIsProcessingPayment(true);

    setTimeout(async () => {
      // Record transaction
      await dbService.addPayment({
        leadId: payingLead.id,
        payerId: currentUser.uid,
        payerName: currentUser.name,
        amount: 1500, // Fixed registration token fee
        status: "success",
        type: "registration",
      });

      // Update lead stage to confirmed
      const updated = await dbService.updateLead(payingLead.id, { status: "confirmed" });
      
      // Update local state
      setMyLeads(myLeads.map(l => l.id === payingLead.id ? updated : l));
      const payHistory = await dbService.getPayments();
      setPayments(payHistory.filter(p => p.payerName.includes(currentUser.name)));
      
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      
      setTimeout(() => {
        setPayingLead(null);
        setPaymentSuccess(false);
      }, 1500);
    }, 1500);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment) return;

    // Simulate saving review/feedback
    const tutorId = payingLead?.assignedTutorId || reviewLead?.assignedTutorId;
    if (tutorId) {
      const tutorObj = tutors.find(t => t.uid === tutorId);
      console.log(`Submitted review for tutor ${tutorObj?.name}: ${rating} stars - ${comment}`);
    }

    setReviewSubmitted(true);
    setTimeout(() => {
      setReviewLead(null);
      setComment("");
      setRating(5);
      setReviewSubmitted(false);
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in py-4">
      
      {/* Left Area: Leads Tracker & Feedback (8 Cols) */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        
        <div className="glass-card rounded-3xl p-6 md:p-8 shadow-md">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold">Track Tuition Requests</h2>
              <p className="text-xs text-muted">Real-time status of your home tutor requirements.</p>
            </div>
            <button
              onClick={() => loadData(currentUser)}
              className="p-2 rounded-xl border border-indigo-500/20 text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10 cursor-pointer transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {myLeads.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted">
                <p className="font-bold">No active requests found.</p>
                <p className="mt-1">Go to the Home page to submit your first tutoring requirement.</p>
              </div>
            ) : (
              myLeads.map(lead => {
                const assignedTutor = tutors.find(t => t.uid === lead.assignedTutorId);
                return (
                  <div key={lead.id} className="border border-border/50 rounded-2xl p-5 flex flex-col md:flex-row justify-between gap-4 bg-foreground/3 shadow-xs">
                    <div className="flex flex-col gap-3">
                      
                      {/* Class/Subject header */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold px-2.5 py-1 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/10">
                          {lead.class}
                        </span>
                        <h4 className="font-extrabold text-sm">{lead.subject} tutor for {lead.studentName}</h4>
                      </div>

                      {/* Info lines */}
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-muted">
                        <p><strong>Board:</strong> {lead.board}</p>
                        <p><strong>Budget:</strong> {lead.budget}</p>
                        <p className="col-span-2"><strong>Location:</strong> {lead.location}</p>
                      </div>

                      {/* Assigned tutor info */}
                      {assignedTutor && (
                        <div className="mt-2 bg-indigo-600/5 border border-indigo-500/20 rounded-xl p-3 flex items-center gap-3 w-fit">
                          <img 
                            src={assignedTutor.photoURL} 
                            alt={assignedTutor.name}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                          <div className="text-[10px]">
                            <p className="font-bold text-foreground">Teacher Assigned: {assignedTutor.name}</p>
                            <p className="text-muted">{assignedTutor.qualification}</p>
                          </div>
                        </div>
                      )}

                    </div>

                    <div className="flex flex-col justify-between items-end gap-3 min-w-[120px]">
                      
                      {/* Lead Status Tag */}
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase ${
                        lead.status === "new" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                        lead.status === "assigned" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                        lead.status === "demo_scheduled" ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse" :
                        lead.status === "confirmed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        lead.status === "payment_pending" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-slate-500/10 text-slate-400"
                      }`}>
                        {lead.status === "demo_scheduled" ? "Demo Scheduled" : lead.status === "payment_pending" ? "Payment Pending" : lead.status}
                      </span>

                      {/* Lead Status Action Trigger Buttons */}
                      <div className="flex flex-wrap gap-2 justify-end">
                        {lead.status === "payment_pending" && (
                          <button
                            onClick={() => setPayingLead(lead)}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] rounded-xl shadow-md transition-all cursor-pointer"
                          >
                            Pay Registration Fee (₹1500)
                          </button>
                        )}
                        {assignedTutor && (lead.status === "confirmed" || lead.status === "completed") && (
                          <button
                            onClick={() => setReviewLead(lead)}
                            className="px-3 py-1.5 border border-indigo-500/20 text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10 font-bold text-[10px] rounded-xl transition-all cursor-pointer"
                          >
                            Rate Tutor
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Right Area: Payments Ledger & Active Dialogs (4 Cols) */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        
        {/* Payment Portal Dialog Box Overlay (Interactive) */}
        {payingLead && (
          <div className="glass-card rounded-2xl p-6 border border-rose-500/30 shadow-xl animate-slide-up flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-base text-rose-400">Payment Gateway</h3>
                <p className="text-[10px] text-muted">Study Spark Secure Registration Fee Gateway</p>
              </div>
              <button onClick={() => setPayingLead(null)} className="p-1 rounded-md hover:bg-foreground/10 text-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            {paymentSuccess ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center animate-scale-up">
                <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-full border border-emerald-500/20">
                  <Check className="h-8 w-8" />
                </div>
                <h4 className="font-bold text-sm">Payment Successful!</h4>
                <p className="text-[10px] text-muted">Your classes have been activated and logged in ledger.</p>
              </div>
            ) : (
              <form onSubmit={handleMockPayment} className="flex flex-col gap-4">
                <div className="bg-foreground/5 p-3 rounded-xl text-xs flex flex-col gap-1 text-muted border border-border/50">
                  <p className="flex justify-between"><span>Particulars:</span> <strong>Tutor Registration Fee</strong></p>
                  <p className="flex justify-between"><span>Subject:</span> <strong>{payingLead.subject}</strong></p>
                  <p className="flex justify-between"><span>Payable Amount:</span> <strong className="text-rose-400 text-sm">₹1,500.00</strong></p>
                </div>

                {/* Method selector */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi")}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      paymentMethod === "upi" ? "bg-indigo-600/10 border-indigo-500 text-indigo-400" : "border-border text-muted"
                    }`}
                  >
                    UPI / Scan QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      paymentMethod === "card" ? "bg-indigo-600/10 border-indigo-500 text-indigo-400" : "border-border text-muted"
                    }`}
                  >
                    Debit / Credit Card
                  </button>
                </div>

                {paymentMethod === "upi" ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-muted uppercase">Enter UPI ID</label>
                    <input
                      type="text"
                      required
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. rahul@ybl"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 focus:outline-hidden text-xs"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-muted uppercase">Enter Card Details</label>
                    <input
                      type="text"
                      required
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      maxLength={19}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 focus:outline-hidden text-xs"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {isProcessingPayment ? "Processing Transaction..." : "Authorize Mock Payment (₹1500)"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Feedback / Review Dialog Box */}
        {reviewLead && (
          <div className="glass-card rounded-2xl p-6 border border-indigo-500/20 shadow-xl animate-slide-up flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-base">Rate Tutoring Experience</h3>
                <p className="text-[10px] text-muted">Feedback helps us maintain high quality standards.</p>
              </div>
              <button onClick={() => setReviewLead(null)} className="p-1 rounded-md hover:bg-foreground/10 text-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            {reviewSubmitted ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center animate-scale-up">
                <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-full">
                  <Check className="h-8 w-8" />
                </div>
                <h4 className="font-bold text-sm">Feedback Logged!</h4>
                <p className="text-[10px] text-muted">Thank you for rating your assigned tutor.</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5 items-center">
                  <label className="text-[10px] font-bold text-muted uppercase">Star Rating</label>
                  <div className="flex gap-2.5 mt-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="cursor-pointer transition-transform hover:scale-125"
                      >
                        <Star className={`h-6 w-6 ${star <= rating ? "fill-amber-500 text-amber-500" : "text-muted"}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase">Comment / Review Details</label>
                  <textarea
                    required
                    rows="3"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us about the tutor's punctuality, knowledge, and explanation style..."
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 focus:outline-hidden text-xs resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Submit Tutor Rating
                </button>
              </form>
            )}
          </div>
        )}

        {/* Payments History log */}
        <div className="glass-card rounded-2xl p-6 shadow-md flex flex-col gap-4">
          <h3 className="font-bold text-sm border-b border-indigo-500/10 pb-2">Receipts & Payment History</h3>
          <div className="flex flex-col gap-3">
            {payments.length === 0 ? (
              <p className="text-xs text-muted font-semibold text-center py-4">No payment logs found.</p>
            ) : (
              payments.map(pay => (
                <div key={pay.id} className="bg-foreground/3 border border-border/50 rounded-xl p-3 text-[10px] flex justify-between items-center">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold uppercase text-[9px] tracking-wide text-indigo-400">Transaction Success</span>
                    <span className="text-muted">ID: {pay.transactionId}</span>
                    <span className="text-[8px] text-muted">{new Date(pay.createdAt).toLocaleDateString()}</span>
                  </div>
                  <strong className="text-emerald-400 text-xs">₹{pay.amount}</strong>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

// Simple placeholder close icon since X is imported from lucide-react but was reference in layout
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
