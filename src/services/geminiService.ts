import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const SYSTEM_PROMPT = `You are Cenly AI, a world-class senior full-stack engineer specialized in React, Next.js (App Router), TypeScript, Tailwind CSS, and SaaS architecture.
Your goal is to generate high-quality, production-ready React projects based on user descriptions.

Always respond with a JSON object representing the file structure.
Format:
{
  "files": {
    "filename.tsx": "file content...",
    "components/Header.tsx": "file content...",
    "lib/utils.ts": "file content..."
  },
  "description": "Brief description of the project"
}

Rules:
1. Use modern React patterns (hooks, functional components).
2. Use Tailwind CSS for styling.
3. Assume a standard Next.js App Router structure.
4. Do not include node_modules or configuration files like package.json unless specifically asked.
5. Ensure all components are imported correctly.
6. The main entry point should be 'page.tsx'.
7. ALWAYS return valid JSON. Do not include any markdown formatting or explanations outside the JSON block.
8. **CRITICAL ROLE**: AI must NOT change UI design (colors, spacing, layout) in existing files unless the user explicitly requests a UI change.
9. Focus on logic, bug fixes, performance improvements, and new functional features.
10. Use **relative imports** (e.g., './Button' instead of '@/components/Button').
11. Ensure **EVERY** component you import is included in the 'files' object. Do not reference non-existent files.
12. If updating an existing project, return the full updated structure of the files to ensure consistency.
13. **SANDPACK COMPATIBILITY**: Strictly avoid Next.js-only modules like \`next/link\`, \`next/image\`, \`next/navigation\`. Use standard HTML tags (e.g., \`<a>\` instead of \`<Link>\`) or relative React components instead. The preview environment is pure React, NOT Next.js.`;

export const generateProject = async (
  prompt: string,
  imageBase64?: string,
): Promise<{ files: Record<string, string>; description: string }> => {
  if (!apiKey) throw new Error("API Key missing");

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const parts: any[] = [];
    if (imageBase64) {
      const base64Data = imageBase64.split(",")[1];
      const mimeType = imageBase64.split(";")[0].split(":")[1];
      parts.push({ inlineData: { mimeType, data: base64Data } });
    }
    parts.push({ text: prompt });

    const result = await model.generateContent(parts);
    let responseText = result.response.text();

    try {
      // Strip markdown code fences if present
      responseText = responseText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const jsonStart = responseText.indexOf("{");
      const jsonEnd = responseText.lastIndexOf("}");
      if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON found");
      const jsonStr = responseText.substring(jsonStart, jsonEnd + 1);
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse AI response:", responseText);
      throw new Error("AI returned invalid project structure");
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const updateProject = async (
  prompt: string,
  currentFiles: Record<string, string>,
  history: { role: "user" | "model"; text: string }[] = [],
  imageBase64?: string,
): Promise<{ files: Record<string, string>; description: string }> => {
  if (!apiKey) throw new Error("API Key missing");

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const conversationHistory = history
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`)
      .join("\n");

    const contextPrompt = `
${conversationHistory ? `Conversation History:\n${conversationHistory}\n` : ""}
Current project structure:
${JSON.stringify(currentFiles, null, 2)}

User request for update:
${prompt}

Please update the project files accordingly and return the full updated JSON structure.
    `;

    const parts: any[] = [];
    if (imageBase64) {
      const base64Data = imageBase64.split(",")[1];
      const mimeType = imageBase64.split(";")[0].split(":")[1];
      parts.push({ inlineData: { mimeType, data: base64Data } });
    }
    parts.push({ text: contextPrompt });

    const result = await model.generateContent(parts);
    let responseText = result.response.text();

    try {
      // Strip markdown code fences if present
      responseText = responseText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const jsonStart = responseText.indexOf("{");
      const jsonEnd = responseText.lastIndexOf("}");
      if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON found");
      const jsonStr = responseText.substring(jsonStart, jsonEnd + 1);
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse AI update response:", responseText);
      throw new Error("AI returned invalid update structure");
    }
  } catch (error) {
    console.error("Gemini API Update Error:", error);
    throw error;
  }
};

export const streamResponse = async (
  prompt: string,
  onChunk: (text: string) => void,
  imageBase64?: string,
): Promise<string> => {
  if (!apiKey) {
    onChunk("API Key missing");
    return "API Key missing";
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: "You are Cenly AI, a helpful coding assistant.",
    });

    const parts: any[] = [];
    if (imageBase64) {
      const base64Data = imageBase64.split(",")[1];
      const mimeType = imageBase64.split(";")[0].split(":")[1];
      parts.push({ inlineData: { mimeType, data: base64Data } });
    }
    parts.push({ text: prompt });

    const result = await model.generateContentStream(parts);
    let fullText = "";
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        fullText += text;
        onChunk(text);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Gemini stream error:", error);
    onChunk("I encountered an error.");
    return "Error";
  }
};
