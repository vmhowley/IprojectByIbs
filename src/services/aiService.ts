import { GoogleGenerativeAI } from "@google/generative-ai";
import { Ticket } from '../types';

let genAI: GoogleGenerativeAI | null = null;
let cachedModelName: string | null = null;

const getGeminiClient = (apiKey?: string) => {
  if (genAI) return genAI;
  
  const key = apiKey || localStorage.getItem('gemini_api_key');
  
  if (!key) {
    throw new Error('Gemini API Key is missing. Please provide one.');
  }

  genAI = new GoogleGenerativeAI(key); 
  return genAI;
};

// Helper: Retry wrapper for 429/503 errors
const generateWithRetry = async (model: any, parts: any[], retries = 3): Promise<any> => {
    for (let i = 0; i < retries; i++) {
        try {
            return await model.generateContent(parts);
        } catch (e: any) {
            const isRateLimit = e.message?.includes('429') || e.status === 429;
            const isServerOverload = e.message?.includes('503') || e.status === 503;

            if ((isRateLimit || isServerOverload) && i < retries - 1) {
                const waitTime = Math.pow(2, i) * 2000; // 2s, 4s, 8s
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }
            throw e;
        }
    }
};

// Helper: Find a working model dynamically
const getWorkingModel = async (ai: GoogleGenerativeAI) => {
    if (cachedModelName) {
        return ai.getGenerativeModel({ model: cachedModelName });
    }

    let availableModels: string[] = [];
    try {
        const key = localStorage.getItem('gemini_api_key');
        const listValues = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await listValues.json();
        if (data.models) {
            availableModels = data.models.map((m: any) => m.name.replace('models/', ''));
        }
    } catch (e) {
        // Silent fail on list, proceed to fallback
    }

    const candidateModels = availableModels.filter(m => 
        !m.includes('embedding') && 
        !m.includes('aqa') && 
        !m.includes('imagen') && 
        !m.includes('veo') &&
        !m.includes('tts') &&
        !m.includes('computer-use')
    );

    // Sort: 1.5-Flash (Stable) > 2.0-Flash-Lite > 2.0-Flash > Pro
    candidateModels.sort((a, b) => {
        const getScore = (name: string) => {
            if (name === 'gemini-1.5-flash') return 100;
            if (name === 'gemini-1.5-flash-001') return 95;
            if (name.includes('gemini-2.0-flash-lite')) return 90;
            if (name === 'gemini-2.0-flash-001') return 85;
            if (name === 'gemini-2.0-flash') return 80;
            if (name.includes('gemini-1.5-pro')) return 70;
            
            let score = 0;
            if (name.includes('flash')) score += 30;
            if (name.includes('pro')) score += 20;

            if (name.includes('exp')) score -= 10;
            if (name.includes('latest')) score -= 20; 
            if (name.includes('2.5')) score -= 50; 

            return score;
        };
        return getScore(b) - getScore(a);
    });

    if (candidateModels.length === 0) {
        candidateModels.push("gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro");
    }

    for (const modelName of candidateModels) {
        try {
            const model = ai.getGenerativeModel({ model: modelName });
            await generateWithRetry(model, ["Ping"], 1); 
            cachedModelName = modelName;
            return model;
        } catch (e: any) {
             // Continue
        }
    }

    throw new Error(`All Gemini models failed. Please check your API key and quota.`);
};

// Helper: Clean JSON
const cleanAndParseJson = (text: string) => {
    try {
        const clean = text.replace(/^```json\n?|\n?```$/g, '').trim();
        return JSON.parse(clean);
    } catch (e) {
        console.error("Failed to parse AI response");
        return null;
    }
};

export const aiService = {
  setApiKey: (key: string) => {
    localStorage.setItem('gemini_api_key', key);
    genAI = null;
    cachedModelName = null;
  },

  hasKey: () => {
    return !!localStorage.getItem('gemini_api_key');
  },

  processMeetingAudio: async (audioBlob: Blob): Promise<{ summary: string, action_items: string[], transcription?: string }> => {
    const ai = getGeminiClient();
    const model = await getWorkingModel(ai);

    const fileToGenerativePart = async (file: Blob) => {
      const base64EncodedDataPromise = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            }
        };
        reader.readAsDataURL(file);
      });
      return {
        inlineData: {
          data: await base64EncodedDataPromise as string,
          mimeType: file.type,
        },
      };
    };

    const audioPart = await fileToGenerativePart(audioBlob);

    const prompt = `
      You are an expert meeting assistant. Listen to this recording and transcribe the key points.
      
      Return a JSON object with:
      - summary: A comprehensive summary of the meeting (2-3 paragraphs) IN SPANISH.
      - action_items: An array of strings, each describing a specific task or follow-up action mentioned, IN SPANISH.
      - transcription: A rough transcription of the audio IN SPANISH (or the language spoken).
      
      Output JSON only. Ensure all text values are in Spanish.
    `;
    
    const result = await generateWithRetry(model, [prompt, audioPart]);
    const response = await result.response;
    const textResponse = response.text();
    
    return cleanAndParseJson(textResponse) || { summary: "Error al procesar la respuesta de la IA", action_items: [] };
  },

  generateTicketFromText: async (text: string): Promise<Partial<Ticket>> => {
    const ai = getGeminiClient();
    const model = await getWorkingModel(ai);
    
    const prompt = `
      Analyze the following text and extract ticket details. 
      Return ONLY a JSON object (no markdown, no extra text) with these fields:
      - subject (string): A concise title (max 60 chars)
      - description (string): A detailed description. Use formatting if needed.
      - priority (enum): "low", "medium", or "high". Infer from urgency.
      - type (enum): "bug", "feature_request", "maintenance". Infer context.
      
      Text: "${text}"
    `;

    const result = await generateWithRetry(model, [prompt]);
    const response = await result.response;
    const textResponse = response.text();
    
    return cleanAndParseJson(textResponse) || {};
  },

  summarizeComments: async (comments: string[]): Promise<string> => {
    const ai = getGeminiClient();
    const model = await getWorkingModel(ai);

    const joinedComments = comments.join("\n---\n");
    
    const prompt = `
      Summarize the following discussion thread into a concise status update (max 3 sentences).
      Highlight decisions made and pending actions.
      
      Comments:
      ${joinedComments}
    `;

    const result = await generateWithRetry(model, [prompt]);
    const response = await result.response;
    return response.text() || "No summary generated.";
  },

  generateSubtasks: async (description: string): Promise<string[]> => {
    const ai = getGeminiClient();
    const model = await getWorkingModel(ai);
    
    const prompt = `
      Break down the following task description into a checklist of actionable subtasks (max 5).
      Return ONLY a JSON object (no markdown) with a field "subtasks" which is an array of strings.
      
      Task: "${description}"
    `;

    const result = await generateWithRetry(model, [prompt]);
    const response = await result.response;
    const textResponse = response.text();
    
    const parsed = cleanAndParseJson(textResponse);
    return parsed?.subtasks || [];
  }
};
