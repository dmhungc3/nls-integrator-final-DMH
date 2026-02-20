import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // SỬA LỖI 404: Thêm "-latest" để đảm bảo v1beta nhận diện đúng model
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash-latest",
  }, { apiVersion: 'v1beta' }); 

  const result = await model.generateContent(prompt + `
    YÊU CẦU QUAN TRỌNG: 
    1. Trả về định dạng JSON thuần túy.
    2. Không thêm bất kỳ chữ nào ngoài khối JSON.
    3. Cấu trúc phải chính xác như sau:
    {
      "objectives_addition": "nội dung chèn mục tiêu",
      "materials_addition": "nội dung chèn học liệu số",
      "activities_integration": [{"anchor_text": "câu gốc trong bài", "content": "nội dung tích hợp"}],
      "appendix_table": "bảng ma trận NLS"
    }
  `);

  const response = await result.response;
  const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Lỗi dữ liệu AI:", text);
    throw new Error("AI trả về sai định dạng. Anh hãy nhấn nút thử lại nhé!");
  }
};