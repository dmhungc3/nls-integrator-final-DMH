import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Bản chạy ổn định nhất cho gói Free/Hobby hiện tại
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
  }); 

  const result = await model.generateContent(prompt + `
    YÊU CẦU: Trả về JSON thuần túy, không kèm Markdown.
    Cấu trúc:
    {
      "objectives_addition": "Năng lực số cụ thể",
      "materials_addition": "Học liệu số",
      "activities_integration": [{"anchor_text": "câu gốc", "content": "hoạt động số"}],
      "appendix_table": "Bảng ma trận"
    }
  `);

  const response = await result.response;
  // Xử lý chuỗi để đảm bảo JSON an toàn
  let text = response.text();
  text = text.replace(/```json/g, "").replace(/```/g, "").trim();
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Lỗi parse JSON:", text);
    throw new Error("Dữ liệu AI không đúng định dạng. Anh hãy thử lại!");
  }
};