import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  // SỬ DỤNG GEMINI 3 FLASH - DỨT ĐIỂM LỖI 404 VÀ TĂNG TỐC XỬ LÝ
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }); 

  const result = await model.generateContent(prompt + `
    YÊU CẦU NÂNG CAO VỀ XU THẾ NĂNG LỰC SỐ (NLS) 2026:
    1. TÍCH HỢP AI: Sử dụng AI Generator (Gemini, ChatGPT, GeoGebra AI) để học sinh đối chiếu kết quả.
    2. TÍNH THỰC TIỄN (STEM): Gắn liền với các dự án thực tế (phân tích dữ liệu, mô hình 3D).
    3. TƯ DUY PHÊ PHÁN: Đánh giá độ tin cậy của thông tin số và đạo đức AI.
    
    YÊU CẦU KỸ THUẬT:
    - TRẢ VỀ JSON THUẦN (KHÔNG KÈM MARKDOWN).
    - Trường "appendix_table" BẮT BUỘC phải là một chuỗi văn bản (String), các tiêu chí ngăn cách bằng dấu xuống dòng. KHÔNG trả về mảng.

    {
      "objectives_addition": "mục tiêu NLS hướng tới việc làm chủ AI",
      "materials_addition": "học liệu số gồm các nền tảng AI và phần mềm mô phỏng",
      "activities_integration": [{"anchor_text": "câu mốc trong giáo án", "content": "hoạt động học tập có ứng dụng AI"}],
      "appendix_table": "Tiêu chí 1: Nội dung\\nTiêu chí 2: Nội dung"
    }
  `);

  const response = await result.response;
  const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
  
  // LOGIC SỬA LỖI split is not a function
  const parsed = JSON.parse(text);
  if (parsed.appendix_table && Array.isArray(parsed.appendix_table)) {
    parsed.appendix_table = parsed.appendix_table.join('\n');
  } else if (typeof parsed.appendix_table !== 'string') {
    parsed.appendix_table = String(parsed.appendix_table || "");
  }
  
  return parsed;
};