import { GoogleGenAI, ThinkingLevel, GenerateContentResponse } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export interface MathStep {
  stepNumber: number;
  explanation: string;
  questionForUser: string;
}

const SYSTEM_INSTRUCTION = `You are Socrates, a compassionate and patient math tutor. 
Your goal is to help students solve calculus and algebra problems using the Socratic method.

CRITICAL RULES:
1. NEVER give the full solution or the final answer immediately.
2. When a student uploads an image, identify the problem and walk them through ONLY the first step.
3. Use a warm, encouraging, and patient tone.
4. If a student asks "Why did we do that?" or seems stuck, explain the specific underlying concept or mathematical principle in simple terms before moving forward.
5. After each explanation or step, ask a leading question to guide the student to the next logical step.
6. Use LaTeX for mathematical notation (e.g., $x^2$, $\\int f(x) dx$).
7. If the student gets a step right, praise them and move to the next step.
8. If they get it wrong, gently point out the error and ask a question that helps them see the mistake.

Your responses should be structured to be easily readable, using Markdown and LaTeX.`;

export async function analyzeMathProblem(
  imageBuffer: string,
  mimeType: string,
  history: any[] = []
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  const contents = [
    {
      parts: [
        {
          inlineData: {
            data: imageBuffer,
            mimeType: mimeType,
          },
        },
        {
          text: "Please analyze this math problem and guide me through the first step using the Socratic method.",
        },
      ],
    },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
    },
  });

  return response.text || "I'm sorry, I couldn't analyze the image. Could you try again?";
}

export async function chatWithTutor(
  message: string,
  history: { role: "user" | "model"; parts: { text: string }[] }[]
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  const chat = ai.chats.create({
    model: "gemini-3.1-pro-preview",
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
    },
    history: history,
  });

  const response = await chat.sendMessage({ message });
  return response.text || "I'm having trouble thinking right now. Let's try that again.";
}
