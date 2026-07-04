// Feature flag for temporarily removing Premium/Subscription functionality.
// When set to false, all premium features are fully unlocked for every user and all Premium UI elements are hidden.
// To toggle this at runtime without rebuilding, set window.ENABLE_PREMIUM = true (e.g., in index.html or browser console).
export const ENABLE_PREMIUM = typeof window !== "undefined" && (window as any).ENABLE_PREMIUM !== undefined
  ? (window as any).ENABLE_PREMIUM
  : false;
