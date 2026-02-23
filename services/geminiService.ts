import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  const data = JSON.parse((await result.response).text().replace(/```json|```/g, "").trim());

  return {
    objectives_addition: data.objectives_addition || "",
    materials_addition: data.materials_addition || "",
    activities_enhancement: Array.isArray(data.activities_enhancement) ? data.activities_enhancement : []
  };
};