import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  // SỬ DỤNG GEMINI 3 FLASH MỚI NHẤT (MIỄN PHÍ & TỐC ĐỘ CAO)
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }); 

  const result = await model.generateContent(prompt + `
    YÊU CẦU QUAN TRỌNG: 
    1. Trả về JSON thuần, không kèm markdown.
    2. Nội dung phải phù hợp đặc thù môn học được yêu cầu.
    {
      "objectives_addition": "mục tiêu năng lực số",
      "materials_addition": "học liệu số đề xuất",
      "activities_integration": [{"anchor_text": "đoạn văn mốc", "content": "nội dung tích hợp"}],
      "appendix_table": "bảng ma trận"
    }
  `);

  const response = await result.response;
  const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(text);
};