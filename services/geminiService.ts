import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  // Dùng model ổn định nhất
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

  const result = await model.generateContent(prompt + `
    ---------------------------------------------------
    YÊU CẦU ĐẶC BIỆT: THIẾT KẾ NLS GIỐNG HỆT MẪU (WORD STYLE)
    
    1. QUY ĐỊNH VỀ CÚ PHÁP (BẮT BUỘC):
       - Mọi nội dung đề xuất Năng Lực Số (NLS) đều phải bắt đầu bằng cụm từ: "👉 Tích hợp NLS:"
       - Văn phong phải trang trọng, chuẩn sư phạm Việt Nam (như file mẫu).

    2. CẤU TRÚC JSON TRẢ VỀ (Ứng với 4 phần trong giáo án):
       
       A. PHẦN MỤC TIÊU (objectives_addition):
          - Đề xuất 2-3 gạch đầu dòng về năng lực số.
          - Ví dụ: "👉 Tích hợp NLS: Sử dụng phần mềm GeoGebra để trực quan hóa..."
       
       B. PHẦN THIẾT BỊ & HỌC LIỆU (materials_addition):
          - Đề xuất công cụ cụ thể.
          - Ví dụ: "👉 Tích hợp NLS: Bộ câu hỏi trắc nghiệm trên Quizizz/Kahoot."
       
       C. PHẦN HOẠT ĐỘNG (activities_integration):
          - Rà soát từng hoạt động (1, 2, 3...) trong bài.
          - Với mỗi hoạt động, đề xuất cách dùng công nghệ tương ứng.
          - Định dạng: "👉 Tích hợp NLS: GV yêu cầu HS dùng điện thoại quét mã QR..."
       
       D. PHẦN PHỤ LỤC (appendix_table):
          - Các tiêu chí đánh giá.
          - Ví dụ: "👉 Tích hợp NLS: Tiêu chí 1: Thao tác thành thạo..."

    3. YÊU CẦU XỬ LÝ KHI KHÔNG TÌM THẤY HOẠT ĐỘNG:
       - Nếu giáo án sơ sài, hãy TỰ ĐỘNG ĐỀ XUẤT 3 hoạt động (Khởi động, Hình thành kiến thức, Luyện tập) và gắn NLS vào đó.

    LƯU Ý KỸ THUẬT: 
    - TRẢ VỀ JSON THUẦN (Raw JSON).
    - KHÔNG dùng Markdown (\`\`\`json).
  `);

  const response = await result.response;
  const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
  
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    console.error("Lỗi parse JSON:", text);
    return {
      objectives_addition: "👉 Tích hợp NLS: Hệ thống đang bận, vui lòng thử lại.",
      materials_addition: "👉 Tích hợp NLS: Máy tính, máy chiếu.",
      activities_integration: [],
      appendix_table: "..."
    };
  }

  // Chuẩn hóa dữ liệu
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