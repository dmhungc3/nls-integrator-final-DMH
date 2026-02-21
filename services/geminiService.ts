import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  // SỬ DỤNG GEMINI 3 FLASH - DỨT ĐIỂM LỖI 404 VÀ TĂNG TỐC XỬ LÝ
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }); 

  const result = await model.generateContent(prompt + `
    YÊU CẦU NÂNG CAO VỀ XU THẾ NĂNG LỰC SỐ (NLS) 2026:
    1. TÍCH HỢP AI CHUYÊN SÂU: Gợi ý sử dụng **AI Generator** (Gemini, ChatGPT, GeoGebra AI) để học sinh đối chiếu kết quả hoặc tối ưu hóa bài toán.
    2. TÍNH THỰC TIỄN & STEM: Gắn liền với các dự án thực tế (ví dụ: dùng cảm biến dữ liệu, mô phỏng 3D quĩ đạo **Parabol**).
    3. TƯ DUY PHÊ PHÁN SỐ: Học sinh phải biết đánh giá độ tin cậy của thông tin số và đạo đức khi sử dụng AI.
    4. TRÌNH BÀY: Tự động **IN ĐẬM** (Dùng dấu **) các từ khóa về công cụ số và năng lực số quan trọng.

    YÊU CẦU VỀ MA TRẬN ĐÁNH GIÁ (APPENDIX_TABLE):
    - Thiết kế bảng đánh giá năng lực số theo **5 mức độ chuẩn**: 
      + Mức 1 (Nhận biết): Xem video, tìm kiếm thông tin cơ bản.
      + Mức 2 (Vận dụng): Sử dụng công cụ số cơ bản (máy tính, bảng tính).
      + Mức 3 (Phân tích): Khảo sát sự thay đổi, phân tích tính chất bằng phần mềm chuyên dụng (như **GeoGebra**).
      + Mức 4 (Mô hình hóa): Dùng công cụ số mô hình hóa bài toán thực tiễn.
      + Mức 5 (Sáng tạo/STEM): Thiết kế sản phẩm số sáng tạo, đề xuất ứng dụng mới.

    YÊU CẦU KỸ THUẬT BẮT BUỘC:
    - TRẢ VỀ JSON THUẦN (KHÔNG KÈM MARKDOWN).
    - Trường "appendix_table" PHẢI LÀ CHUỖI VĂN BẢN (STRING). Các tiêu chí và mức độ cách nhau bằng dấu xuống dòng (\\n). 
    - TUYỆT ĐỐI KHÔNG TRẢ VỀ MẢNG [] HOẶC ĐỐI TƯỢNG {} CHO TRƯỜNG "appendix_table".

    MẪU ĐỊNH DẠNG:
    {
      "objectives_addition": "Học sinh làm chủ **Công cụ AI** để...",
      "materials_addition": "Sử dụng phần mềm **GeoGebra**, **Gemini AI**...",
      "activities_integration": [{"anchor_text": "câu mốc trong giáo án", "content": "Sử dụng **AI Generator** để mô phỏng..."}],
      "appendix_table": "- Mức 1: Nhận diện **Parabol** qua video\\n- Mức 2: Tính giá trị bằng **Excel**\\n- Mức 3: Khảo sát đỉnh bằng **GeoGebra**\\n- Mức 4: Mô hình hóa quỹ đạo thực tế\\n- Mức 5: Sáng tạo mô hình STEM số"
    }
  `);

  const response = await result.response;
  const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
  
  // LOGIC SỬA LỖI split is not a function - BẢO VỆ DỮ LIỆU ĐẦU RA TUYỆT ĐỐI
  const parsed = JSON.parse(text);
  if (parsed.appendix_table && Array.isArray(parsed.appendix_table)) {
    parsed.appendix_table = parsed.appendix_table.join('\n');
  } else if (typeof parsed.appendix_table !== 'string') {
    parsed.appendix_table = String(parsed.appendix_table || "");
  }
  
  return parsed;
};