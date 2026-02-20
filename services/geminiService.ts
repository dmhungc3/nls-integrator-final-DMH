import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  // QUAN TRỌNG: Cấu hình sử dụng bản v1beta để hỗ trợ Gemini 1.5 Flash
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Sửa lại dòng gọi model để tránh lỗi 404
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
  }, { apiVersion: 'v1beta' }); // Thêm tham số v1beta vào đây

  const result = await model.generateContent(prompt + `
    YÊU CẦU: Trả về JSON thuần túy gồm:
    {
      "objectives_addition": "Năng lực số cụ thể cho bài học",
      "materials_addition": "Học liệu số cần dùng",
      "activities_integration": [{"anchor_text": "câu gốc trong bài", "content": "nội dung tích hợp"}],
      "appendix_table": "Bảng ma trận NLS"
    }
  `);

  const response = await result.response;
  const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Lỗi parse dữ liệu AI:", text);
    throw new Error("Dữ liệu AI không hợp lệ. Anh hãy thử lại nhé!");
  }
};