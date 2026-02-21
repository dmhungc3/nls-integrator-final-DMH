import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  // SỬ DỤNG GEMINI 3 FLASH - MODEL MỚI NHẤT (MIỄN PHÍ & TỐC ĐỘ CAO)
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }); 

  const result = await model.generateContent(prompt + `
    YÊU CẦU NÂNG CAO VỀ XU THẾ NĂNG LỰC SỐ (NLS) 2026:
    1. TÍCH HỢP AI CHUYÊN SÂU: Gợi ý sử dụng **AI Generator** (Gemini, ChatGPT, GeoGebra AI) để học sinh đối chiếu kết quả hoặc tối ưu hóa bài toán.
    2. TÍNH THỰC TIỄN & STEM: Gắn liền với các dự án thực tế (ví dụ: dùng cảm biến dữ liệu, mô phỏng 3D quĩ đạo **Parabol**).
    3. TƯ DUY PHÊ PHÁN SỐ: Học sinh phải biết đánh giá độ tin cậy của thông tin số và đạo đức khi sử dụng AI.
    4. TRÌNH BÀY CHUYÊN NGHIỆP: Tự động **IN ĐẬM** (Sử dụng dấu **) các cụm từ về công cụ số và năng lực số quan trọng.

    YÊU CẦU VỀ MA TRẬN ĐÁNH GIÁ (APPENDIX_TABLE):
    - Thiết kế bảng đánh giá năng lực số theo đúng **5 mức độ chuẩn** sư phạm: 
      + Mức 1 (Nhận biết): Tìm kiếm, nhận diện thông tin số cơ bản.
      + Mức 2 (Vận dụng): Sử dụng công cụ số (máy tính, bảng tính) để tính toán.
      + Mức 3 (Phân tích): Khảo sát tính chất bằng phần mềm chuyên dụng (như **GeoGebra**).
      + Mức 4 (Mô hình hóa): Dùng công cụ số giải quyết bài toán thực tiễn.
      + Mức 5 (Sáng tạo/STEM): Thiết kế sản phẩm số hoặc đề xuất giải pháp mới.

    YÊU CẦU KỸ THUẬT QUAN TRỌNG ĐỂ TRÁNH LỖI:
    - TRẢ VỀ JSON THUẦN (KHÔNG KÈM MARKDOWN).
    - Trường "appendix_table" PHẢI LÀ MỘT CHUỖI VĂN BẢN (STRING). Các mức độ cách nhau bằng dấu xuống dòng (\\n). 
    - TUYỆT ĐỐI KHÔNG TRẢ VỀ MẢNG [] CHO TRƯỜNG "appendix_table".

    MẪU JSON TRẢ VỀ:
    {
      "objectives_addition": "Học sinh làm chủ **Công cụ AI** để...",
      "materials_addition": "Sử dụng phần mềm **GeoGebra**, **Gemini AI**...",
      "activities_integration": [{"anchor_text": "câu mốc trong giáo án", "content": "Sử dụng **AI Generator** để..."}],
      "appendix_table": "- Mức 1: Nhận diện kiến thức qua Video\\n- Mức 2: Tính toán bằng **Excel**\\n- Mức 3: Khảo sát bằng **GeoGebra**\\n- Mức 4: Mô hình hóa thực tế\\n- Mức 5: Sáng tạo sản phẩm STEM"
    }
  `);

  const response = await result.response;
  const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
  
  // LOGIC SỬA LỖI split is not a function - ĐẢM BẢO appendix_table LUÔN LÀ STRING
  const parsed = JSON.parse(text);
  if (parsed.appendix_table && Array.isArray(parsed.appendix_table)) {
    parsed.appendix_table = parsed.appendix_table.join('\n');
  } else if (typeof parsed.appendix_table !== 'string') {
    parsed.appendix_table = String(parsed.appendix_table || "");
  }
  
  return parsed;
};