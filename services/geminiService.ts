import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent(prompt + `
    YÊU CẦU QUAN TRỌNG: Trả về kết quả CHỈ LÀ một đối tượng JSON thuần túy, không có ký tự lạ, với cấu trúc:
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
    console.error("Lỗi parse JSON:", text);
    throw new Error("AI trả về định dạng không đúng. Hãy thử lại!");
  }
};