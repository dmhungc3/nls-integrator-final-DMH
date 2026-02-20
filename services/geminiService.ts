import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Sử dụng cấu hình model ổn định nhất, không dùng v1beta để tránh lỗi 404
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
  }); 

  const result = await model.generateContent(prompt + `
    YÊU CẦU: Trả về JSON thuần túy (không kèm Markdown):
    {
      "objectives_addition": "nội dung chèn mục tiêu",
      "materials_addition": "nội dung chèn học liệu số",
      "activities_integration": [{"anchor_text": "câu gốc", "content": "hoạt động số"}],
      "appendix_table": "bảng ma trận"
    }
  `);

  const response = await result.response;
  let text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Lỗi parse dữ liệu AI:", text);
    throw new Error("Dữ liệu AI không hợp lệ. Anh hãy nhấn nút thử lại!");
  }
};