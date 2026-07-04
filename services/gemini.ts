import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: { model: string; contents: any; config?: any },
  maxRetries = 2
) {
  const modelsToTry = [params.model];
  if (params.model === "gemini-3.5-flash" || params.model === "gemini-2.5-flash") {
    modelsToTry.push("gemini-3.1-flash-lite");
    modelsToTry.push("gemini-flash-latest");
  } else if (params.model === "gemini-3.1-pro-preview" || params.model === "gemini-2.5-pro") {
    modelsToTry.push("gemini-3.5-flash");
    modelsToTry.push("gemini-3.1-flash-lite");
  }

  let lastError: any = null;
  let hadQuotaExceeded = false;

  for (const modelName of modelsToTry) {
    let retries = 0;
    while (retries <= maxRetries) {
      try {
        console.log(`Calling Gemini with model ${modelName} (attempt ${retries + 1}/${maxRetries + 1})...`);
        const response = await ai.models.generateContent({
          ...params,
          model: modelName,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMessage = String(err.message || err);
        const errCode = err.status || err.statusCode || err.code;

        const isQuota = 
          errCode === 429 || 
          errMessage.includes("429") || 
          errMessage.toLowerCase().includes("quota") || 
          errMessage.toLowerCase().includes("resource exhausted") || 
          errMessage.toLowerCase().includes("rate limit") ||
          errMessage.toLowerCase().includes("limit exceeded");

        if (isQuota) {
          hadQuotaExceeded = true;
          console.warn(`[Gemini API] Quota or Rate Limit reached (429/Resource Exhausted) for ${modelName}. Seamlessly trying other available models in the pipeline before failing.`);
          break; // Break the retry loop for this model, advancing to the next model in modelsToTry
        }

        console.log(`[Gemini API Info] Attempt ${retries + 1} for model ${modelName} returned status: ${errCode || 'unspecified'}. Message details: ${errMessage}`);

        // Transient errors: 503 Service Unavailable, or similar keywords
        const isTransient = 
          errCode === 503 || 
          String(errCode).includes("503") ||
          errMessage.includes("503") || 
          errMessage.toLowerCase().includes("overloaded") || 
          errMessage.toLowerCase().includes("high demand") || 
          errMessage.toLowerCase().includes("temporarily unavailable") ||
          errMessage.toLowerCase().includes("unavailable") ||
          errMessage.toLowerCase().includes("service unavailable");

        if (isTransient && retries < maxRetries) {
          const delay = Math.pow(2, retries) * 1500; // Exponential backoff: 1.5s, 3s...
          console.log(`Transient Gemini issue. Waiting ${delay}ms before retrying...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          retries++;
        } else {
          break;
        }
      }
    }
    console.log(`Exhausted retries for model ${modelName}. Attempting fallback model if available...`);
  }

  if (hadQuotaExceeded) {
    throw new Error("QuotaExceeded");
  }

  throw lastError || new Error("Failed to generate content from Gemini after trying all fallbacks.");
}

// Simple hash generator for fallback mechanisms
export function hashGenerator(str: string, min: number, max: number, offset: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash + offset);
  return min + (hash % (max - min + 1));
}
