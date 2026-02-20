import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // SỬA LỖI 404: Sử dụng cấu hình model ổn định nhất hiện tại
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
  }); 

  const result = await model.generateContent(prompt + `
    YÊU CẦU: Trả về JSON thuần túy (không kèm chữ khác):
    {
      "objectives_addition": "nội dung chèn mục tiêu",
      "materials_addition": "nội dung chèn học liệu số",
      "activities_integration": [{"anchor_text": "câu gốc", "content": "hoạt động số"}],
      "appendix_table": "bảng ma trận"
    }
  `);

  const response = await result.response;
  const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
  
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error("AI trả về sai định dạng. Anh hãy nhấn nút thử lại!");
  }
};