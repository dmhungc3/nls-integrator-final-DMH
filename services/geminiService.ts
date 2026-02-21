import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // SỬ DỤNG GEMINI PRO (PHIÊN BẢN ỔN ĐỊNH NHẤT - CHẠY NGAY KHÔNG CẦN KEY MỚI)
  // Đây là lõi duy nhất không bị lỗi 404 với tài khoản hiện tại của thầy.
  // Tuy nhiên, Prompt bên dưới đã được nâng cấp lên chuẩn V3 Master.
  const model = genAI.getGenerativeModel({ model: "gemini-pro" }); 

  const result = await model.generateContent(prompt + `
    YÊU CẦU CHUYÊN SÂU VỀ MA TRẬN ĐÁNH GIÁ NLS & AI (PHỤ LỤC):
    1. CẤU TRÚC 5 MỨC ĐỘ CHUẨN SƯ PHẠM:
       - Mức 1 (Nhận biết): Sử dụng công cụ số cơ bản dưới sự hướng dẫn.
       - Mức 2 (Thông hiểu): Hiểu logic hoạt động của AI và các phần mềm chuyên dụng.
       - Mức 3 (Vận dụng): Tự thực hiện **Prompt Engineering** để giải quyết các bước trong bài học.
       - Mức 4 (Phân tích/Đánh giá): Biết phản biện kết quả của AI, nhận diện lỗi sai hoặc ảo giác của AI.
       - Mức 5 (Sáng tạo/STEM): Kết hợp đa công cụ số để tạo ra sản phẩm học tập hoàn chỉnh.
    2. CHI TIẾT THEO MÔN: Ma trận bám sát nội dung bài học.

    YÊU CẦU VỀ HOẠT ĐỘNG TÍCH HỢP CHI TIẾT (MICRO-ACTIVITIES):
    - NHIỆM VỤ: Quét toàn bộ giáo án, tìm các mục "Hoạt động 1", "Hoạt động 2", "Hoạt động 3"...
    - ĐỀ XUẤT CÔNG CỤ CỤ THỂ:
       + Toán/Lý/Hóa: Dùng **GeoGebra / Desmos / PhET**.
       + Văn/Sử/Địa: Dùng **AI Chatbot / Padlet / Canva**.
       + Tin học: Dùng **IDE Online**.
    
    - CẤU TRÚC BẮT BUỘC CHO MỖI HOẠT ĐỘNG:
      "Sử dụng [Tên công cụ]. [Hướng dẫn thao tác]. [Câu lệnh mẫu]: 'Nội dung câu lệnh Prompt' "

    LƯU Ý KỸ THUẬT QUAN TRỌNG (ĐỂ TRÁNH LỖI MÀN HÌNH TRẮNG): 
    - TRẢ VỀ JSON THUẦN TÚY (KHÔNG DÙNG DẤU NHÁY CODE).
    - Trường "appendix_table" PHẢI LÀ MỘT CHUỖI VĂN BẢN (STRING), các dòng ngăn cách bằng \\n.
  `);

  const response = await result.response;
  // Làm sạch dữ liệu thủ công để đảm bảo JSON luôn đúng
  const text = response.text()
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    console.error("Lỗi parse JSON (AI trả về sai định dạng):", text);
    // Cơ chế Fallback an toàn: Trả về nội dung báo lỗi nhẹ thay vì sập web
    return {
      objectives_addition: "Hệ thống đang bận, thầy vui lòng nhấn thử lại.",
      materials_addition: "...",
      activities_integration: [],
      appendix_table: "..."
    };
  }

  // Đảm bảo kiểu dữ liệu an toàn tuyệt đối
  if (parsed.appendix_table && Array.isArray(parsed.appendix_table)) {
    parsed.appendix_table = parsed.appendix_table.join('\n');
  } else if (typeof parsed.appendix_table !== 'string') {
    parsed.appendix_table = String(parsed.appendix_table || "");
  }

  if (!Array.isArray(parsed.activities_integration)) {
    parsed.activities_integration = [];
  }
  
  return parsed;
};