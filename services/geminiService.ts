import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  // SỬ DỤNG GEMINI 3 FLASH - DỨT ĐIỂM LỖI 404 VÀ TĂNG TỐC XỬ LÝ
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }); 

  const result = await model.generateContent(prompt + `
    YÊU CẦU NÂNG CAO VỀ XU THẾ NĂNG LỰC SỐ (NLS) 2026:
    1. TÍCH HỢP AI CHUYÊN SÂU: Gợi ý sử dụng AI Generator (Gemini, ChatGPT, GeoGebra AI) để học sinh đối chiếu kết quả hoặc tối ưu hóa bài toán.
    2. TÍNH THỰC TIỄN & STEM: Gắn liền với các dự án thực tế (ví dụ: dùng cảm biến dữ liệu, mô phỏng 3D quĩ đạo Parabol).
    3. TƯ DUY PHÊ PHÁN SỐ: Học sinh phải biết đánh giá độ tin cậy của thông tin số và đạo đức khi sử dụng AI.
    4. TRÌNH BÀY: Tự động IN ĐẬM (Dùng dấu **) các từ khóa về công cụ số và năng lực số quan trọng.

    YÊU CẦU KỸ THUẬT BẮT BUỘC:
    - TRẢ VỀ JSON THUẦN (KHÔNG KÈM MARKDOWN).
    - Trường "appendix_table" PHẢI LÀ CHUỖI VĂN BẢN (STRING). Các tiêu chí cách nhau bằng dấu xuống dòng (\\n). 
    - TUYỆT ĐỐI KHÔNG TRẢ VỀ MẢNG [] HOẶC ĐỐI TƯỢNG {} CHO TRƯỜNG "appendix_table".

    MẪU ĐỊNH DẠNG:
    {
      "objectives_addition": "Học sinh làm chủ **Công cụ AI** để...",
      "materials_addition": "Sử dụng phần mềm **GeoGebra**, **Gemini AI**...",
      "activities_integration": [{"anchor_text": "câu mốc trong giáo án", "content": "Sử dụng **AI Generator** để mô phỏng..."}],
      "appendix_table": "Tiêu chí 1: Sử dụng thành thạo **GeoGebra**\\nTiêu chí 2: Biết truy vấn **AI**"
    }
  `);

  const response = await result.response;
  const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
  
  // LOGIC SỬA LỖI split is not a function - GIỮ NGUYÊN VÀ CỦNG CỐ
  const parsed = JSON.parse(text);
  if (parsed.appendix_table && Array.isArray(parsed.appendix_table)) {
    parsed.appendix_table = parsed.appendix_table.join('\n');
  } else if (typeof parsed.appendix_table !== 'string') {
    parsed.appendix_table = String(parsed.appendix_table || "");
  }
  
  return parsed;
};