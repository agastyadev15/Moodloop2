import { PRICING_CONFIG, SubscriptionPlan } from "../pricingConfig";
import { ENABLE_PREMIUM } from "../premiumConfig";

export interface UserSubscriptionState {
  plan: "free" | "plus" | "studio";
  subscriptionPlan: "free" | "plus" | "studio";
  subscriptionStatus: "active" | "cancelled" | "trialing" | "expired" | "inactive";
  trialEndsAt: number | null;
  billingCycle: "monthly" | "forever";
  paymentProvider: "stripe" | "razorpay" | "apple_iap" | null;
  renewalDate: number | null;
  purchaseHistory: Array<{
    id: string;
    planId: "free" | "plus" | "studio";
    status: "success" | "failed" | "pending";
    amount: number;
    provider: "stripe" | "razorpay" | "apple_iap";
    timestamp: number;
  }>;
  trial: {
    startedAt: number | null;
    expiresAt: number | null;
    hasUsedTrial: boolean;
  };
  usageToday: {
    songSearches: number;
    emotionSearches: number;
    lastResetTimestamp: number; // For daily auto-resets
  };
  favoritesCount: number;
  playlistCount: number;
  joinDate: number;
}

const DEFAULT_STATE: UserSubscriptionState = {
  plan: "free",
  subscriptionPlan: "free",
  subscriptionStatus: "inactive",
  trialEndsAt: null,
  billingCycle: "forever",
  paymentProvider: null,
  renewalDate: null,
  purchaseHistory: [],
  trial: {
    startedAt: null,
    expiresAt: null,
    hasUsedTrial: false
  },
  usageToday: {
    songSearches: 0,
    emotionSearches: 0,
    lastResetTimestamp: Date.now()
  },
  favoritesCount: 0,
  playlistCount: 0,
  joinDate: Date.now()
};

// Helper to check if two timestamps are on different calendar days
function isDifferentDay(t1: number, t2: number): boolean {
  const d1 = new Date(t1);
  const d2 = new Date(t2);
  return (
    d1.getFullYear() !== d2.getFullYear() ||
    d1.getMonth() !== d2.getMonth() ||
    d1.getDate() !== d2.getDate()
  );
}

export function loadSubscriptionState(): UserSubscriptionState {
  try {
    const saved = localStorage.getItem("moodloop_subscription_state");
    if (!saved) {
      const state = { ...DEFAULT_STATE, joinDate: Date.now(), usageToday: { ...DEFAULT_STATE.usageToday, lastResetTimestamp: Date.now() } };
      saveSubscriptionState(state);
      if (!ENABLE_PREMIUM) {
        return {
          ...state,
          plan: "studio",
          subscriptionStatus: "active"
        };
      }
      return state;
    }
    
    let state: UserSubscriptionState = JSON.parse(saved);

    // Ensure new account management properties are set for backward compatibility
    if (state.subscriptionPlan === undefined) {
      state.subscriptionPlan = state.plan;
    }
    if (state.subscriptionStatus === undefined) {
      state.subscriptionStatus = state.plan === "free" ? "inactive" : "active";
    }
    if (state.trialEndsAt === undefined) {
      state.trialEndsAt = state.trial?.expiresAt || null;
    }
    if (state.billingCycle === undefined) {
      state.billingCycle = state.plan === "free" ? "forever" : "monthly";
    }
    if (state.paymentProvider === undefined) {
      state.paymentProvider = null;
    }
    if (state.renewalDate === undefined) {
      state.renewalDate = (state.plan !== "free" && state.subscriptionStatus === "active")
        ? (state.joinDate + 30 * 24 * 60 * 60 * 1000)
        : null;
    }
    if (state.purchaseHistory === undefined) {
      state.purchaseHistory = [];
    }

    // Apply auto-expiry of trial if applicable
    if (state.plan === "plus" && state.subscriptionStatus === "trialing" && state.trial.expiresAt) {
      if (Date.now() > state.trial.expiresAt) {
        state.plan = "free";
        state.subscriptionPlan = "free";
        state.subscriptionStatus = "expired";
        state.trialEndsAt = state.trial.expiresAt;
      }
    }

    // Auto-reset usage counters daily
    if (isDifferentDay(state.usageToday.lastResetTimestamp, Date.now())) {
      state.usageToday.songSearches = 0;
      state.usageToday.emotionSearches = 0;
      state.usageToday.lastResetTimestamp = Date.now();
    }

    // Always fetch current totals of playlists/favorites to stay in sync
    try {
      const favsSaved = localStorage.getItem("moodloop_favorites");
      const favsList = favsSaved ? JSON.parse(favsSaved) : [];
      state.favoritesCount = favsList.length;
    } catch {
      state.favoritesCount = 0;
    }

    try {
      const playlistsSaved = localStorage.getItem("moodloop_playlists");
      const playlistsList = playlistsSaved ? JSON.parse(playlistsSaved) : [];
      state.playlistCount = playlistsList.length;
    } catch {
      state.playlistCount = 0;
    }

    saveSubscriptionState(state);
    
    if (!ENABLE_PREMIUM) {
      return {
        ...state,
        plan: "studio",
        subscriptionStatus: "active"
      };
    }
    return state;
  } catch (err) {
    console.error("Error loading subscription state:", err);
    if (!ENABLE_PREMIUM) {
      return {
        ...DEFAULT_STATE,
        plan: "studio",
        subscriptionStatus: "active"
      };
    }
    return DEFAULT_STATE;
  }
}

export function saveSubscriptionState(state: UserSubscriptionState): void {
  try {
    const stateToSave = { ...state };
    if (!ENABLE_PREMIUM) {
      stateToSave.plan = stateToSave.subscriptionPlan || "free";
      if (stateToSave.plan === "free") {
        stateToSave.subscriptionStatus = "inactive";
      }
    }
    localStorage.setItem("moodloop_subscription_state", JSON.stringify(stateToSave));
  } catch (err) {
    console.error("Error saving subscription state:", err);
  }
}

export function startFreeTrial(state: UserSubscriptionState): UserSubscriptionState {
  if (state.trial.hasUsedTrial) {
    throw new Error("You have already used your free trial.");
  }

  const durationMs = 7 * 24 * 60 * 60 * 1000; // 7-day trial
  const startedAt = Date.now();
  const expiresAt = startedAt + durationMs;

  const transaction = {
    id: `tx_trial_${Math.random().toString(36).substring(2, 11)}`,
    planId: "plus" as const,
    status: "success" as const,
    amount: 0,
    provider: "stripe" as const,
    timestamp: startedAt
  };

  const newState: UserSubscriptionState = {
    ...state,
    plan: "plus",
    subscriptionPlan: "plus",
    subscriptionStatus: "trialing",
    trialEndsAt: expiresAt,
    billingCycle: "monthly",
    paymentProvider: "stripe",
    renewalDate: expiresAt,
    purchaseHistory: [transaction, ...(state.purchaseHistory || [])],
    trial: {
      startedAt,
      expiresAt,
      hasUsedTrial: true
    }
  };

  saveSubscriptionState(newState);
  return newState;
}

export function subscribeToPlan(
  state: UserSubscriptionState, 
  plan: "plus" | "studio",
  providerId: "stripe" | "razorpay" | "apple_iap" = "stripe"
): UserSubscriptionState {
  const amount = plan === "plus" ? 199 : 599;
  const now = Date.now();
  const expiresAt = now + 30 * 24 * 60 * 60 * 1000;

  const transaction = {
    id: `tx_${providerId}_${Math.random().toString(36).substring(2, 11)}`,
    planId: plan,
    status: "success" as const,
    amount,
    provider: providerId,
    timestamp: now
  };

  const newState: UserSubscriptionState = {
    ...state,
    plan,
    subscriptionPlan: plan,
    subscriptionStatus: "active",
    trialEndsAt: null,
    billingCycle: "monthly",
    paymentProvider: providerId,
    renewalDate: expiresAt,
    purchaseHistory: [transaction, ...(state.purchaseHistory || [])]
  };
  saveSubscriptionState(newState);
  return newState;
}

export function cancelSubscription(state: UserSubscriptionState): UserSubscriptionState {
  const newState: UserSubscriptionState = {
    ...state,
    plan: "free",
    subscriptionPlan: "free",
    subscriptionStatus: "cancelled",
    trialEndsAt: null,
    billingCycle: "forever",
    paymentProvider: null,
    renewalDate: null
  };
  saveSubscriptionState(newState);
  return newState;
}

export function recordSearch(state: UserSubscriptionState, type: "song" | "emotion"): { allowed: boolean; newState: UserSubscriptionState; limitReached: boolean } {
  if (!ENABLE_PREMIUM) {
    return { allowed: true, newState: state, limitReached: false };
  }
  // Ensure daily reset is updated
  let songSearches = state.usageToday.songSearches;
  let emotionSearches = state.usageToday.emotionSearches;
  let lastReset = state.usageToday.lastResetTimestamp;

  if (isDifferentDay(lastReset, Date.now())) {
    songSearches = 0;
    emotionSearches = 0;
    lastReset = Date.now();
  }

  const planConfig = PRICING_CONFIG[state.plan];
  
  if (type === "song") {
    if (songSearches >= planConfig.limits.songSearchesPerDay) {
      return { allowed: false, newState: state, limitReached: true };
    }
    songSearches += 1;
  } else {
    if (emotionSearches >= planConfig.limits.emotionSearchesPerDay) {
      return { allowed: false, newState: state, limitReached: true };
    }
    emotionSearches += 1;
  }

  const newState: UserSubscriptionState = {
    ...state,
    usageToday: {
      songSearches,
      emotionSearches,
      lastResetTimestamp: lastReset
    }
  };

  saveSubscriptionState(newState);
  return { allowed: true, newState, limitReached: false };
}

export function checkFeatureAccess(state: UserSubscriptionState, capability: keyof SubscriptionPlan["capabilities"]): boolean {
  if (!ENABLE_PREMIUM) {
    return true;
  }
  const planConfig = PRICING_CONFIG[state.plan];
  return planConfig.capabilities[capability];
}
