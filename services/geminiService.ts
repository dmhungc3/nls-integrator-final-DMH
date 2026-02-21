import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // SỬ DỤNG GEMINI 1.5 FLASH - BẢN ỔN ĐỊNH NHẤT, KHÔNG BỊ LỖI 404
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

  const result = await model.generateContent(prompt + `
    YÊU CẦU CHUYÊN SÂU VỀ MA TRẬN ĐÁNH GIÁ NLS & AI (PHỤ LỤC):
    1. CẤU TRÚC 5 MỨC ĐỘ CHUẨN SƯ PHẠM:
       - Mức 1 (Nhận biết): Sử dụng công cụ số cơ bản dưới sự hướng dẫn.
       - Mức 2 (Thông hiểu): Hiểu logic hoạt động của AI và các phần mềm chuyên dụng.
       - Mức 3 (Vận dụng): Tự thực hiện **Prompt Engineering** để giải quyết các bước trong bài học.
       - Mức 4 (Phân tích/Đánh giá): Biết phản biện kết quả của AI, nhận diện lỗi sai hoặc ảo giác của AI.
       - Mức 5 (Sáng tạo/STEM): Kết hợp đa công cụ số để tạo ra sản phẩm học tập hoàn chỉnh.
    2. CHI TIẾT THEO MÔN: Ma trận bám sát nội dung bài học.

    YÊU CẦU VỀ HOẠT ĐỘNG TÍCH HỢP CHI TIẾT (MICRO-ACTIVITIES LEVEL):
    - NHIỆM VỤ: Rà soát toàn bộ giáo án, tìm tất cả các mục "Hoạt động 1", "Hoạt động 2", "Hoạt động 3"... (hoặc các bước dạy học tương đương).
    - VỚI MỖI HOẠT ĐỘNG TÌM ĐƯỢC, PHẢI ĐỀ XUẤT CÔNG CỤ CỤ THỂ THEO MÔN:
       + Toán/Lý/Hóa: Bắt buộc dùng **GeoGebra / Desmos / PhET / Excel** để mô phỏng, tính toán.
       + Văn/Sử/Địa/GDCD: Dùng **AI Chatbot / Canva / Padlet / Mentimeter** để thảo luận, tạo nội dung.
       + Tin học: Dùng **IDE Online / AI Code Assistant**.
    
    - CẤU TRÚC NỘI DUNG TRẢ VỀ (BẮT BUỘC):
      "Sử dụng [Tên công cụ]. [Hướng dẫn thao tác cụ thể cho HS]. [Câu lệnh mẫu]: 'Nội dung câu lệnh Prompt' "

    LƯU Ý KỸ THUẬT QUAN TRỌNG: 
    - TRẢ VỀ JSON THUẦN, KHÔNG ĐƯỢC CÓ DẤU NHÁY CODE (\`\`\`json).
    - Trường "appendix_table" PHẢI LÀ MỘT CHUỖI VĂN BẢN (STRING), các dòng ngăn cách bằng \\n.
    - Các trường "objectives_addition" và "materials_addition" cũng phải là STRING.
  `);

  const response = await result.response;
  // Làm sạch dữ liệu để tránh lỗi Parse JSON
  const text = response.text()
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    console.error("Lỗi parse dữ liệu AI:", text);
    throw new Error("Dữ liệu AI trả về không đúng định dạng. Thầy hãy nhấn Tích hợp lại nhé!");
  }

  // Đảm bảo trường appendix_table luôn là chuỗi để không lỗi hàm split trong App.tsx
  if (parsed.appendix_table && Array.isArray(parsed.appendix_table)) {
    parsed.appendix_table = parsed.appendix_table.join('\n');
  } else if (typeof parsed.appendix_table !== 'string') {
    parsed.appendix_table = String(parsed.appendix_table || "");
  }

  // Đảm bảo cấu trúc activities_integration luôn đúng định dạng mảng
  if (!Array.isArray(parsed.activities_integration)) {
    parsed.activities_integration = [];
  }
  
  return parsed;
};