import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // SỬ DỤNG GEMINI 2.5 FLASH (BẢN STABLE - RA MẮT 6/2025)
  // Đây là bản ổn định nhất hiện nay, cân bằng hoàn hảo giữa tốc độ và trí tuệ.
  // Không bị lỗi 404 như bản 3 Preview.
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

  const result = await model.generateContent(prompt + `
    ---------------------------------------------------
    YÊU CẦU CHUYÊN SÂU: TÍCH HỢP NĂNG LỰC SỐ (NLS) CHI TIẾT THEO TỪNG HOẠT ĐỘNG
    
    1. NHIỆM VỤ RÀ SOÁT TOÀN DIỆN:
       - Đọc kỹ toàn bộ giáo án.
       - Tìm chính xác các mục: "Hoạt động 1", "Hoạt động 2", "Hoạt động 3", "Hoạt động Khởi động", "Hoạt động Luyện tập"...
       - KHÔNG ĐƯỢC BỎ SÓT bất kỳ hoạt động nào.

    2. ĐỀ XUẤT CÔNG CỤ CỤ THỂ (THEO MÔN HỌC & ĐẶC THÙ 2026):
       - Toán/KHTN: Dùng **GeoGebra / Desmos / PhET Simulations**.
       - Văn/KHXH: Dùng **AI Chatbot (Gemini/ChatGPT) / Canva / Padlet**.
       - Tin học/Công nghệ: Dùng **IDE Online / Virtual Lab**.
       - Ngoại ngữ: Dùng **Elsa Speak / Duolingo / AI Roleplay**.

    3. CẤU TRÚC JSON BẮT BUỘC (Strict Format):
       - "anchor_text": Tên hoạt động gốc trong giáo án (VD: "HOẠT ĐỘNG 1: KHÁM PHÁ...").
       - "content": Phải có đủ 3 phần:
         (1) **[Công cụ]**: Tên phần mềm/App.
         (2) **[Thao tác]**: Hướng dẫn HS/GV làm gì trên máy.
         (3) **[Câu lệnh mẫu]**: Gợi ý Prompt để HS hỏi AI (nếu cần).

    VÍ DỤ OUTPUT:
    {
      "anchor_text": "Hoạt động 2: Hình thành kiến thức",
      "content": "Sử dụng **GeoGebra 3D**. [Thao tác]: GV yêu cầu HS quét mã QR để mở mô hình không gian, xoay hình để quan sát góc nhị diện. [Câu lệnh mẫu]: 'Giải thích khái niệm góc nhị diện bằng ngôn ngữ đơn giản?'"
    }

    LƯU Ý KỸ THUẬT: 
    - TRẢ VỀ JSON THUẦN TÚY (Raw JSON).
    - KHÔNG dùng Markdown (\`\`\`json).
    - Trường "appendix_table" là chuỗi văn bản (String), xuống dòng bằng \\n.
  `);

  const response = await result.response;
  const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
  
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    console.error("Lỗi parse JSON:", text);
    return {
      objectives_addition: "Hệ thống đang bận, thầy vui lòng thử lại sau giây lát.",
      materials_addition: "...",
      activities_integration: [{ anchor_text: "Lỗi kết nối", content: "Vui lòng kiểm tra lại đường truyền." }],
      appendix_table: "..."
    };
  }

  // Đảm bảo an toàn dữ liệu
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