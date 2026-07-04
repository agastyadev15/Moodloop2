export interface SubscriptionPlan {
  id: "free" | "plus" | "studio";
  name: string;
  price: string;
  currency: string;
  billingPeriod: string;
  features: string[];
  limits: {
    songSearchesPerDay: number;
    emotionSearchesPerDay: number;
    maxRecommendations: number;
    maxFavorites: number;
    maxPlaylists: number;
  };
  capabilities: {
    advancedFilters: boolean;
    compareSongs: boolean;
    recommendationExplanations: boolean;
    searchHistory: boolean;
    playlistExport: boolean;
    weeklyDiscoveryReport: boolean;
    undergroundDiscoveries: boolean;
    hiddenGems: boolean;
    crossLanguage: boolean;
    sonicAnalytics: boolean;
    listeningInsights: boolean;
    advancedControls: boolean;
  };
}

export const PRICING_CONFIG: Record<"free" | "plus" | "studio", SubscriptionPlan> = {
  free: {
    id: "free",
    name: "Free",
    price: "0",
    currency: "₹",
    billingPeriod: "forever",
    features: [
      "10 song searches per day",
      "5 emotion searches per day",
      "Maximum 10 recommendations",
      "Save up to 20 favorite songs",
      "Maximum 2 playlists",
      "Basic recommendation quality",
      "Apple Music and YouTube links"
    ],
    limits: {
      songSearchesPerDay: 10,
      emotionSearchesPerDay: 5,
      maxRecommendations: 10,
      maxFavorites: 20,
      maxPlaylists: 2
    },
    capabilities: {
      advancedFilters: false,
      compareSongs: false,
      recommendationExplanations: false,
      searchHistory: false,
      playlistExport: false,
      weeklyDiscoveryReport: false,
      undergroundDiscoveries: false,
      hiddenGems: false,
      crossLanguage: false,
      sonicAnalytics: false,
      listeningInsights: false,
      advancedControls: false
    }
  },
  plus: {
    id: "plus",
    name: "MoodLoop Plus",
    price: "199",
    currency: "₹",
    billingPeriod: "month",
    features: [
      "Unlimited song searches",
      "Unlimited emotion searches",
      "30 recommendations per search",
      "Unlimited favorites",
      "Unlimited playlists",
      "Compare two songs",
      "Recommendation explanations",
      "Advanced search filters",
      "Search history",
      "Playlist export",
      "Faster recommendation generation",
      "Better recommendation ranking"
    ],
    limits: {
      songSearchesPerDay: Infinity,
      emotionSearchesPerDay: Infinity,
      maxRecommendations: 30,
      maxFavorites: Infinity,
      maxPlaylists: Infinity
    },
    capabilities: {
      advancedFilters: true,
      compareSongs: true,
      recommendationExplanations: true,
      searchHistory: true,
      playlistExport: true,
      weeklyDiscoveryReport: false,
      undergroundDiscoveries: false,
      hiddenGems: false,
      crossLanguage: false,
      sonicAnalytics: false,
      listeningInsights: false,
      advancedControls: false
    }
  },
  studio: {
    id: "studio",
    name: "MoodLoop Studio",
    price: "599",
    currency: "₹",
    billingPeriod: "month",
    features: [
      "Everything in Plus",
      "Weekly discovery report",
      "Underground discoveries",
      "Hidden gems mode",
      "Sonic profile analytics",
      "Listening insights",
      "Advanced recommendation controls",
      "Cross-language discovery",
      "Beta features",
      "Future AI tools"
    ],
    limits: {
      songSearchesPerDay: Infinity,
      emotionSearchesPerDay: Infinity,
      maxRecommendations: 30,
      maxFavorites: Infinity,
      maxPlaylists: Infinity
    },
    capabilities: {
      advancedFilters: true,
      compareSongs: true,
      recommendationExplanations: true,
      searchHistory: true,
      playlistExport: true,
      weeklyDiscoveryReport: true,
      undergroundDiscoveries: true,
      hiddenGems: true,
      crossLanguage: true,
      sonicAnalytics: true,
      listeningInsights: true,
      advancedControls: true
    }
  }
};
