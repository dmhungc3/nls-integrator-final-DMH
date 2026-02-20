import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // SỬA LỖI: Chuyển hẳn về v1 và gọi đúng model Flash
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
  }); 

  const result = await model.generateContent(prompt + `
    YÊU CẦU: Trả về JSON thuần (không kèm chữ khác):
    {
      "objectives_addition": "Năng lực số cụ thể cho bài Địa lý",
      "materials_addition": "Học liệu số cần dùng",
      "activities_integration": [{"anchor_text": "câu gốc", "content": "nội dung tích hợp"}],
      "appendix_table": "Bảng ma trận NLS"
    }
  `);

  const response = await result.response;
  // Loại bỏ các ký tự Markdown thừa nếu có
  const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Lỗi dữ liệu AI:", text);
    throw new Error("AI trả về sai định dạng. Anh hãy nhấn nút thử lại nhé!");
  }
};