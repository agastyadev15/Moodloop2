export interface PaymentDetails {
  planId: "plus" | "studio";
  amount: number;
  currency: string;
  billingPeriod: "month" | "year";
  userId?: string;
  email?: string;
}

export interface PaymentTransaction {
  id: string;
  planId: "free" | "plus" | "studio";
  status: "success" | "failed" | "pending";
  amount: number;
  provider: "stripe" | "razorpay" | "apple_iap";
  timestamp: number;
}

export interface PaymentProvider {
  id: string;
  name: string;
  logo: string;
  initializePayment: (details: PaymentDetails) => Promise<{ success: boolean; transactionId?: string; error?: string; checkoutUrl?: string }>;
  getSubscriptionStatus: (userId: string) => Promise<{ active: boolean; expiryDate?: number; error?: string }>;
}

export class StripeProvider implements PaymentProvider {
  id = "stripe";
  name = "Stripe";
  logo = "💳";

  async initializePayment(details: PaymentDetails): Promise<{ success: boolean; transactionId?: string; error?: string; checkoutUrl?: string }> {
    try {
      const response = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: details.userId || "anonymous",
          email: details.email,
          planId: details.planId,
          providerId: this.id
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return {
          success: true,
          transactionId: data.transactionId,
          checkoutUrl: data.checkoutUrl
        };
      }
      return { success: false, error: data.error || "Initialization failed" };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  }

  async getSubscriptionStatus(userId: string): Promise<{ active: boolean; expiryDate?: number }> {
    try {
      const response = await fetch("/api/payment/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return {
          active: data.subscriptionState.subscriptionStatus === "active" || data.subscriptionState.subscriptionStatus === "trialing",
          expiryDate: data.subscriptionState.renewalDate || undefined
        };
      }
      return { active: false };
    } catch {
      return { active: false };
    }
  }
}

export class RazorpayProvider implements PaymentProvider {
  id = "razorpay";
  name = "Razorpay";
  logo = "🚀";

  async initializePayment(details: PaymentDetails): Promise<{ success: boolean; transactionId?: string; error?: string; checkoutUrl?: string }> {
    try {
      const response = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: details.userId || "anonymous",
          email: details.email,
          planId: details.planId,
          providerId: this.id
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return {
          success: true,
          transactionId: data.transactionId,
          checkoutUrl: data.checkoutUrl
        };
      }
      return { success: false, error: data.error || "Initialization failed" };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  }

  async getSubscriptionStatus(userId: string): Promise<{ active: boolean; expiryDate?: number }> {
    try {
      const response = await fetch("/api/payment/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return {
          active: data.subscriptionState.subscriptionStatus === "active" || data.subscriptionState.subscriptionStatus === "trialing",
          expiryDate: data.subscriptionState.renewalDate || undefined
        };
      }
      return { active: false };
    } catch {
      return { active: false };
    }
  }
}

export class AppleIAPProvider implements PaymentProvider {
  id = "apple_iap";
  name = "Apple In-App Purchase";
  logo = "🍎";

  async initializePayment(details: PaymentDetails): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const response = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: details.userId || "anonymous",
          email: details.email,
          planId: details.planId,
          providerId: this.id
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return {
          success: true,
          transactionId: data.transactionId
        };
      }
      return { success: false, error: data.error || "StoreKit sheet trigger failed" };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  }

  async getSubscriptionStatus(userId: string): Promise<{ active: boolean; expiryDate?: number }> {
    try {
      const response = await fetch("/api/payment/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return {
          active: data.subscriptionState.subscriptionStatus === "active" || data.subscriptionState.subscriptionStatus === "trialing",
          expiryDate: data.subscriptionState.renewalDate || undefined
        };
      }
      return { active: false };
    } catch {
      return { active: false };
    }
  }
}

export const AVAILABLE_PAYMENT_PROVIDERS: PaymentProvider[] = [
  new StripeProvider(),
  new RazorpayProvider(),
  new AppleIAPProvider()
];
