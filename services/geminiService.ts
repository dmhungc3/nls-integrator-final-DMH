import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  // SỬ DỤNG GEMINI 3 FLASH - MODEL MỚI NHẤT CHO TỐC ĐỘ VÀ TRÍ TUỆ VƯỢT TRỘI
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }); 

  const result = await model.generateContent(prompt + `
    YÊU CẦU NÂNG CAO VỀ XU THẾ NĂNG LỰC SỐ (NLS) 2026:
    1. TÍCH HỢP AI: Đưa ra các hoạt động sử dụng AI Generator (như Gemini, ChatGPT, GeoGebra AI) để học sinh đối chiếu kết quả hoặc sáng tạo nội dung.
    2. TÍNH THỰC TIỄN (STEM): Gắn liền với các dự án thực tế (ví dụ: dùng bảng tính phân tích dữ liệu rác thải, dùng mô hình 3D cho kỹ thuật).
    3. TƯ DUY PHÊ PHÁN: Học sinh phải biết đánh giá độ tin cậy của thông tin số và đạo đức khi sử dụng AI.
    4. TRẢ VỀ JSON THUẦN (KHÔNG KÈM MARKDOWN):
    {
      "objectives_addition": "mục tiêu NLS hướng tới việc làm chủ AI và công cụ số hiện đại",
      "materials_addition": "học liệu số gồm các nền tảng AI, phần mềm mô phỏng và nguồn dữ liệu mở",
      "activities_integration": [{"anchor_text": "câu mốc trong giáo án", "content": "hoạt động học tập có ứng dụng AI hoặc công cụ số chuyên sâu"}],
      "appendix_table": "ma trận năng lực số chi tiết theo 5 mức độ"
    }
  `);

  const response = await result.response;
  const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(text);
};