import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  // SỬ DỤNG GEMINI 3 FLASH - MODEL MỚI NHẤT 2026 CHO TỐC ĐỘ VÀ ĐỘ CHÍNH XÁC CAO
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }); 

  const result = await model.generateContent(prompt + `
    YÊU CẦU CHUYÊN SÂU VỀ MA TRẬN ĐÁNH GIÁ NLS & AI (PHỤ LỤC):
    1. CẤU TRÚC 5 MỨC ĐỘ CHUẨN SƯ PHẠM:
       - Mức 1 (Nhận biết): Sử dụng công cụ số cơ bản dưới sự hướng dẫn.
       - Mức 2 (Thông hiểu): Hiểu logic hoạt động của AI và các phần mềm chuyên dụng.
       - Mức 3 (Vận dụng): Tự thực hiện **Prompt Engineering** để giải quyết các bước trong bài học.
       - Mức 4 (Phân tích/Đánh giá): Biết phản biện kết quả của AI, nhận diện lỗi sai hoặc ảo giác của AI.
       - Mức 5 (Sáng tạo/STEM): Kết hợp đa công cụ số để tạo ra sản phẩm học tập hoàn chỉnh.
    2. CHI TIẾT THEO MÔN: Ma trận bám sát nội dung bài học.

    YÊU CẦU VỀ HOẠT ĐỘNG TÍCH HỢP & PROMPT MẪU (CỰC KỲ CỤ THỂ):
    - Mỗi hoạt động PHẢI bao gồm nội dung: "Học sinh dùng điện thoại quét **mã QR**", "Dùng **GeoGebra** để mô phỏng".
    - ĐẶC BIỆT: Phải có mục [Câu lệnh mẫu] dành riêng cho học sinh.
    - Ví dụ format: "Nội dung hoạt động... [Câu lệnh mẫu]: 'Hãy đóng vai chuyên gia, giải thích cho em về...'"

    LƯU Ý KỸ THUẬT: TRẢ VỀ JSON THUẦN. Trường appendix_table là chuỗi văn bản, các dòng ngăn cách bằng \\n.
  `);

  const response = await result.response;
  const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
  
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error("Dữ liệu AI gặp sự cố. Thầy hãy thử lại nhé!");
  }

  // Đảm bảo dữ liệu bảng luôn là chuỗi văn bản để không lỗi hàm split trong App.tsx
  if (parsed.appendix_table && Array.isArray(parsed.appendix_table)) {
    parsed.appendix_table = parsed.appendix_table.join('\n');
  } else if (typeof parsed.appendix_table !== 'string') {
    parsed.appendix_table = String(parsed.appendix_table || "");
  }
  
  return parsed;
};