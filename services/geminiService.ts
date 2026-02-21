import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  // SỬ DỤNG GEMINI 3 FLASH - MODEL MỚI NHẤT 2026 (MIỄN PHÍ & TỐC ĐỘ CAO)
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }); 

  const result = await model.generateContent(prompt + `
    YÊU CẦU NÂNG CAO VỀ XU THẾ NĂNG LỰC SỐ (NLS) & AI LITERACY 2026:
    1. TÍCH HỢP AI CHUYÊN SÂU: Gợi ý sử dụng **AI Generator** (Gemini, ChatGPT, GeoGebra AI) để học sinh đối chiếu kết quả, tối ưu hóa bài toán và thực hiện **Prompt Engineering** cơ bản.
    2. TÍNH THỰC TIỄN & STEM: Gắn liền với các dự án thực tế (ví dụ: mô phỏng 3D quĩ đạo **Parabol**, khảo sát hướng **Vectơ** bằng dữ liệu số thực tế).
    3. TƯ DUY PHÊ PHÁN SỐ: Học sinh phải biết đánh giá độ tin cậy của dữ liệu AI (nhận diện ảo giác AI) và tuân thủ đạo đức khi sử dụng trí tuệ nhân tạo.
    4. TRÌNH BÀY CHUYÊN NGHIỆP: Tự động **IN ĐẬM** các công cụ số và năng lực quan trọng.

    YÊU CẦU CẤU TRÚC ĐỂ PHẦN MỀM TỰ CHÈN:
    - objectives_addition: Viết dưới dạng các gạch đầu dòng chuyên nghiệp để chèn trực tiếp vào mục "I.2. Về năng lực". Phải bao gồm cả Năng lực số và Năng lực AI.
    - materials_addition: Liệt kê các thiết bị/phần mềm số chuyên sâu (máy tính, mã QR, nền tảng AI) để chèn vào mục "II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU".
    - activities_integration: Chọn các câu mốc như "HOẠT ĐỘNG 1", "HOẠT ĐỘNG 2" để lồng ghép các nhiệm vụ liên quan đến công nghệ.
    - appendix_table: Thiết kế bảng đánh giá năng lực số/AI theo đúng **5 mức độ chuẩn** sư phạm hiện đại nhất.

    YÊU CẦU KỸ THUẬT QUAN TRỌNG ĐỂ TRÁNH LỖI:
    - TRẢ VỀ JSON THUẦN (KHÔNG KÈM MARKDOWN).
    - Trường "appendix_table" PHẢI LÀ MỘT CHUỖI VĂN BẢN (STRING). Các mức độ cách nhau bằng dấu xuống dòng (\\n). 
    - TUYỆT ĐỐI KHÔNG TRẢ VỀ MẢNG [] CHO TRƯỜNG "appendix_table".

    MẪU JSON TRẢ VỀ CHUẨN:
    {
      "objectives_addition": "- NLS: Học sinh làm chủ **Công cụ AI** để...\\n- AI Literacy: Có khả năng đặt câu hỏi (**Prompt**) cho trợ lý ảo...",
      "materials_addition": "- Học liệu số: File Word tích hợp, mã **QR Code** truy cập bài giảng\\n- Phần mềm: **GeoGebra**, **Gemini AI**, **Desmos**...",
      "activities_integration": [{"anchor_text": "HOẠT ĐỘNG 1", "content": "Học sinh sử dụng **AI Generator** để khám phá các tình huống..."}],
      "appendix_table": "- Mức 1: Nhận diện kiến thức qua **Video/Hình ảnh số**\\n- Mức 2: Tính toán và kiểm tra bằng **Excel/Máy tính**\\n- Mức 3: Khảo sát thực tế bằng **GeoGebra/AI**\\n- Mức 4: Mô hình hóa vấn đề bằng **Công cụ số**\\n- Mức 5: Sáng tạo và giải quyết vấn đề bằng **Hệ sinh thái AI**"
    }
  `);

  const response = await result.response;
  const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
  
  // LOGIC SỬA LỖI split is not a function - ĐẢM BẢO DỮ LIỆU LUÔN CHUẨN
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    // Trường hợp AI trả về text không chuẩn JSON, thực hiện fallback
    console.error("Lỗi parse JSON:", e);
    throw new Error("Dữ liệu AI không đúng định dạng. Vui lòng thử lại.");
  }

  if (parsed.appendix_table && Array.isArray(parsed.appendix_table)) {
    parsed.appendix_table = parsed.appendix_table.join('\n');
  } else if (typeof parsed.appendix_table !== 'string') {
    parsed.appendix_table = String(parsed.appendix_table || "");
  }
  
  return parsed;
};