import React, { useState, useEffect } from "react";
import { X, Check, Sparkles, FileText, Compass, BarChart2, Eye, Sliders, Globe, Zap, HelpCircle, Shield, RefreshCw, Loader2, Mail, CreditCard, ChevronRight } from "lucide-react";
import { PRICING_CONFIG } from "../pricingConfig";
import { AVAILABLE_PAYMENT_PROVIDERS } from "../services/payment";
import { UserSubscriptionState } from "../utils/subscriptionManager";
import { motion, AnimatePresence } from "motion/react";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: UserSubscriptionState;
  onUpdateState: (newState: UserSubscriptionState) => void;
  triggerToast: (msg: string) => void;
  gateMessage?: string | null;
}

const FEATURES_LIST = [
  {
    icon: FileText,
    title: "Weekly discovery report",
    description: "Weekly synthesized breakdown of your listening habits and recommendations."
  },
  {
    icon: Compass,
    title: "Underground discoveries",
    description: "Access to high-fidelity songs with less than 10,000 global plays."
  },
  {
    icon: Sparkles,
    title: "Hidden gems mode",
    description: "Toggle to prioritize underground tracks with exceptional musicological depth."
  },
  {
    icon: BarChart2,
    title: "Sonic profile analytics",
    description: "Interactive visuals detailing your acoustic fingerprint and preference trends."
  },
  {
    icon: Eye,
    title: "Listening insights",
    description: "AI-curated commentary explaining the emotional drivers behind your music choice."
  },
  {
    icon: Sliders,
    title: "Advanced recommendation controls",
    description: "Fine-tune sliders for acousticness, danceability, energy, and valence."
  },
  {
    icon: Globe,
    title: "Cross-language discovery",
    description: "Break down boundaries with global and cross-lingual match recommendations."
  },
  {
    icon: Zap,
    title: "Beta features",
    description: "Early access to experimental musicological discovery features and integrations."
  },
  {
    icon: HelpCircle,
    title: "Future AI tools",
    description: "Automatic inclusion in upcoming generative mood and text-to-music search features."
  }
];

const PROVIDERS_LIST = [
  {
    id: "stripe",
    name: "Stripe",
    subtitle: "Cards, wallets & more",
    logo: "💳"
  },
  {
    id: "razorpay",
    name: "Razorpay",
    subtitle: "UPI, Cards, Netbanking",
    logo: "🚀"
  },
  {
    id: "apple_iap",
    name: "Apple In-App Purchase",
    subtitle: "iOS subscriptions",
    logo: "🍎"
  }
];

export default function SubscriptionModal({
  isOpen,
  onClose,
  currentState,
  onUpdateState,
  triggerToast,
  gateMessage
}: SubscriptionModalProps) {
  const [selectedProviderId, setSelectedProviderId] = useState<string>("stripe");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>(() => {
    try {
      return localStorage.getItem("moodloop_user_email") || "";
    } catch {
      return "";
    }
  });

  const handleStartTrial = async () => {
    if (currentState.trial?.hasUsedTrial) {
      triggerToast("You have already utilized your free trial.");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/payment/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentState.joinDate.toString(),
          email: userEmail
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        onUpdateState(data.subscriptionState);
        triggerToast("Your 7-day free trial of MoodLoop Studio is now active! 👑");
        onClose();
      } else {
        triggerToast(data.error || "Failed to initialize free trial.");
      }
    } catch (err: any) {
      triggerToast(`Trial initialization error: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubscribe = async (planId: "plus" | "studio") => {
    setProcessingPlanId(planId);
    setIsProcessing(true);

    const provider = AVAILABLE_PAYMENT_PROVIDERS.find(p => p.id === selectedProviderId) || AVAILABLE_PAYMENT_PROVIDERS[0];
    const planConfig = PRICING_CONFIG[planId];

    try {
      const response = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentState.joinDate.toString(),
          email: userEmail,
          planId,
          providerId: selectedProviderId
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        onUpdateState(data.subscriptionState);
        
        let message = `Successfully upgraded to ${planConfig.name} via ${provider.name}!`;
        if (data.apiCalledReal && data.checkoutUrl) {
          message += ` Checkout loaded. Transaction: ${data.transactionId}`;
        } else {
          message += ` Simulating payment. Transaction: ${data.transactionId}`;
        }
        
        triggerToast(message);
        if (userEmail) {
          try {
            localStorage.setItem("moodloop_user_email", userEmail);
          } catch {}
        }
        onClose();
      } else {
        triggerToast(`Payment failed: ${data.error || "Initialization error"}`);
      }
    } catch (err: any) {
      triggerToast(`Payment service communication failed: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
      setProcessingPlanId(null);
    }
  };

  const handleCancelSubscription = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/payment/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentState.joinDate.toString()
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        onUpdateState(data.subscriptionState);
        triggerToast("Your subscription has been cancelled. Your plan is reset to Free.");
      } else {
        triggerToast(data.error || "Cancellation failed.");
      }
    } catch (err: any) {
      triggerToast(`Cancellation error: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (!userEmail) {
      triggerToast("Please enter an email address to look up and restore purchases.");
      return;
    }
    setIsProcessing(true);
    try {
      const response = await fetch("/api/payment/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentState.joinDate.toString(),
          email: userEmail
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        onUpdateState(data.subscriptionState);
        try {
          localStorage.setItem("moodloop_user_email", userEmail);
        } catch {}
        triggerToast("Prior subscription found on server and restored! Welcome back 👑");
      } else {
        triggerToast(data.error || "No active purchases or subscriptions found on file for this email.");
      }
    } catch (err: any) {
      triggerToast(`Failed to restore purchases: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSyncStatus = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/payment/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentState.joinDate.toString(),
          clientState: currentState
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        onUpdateState(data.subscriptionState);
        triggerToast("Billing profile synced with server! 🔄");
      } else {
        triggerToast("Failed to sync profile: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      triggerToast(`Sync failed: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/30 backdrop-blur-[6px] overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-5xl bg-white border border-neutral-200/80 rounded-[24px] shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]"
        >
          {/* Top Header */}
          <div className="flex items-start justify-between p-8 pb-6 border-b border-neutral-100 bg-white">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#8B5CF6] font-extrabold block">
                PREMIUM ACCESS
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold font-sans text-neutral-900 tracking-tight">
                Unlock Ultimate Musicological Power
              </h2>
              <p className="text-xs md:text-sm text-neutral-500 font-sans leading-relaxed">
                Go beyond the ordinary. Discover deeper, explore further.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-all cursor-pointer shadow-sm shrink-0 active:scale-95"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Gate Trigger Banner */}
          {gateMessage && (
            <div className="bg-[#8B5CF6]/5 border-b border-[#8B5CF6]/10 py-3 px-8 text-xs font-semibold text-[#8B5CF6] flex items-center gap-2 font-sans">
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#8B5CF6]" />
              <span>{gateMessage}</span>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 max-h-[62vh] bg-[#FAF9F6]/30">
            
            {/* Account Status and Management Hub */}
            <div className="bg-white border border-neutral-100 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between shadow-sm">
              <div className="space-y-1.5 text-left">
                <span className="text-[9px] font-mono uppercase text-neutral-400 font-bold tracking-wider">
                  Active Subscription State
                </span>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-sm font-extrabold text-neutral-900 font-sans">
                    Plan: {PRICING_CONFIG[currentState.plan].name}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider font-extrabold border ${
                    currentState.subscriptionStatus === "trialing"
                      ? "bg-amber-50 border-amber-200 text-amber-700"
                      : currentState.subscriptionStatus === "active"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-neutral-50 border-neutral-200 text-neutral-600"
                  }`}>
                    {currentState.subscriptionStatus === "trialing" ? "7-Day Free Trial" : currentState.subscriptionStatus}
                  </span>
                </div>
                {currentState.subscriptionStatus === "trialing" && currentState.trialEndsAt && (
                  <p className="text-xs text-neutral-500 font-sans">
                    Trial expires in: <strong className="text-neutral-800">{Math.ceil((currentState.trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24))} days</strong> ({new Date(currentState.trialEndsAt).toLocaleDateString()})
                  </p>
                )}
                {currentState.subscriptionStatus === "active" && currentState.renewalDate && (
                  <p className="text-xs text-neutral-500 font-sans">
                    Next billing renewal: <strong className="text-neutral-800">{new Date(currentState.renewalDate).toLocaleDateString()}</strong> (via {currentState.paymentProvider === "apple_iap" ? "Apple" : currentState.paymentProvider || "Stripe"})
                  </p>
                )}
              </div>

              {/* Sync and Restore Actions */}
              <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1 min-w-[200px]">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="email"
                    placeholder="Enter email to backup..."
                    value={userEmail}
                    onChange={(e) => {
                      setUserEmail(e.target.value);
                      try {
                        localStorage.setItem("moodloop_user_email", e.target.value);
                      } catch {}
                    }}
                    className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]/50 focus:border-[#8B5CF6] text-neutral-800 font-sans"
                  />
                </div>
                
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={handleSyncStatus}
                    disabled={isProcessing}
                    title="Sync and backup subscription details to secure server"
                    className="px-3 py-1.5 text-xs font-bold text-neutral-600 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <RefreshCw className={`w-3 h-3 ${isProcessing ? "animate-spin" : ""}`} />
                    Backup
                  </button>
                  <button
                    onClick={handleRestorePurchases}
                    disabled={isProcessing}
                    title="Restore prior purchases using account email"
                    className="px-3 py-1.5 text-xs font-bold text-[#8B5CF6] hover:bg-[#8B5CF6]/5 border border-[#8B5CF6]/20 rounded-xl transition-all cursor-pointer active:scale-95"
                  >
                    Restore
                  </button>
                </div>

                {currentState.plan !== "free" && (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={isProcessing}
                    className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-all cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
                  >
                    Cancel Plan
                  </button>
                )}
              </div>
            </div>

            {/* Split Grid: Features on Left, Pricing and Payments on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: 9 Features in two columns */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-1 text-left">
                  <h3 className="text-sm font-extrabold text-neutral-950 font-sans uppercase tracking-wider">
                    Everything you get in Studio
                  </h3>
                  <p className="text-xs text-neutral-400 font-sans">
                    Uncompromising musical tools curated specifically for cognitive acoustics.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 text-left">
                  {FEATURES_LIST.map((feat, idx) => {
                    const IconComponent = feat.icon;
                    return (
                      <div key={idx} className="flex gap-3 items-start group">
                        {/* Rounded square icon with lavender outline */}
                        <div className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#8B5CF6]/20 bg-white text-neutral-700 shrink-0 group-hover:border-[#8B5CF6]/40 transition-colors">
                          <IconComponent className="w-4.5 h-4.5 text-neutral-800" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-extrabold text-neutral-900 leading-tight">
                            {feat.title}
                          </h4>
                          <p className="text-[11px] text-neutral-400 leading-normal font-sans">
                            {feat.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Pricing and Payments Cards */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Pricing Card */}
                <div className="border border-neutral-100 rounded-2xl p-6 bg-white space-y-5 transition-transform duration-250 hover:scale-[1.02] shadow-sm text-left">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-base font-extrabold text-neutral-950 font-sans">MoodLoop Studio</h4>
                      <p className="text-[10px] text-neutral-400 font-sans">Professional acoustic suite</p>
                    </div>
                    <span className="px-2.5 py-0.5 text-[8px] font-mono tracking-widest font-extrabold uppercase text-[#8B5CF6] bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-full">
                      Most Popular
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-neutral-900 font-sans">₹599</span>
                      <span className="text-xs text-neutral-400">/ month</span>
                    </div>
                    <p className="text-[10px] text-neutral-400">Cancel anytime</p>
                  </div>

                  <button
                    onClick={() => handleSubscribe("studio")}
                    disabled={isProcessing}
                    className="w-full py-3 bg-neutral-950 hover:bg-neutral-850 text-white rounded-xl text-xs font-bold shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                  >
                    👑 Unlock Studio
                  </button>

                  <div className="text-center">
                    <button
                      onClick={handleStartTrial}
                      disabled={isProcessing || currentState.trial?.hasUsedTrial}
                      className={`text-[11px] font-semibold underline transition-colors cursor-pointer ${
                        currentState.trial?.hasUsedTrial
                          ? "text-neutral-300 cursor-not-allowed no-underline"
                          : "text-neutral-500 hover:text-[#8B5CF6]"
                      }`}
                    >
                      {currentState.trial?.hasUsedTrial ? "✓ Free Trial Claimed" : "✓ 7-day free trial"}
                    </button>
                  </div>
                </div>

                {/* Payment Selection Section */}
                <div className="space-y-3 text-left">
                  <h4 className="text-xs font-extrabold text-neutral-900 font-sans">
                    Secure payments. Your choice.
                  </h4>

                  <div className="grid grid-cols-1 gap-2">
                    {PROVIDERS_LIST.map((prov) => {
                      const isSelected = selectedProviderId === prov.id;
                      return (
                        <button
                          key={prov.id}
                          type="button"
                          onClick={() => setSelectedProviderId(prov.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 hover:scale-[1.01] cursor-pointer ${
                            isSelected
                              ? "border-[#8B5CF6] bg-[#8B5CF6]/5"
                              : "border-neutral-100 bg-white hover:border-neutral-200"
                          }`}
                        >
                          <span className="text-lg shrink-0">{prov.logo}</span>
                          <div className="flex-1 min-w-0">
                            <span className={`text-[11px] font-extrabold block ${isSelected ? "text-neutral-900" : "text-neutral-700"}`}>
                              {prov.name}
                            </span>
                            <span className="text-[9px] text-neutral-400 block truncate font-sans">
                              {prov.subtitle}
                            </span>
                          </div>
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? "border-[#8B5CF6] bg-[#8B5CF6]" : "border-neutral-200 bg-white"
                          }`}>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>

            {/* Purchase History / Invoices list (only visible if user has purchases) */}
            {currentState.purchaseHistory && currentState.purchaseHistory.length > 0 && (
              <div className="border-t border-neutral-100 pt-6 text-left space-y-3">
                <h4 className="text-xs font-extrabold text-neutral-900 font-sans flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-neutral-500" />
                  Your Billing History & Invoices
                </h4>
                <div className="overflow-x-auto border border-neutral-100 rounded-xl bg-white shadow-sm">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#FAF9F6] text-neutral-400 font-mono text-[9px] uppercase border-b border-neutral-100">
                      <tr>
                        <th className="px-4 py-2.5">Invoice ID</th>
                        <th className="px-4 py-2.5">Product</th>
                        <th className="px-4 py-2.5">Provider</th>
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Amount</th>
                        <th className="px-4 py-2.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-neutral-700 font-sans">
                      {currentState.purchaseHistory.map((inv) => (
                        <tr key={inv.id} className="hover:bg-neutral-50/50">
                          <td className="px-4 py-2.5 font-mono text-[10px] font-bold text-[#8B5CF6]">{inv.id}</td>
                          <td className="px-4 py-2.5 font-medium">MoodLoop {inv.planId === "plus" ? "Plus" : "Studio"}</td>
                          <td className="px-4 py-2.5 font-medium">{inv.provider === "apple_iap" ? "Apple App Store" : inv.provider === "razorpay" ? "Razorpay" : "Stripe"}</td>
                          <td className="px-4 py-2.5 text-neutral-400">{new Date(inv.timestamp).toLocaleDateString()}</td>
                          <td className="px-4 py-2.5 font-bold">₹{inv.amount}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">
                              ● Success
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Footer Info */}
          <div className="bg-[#FAF9F6] px-8 py-5 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <span className="flex items-center gap-1.5 font-bold">
              🔒 Secure checkout ready
            </span>
            <span className="font-bold">
              Currency: INR (₹)
            </span>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
