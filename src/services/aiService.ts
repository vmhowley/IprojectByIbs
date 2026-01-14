import { GoogleGenAI } from "@google/genai";
import { Ticket } from '../types';

let genAI: GoogleGenAI | null = null;
// No explicit model object needed for this SDK pattern as we call client.models.generateContent

const getGeminiClient = (apiKey?: string) => {
  if (genAI) return genAI;
  
  const key = apiKey || localStorage.getItem('gemini_api_key');
  
  if (!key) {
    throw new Error('Gemini API Key is missing. Please provide one.');
  }

  // The new SDK constructor likely takes { apiKey: ... } or just options
  // User docs: const ai = new GoogleGenAI({}); <- This relies on env vars?
  // But standard pattern usually accepts key. Let's assume { apiKey: key } based on standard patterns or pass key if constructor allows string.
  // Actually, checking standard Google libs, it's often { apiKey: ... }. 
  // User provided Python example: client = genai.Client(api_key=...)
  // JS example: const ai = new GoogleGenAI({}); 
  // Let's try passing { apiKey: key } to be safe as "key" string might fail if it expects object.
  // If it fails, we fall back to user prompt.
  genAI = new GoogleGenAI({ apiKey: key }); 
  return genAI;
};

export const aiService = {
  setApiKey: (key: string) => {
    localStorage.setItem('gemini_api_key', key);
    genAI = null; // Force re-init
  },

  hasKey: () => {
    return !!localStorage.getItem('gemini_api_key');
  },

  processMeetingAudio: async (audioBlob: Blob): Promise<{ summary: string, actionItems: string[], transcription?: string }> => {
    const client = getGeminiClient();
    
    // Convert Blob to Base64
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
          data: await base64EncodedDataPromise,
          mimeType: file.type,
        },
      };
    };

    const audioPart = await fileToGenerativePart(audioBlob);

    const prompt = `
      You are an expert meeting assistant. Listen to this recording and transcribe the key points.
      
      Return a JSON object with:
      - summary: A comprehensive summary of the meeting (2-3 paragraphs).
      - action_items: An array of strings, each describing a specific task or follow-up action mentioned.
      - transcription: A rough transcription of the audio.
      
      Output JSON only.
    `;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: [
        { role: "user", parts: [{ text: prompt }, audioPart as any] }
      ],
    });

    const textResponse = response.text || "{}";
    const cleanJson = textResponse.replace(/^```json\n|\n```$/g, '').trim();
    
    try {
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Failed to parse AI response", e);
        return { summary: "Error parsing AI response", actionItems: [] };
    }
  },

  generateTicketFromText: async (text: string): Promise<Partial<Ticket>> => {
    const client = getGeminiClient();
    
    const prompt = `
      Analyze the following text and extract ticket details. 
      Return ONLY a JSON object (no markdown, no extra text) with these fields:
      - subject (string): A concise title (max 60 chars)
      - description (string): A detailed description. Use formatting if needed.
      - priority (enum): "low", "medium", or "high". Infer from urgency.
      - type (enum): "bug", "feature_request", "maintenance". Infer context.
      
      Text: "${text}"
    `;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const textResponse = response.text || ""; // SDK might return .text property based on user example
    
    // Clean up potential markdown code blocks if Gemini returns them
    const cleanJson = textResponse.replace(/^```json\n|\n```$/g, '').trim();

    return JSON.parse(cleanJson);
  },

  summarizeComments: async (comments: string[]): Promise<string> => {
    const client = getGeminiClient();
    const joinedComments = comments.join("\n---\n");
    
    const prompt = `
      Summarize the following discussion thread into a concise status update (max 3 sentences).
      Highlight decisions made and pending actions.
      
      Comments:
      ${joinedComments}
    `;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "No summary generated.";
  },

  generateSubtasks: async (description: string): Promise<string[]> => {
    const client = getGeminiClient();
    
    const prompt = `
      Break down the following task description into a checklist of actionable subtasks (max 5).
      Return ONLY a JSON object (no markdown) with a field "subtasks" which is an array of strings.
      
      Task: "${description}"
    `;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const textResponse = response.text || "";
    
    const cleanJson = textResponse.replace(/^```json\n|\n```$/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    return parsed.subtasks || [];
  }
};
