import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  // ÉP SỬ DỤNG PHIÊN BẢN V1 CHÍNH THỨC
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

  const result = await model.generateContent(prompt + `
    TRẢ VỀ JSON THUẦN:
    {
      "objectives_addition": "nội dung mục tiêu",
      "materials_addition": "nội dung học liệu",
      "activities_integration": [{"anchor_text": "câu mốc", "content": "nội dung"}],
      "appendix_table": "ma trận"
    }
  `);

  const response = await result.response;
  const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(text);
};
// fix