import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // SỬ DỤNG GEMINI 2.5 FLASH (BẢN STABLE)
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

  const result = await model.generateContent(prompt + `
    ---------------------------------------------------
    YÊU CẦU CHUYÊN SÂU: TÍCH HỢP NĂNG LỰC SỐ (NLS) CHI TIẾT
    
    1. NHIỆM VỤ RÀ SOÁT & ĐỀ XUẤT (QUAN TRỌNG):
       - Rà soát giáo án tìm các mục "Hoạt động...".
       - LƯU Ý ĐẶC BIỆT: Nếu giáo án viết tắt hoặc không phân chia rõ hoạt động, bạn KHÔNG ĐƯỢC TRẢ VỀ DANH SÁCH RỖNG.
       - Thay vào đó, hãy TỰ ĐỘNG ĐỀ XUẤT 3 hoạt động tiêu chuẩn dựa trên nội dung bài:
         + Hoạt động 1: Khởi động (Dùng Video/Game/Quizizz).
         + Hoạt động 2: Hình thành kiến thức (Dùng GeoGebra/AI/Phần mềm).
         + Hoạt động 3: Luyện tập/Vận dụng (Dùng Padlet/Canva).

    2. ĐỀ XUẤT CÔNG CỤ CỤ THỂ (THEO MÔN HỌC & ĐẶC THÙ 2026):
       - Toán/KHTN: Dùng **GeoGebra / Desmos / PhET Simulations**.
       - Văn/KHXH: Dùng **AI Chatbot (Gemini/ChatGPT) / Canva / Padlet**.
       - Tin học/Công nghệ: Dùng **IDE Online / Virtual Lab**.
       - Ngoại ngữ: Dùng **Elsa Speak / Duolingo / AI Roleplay**.

    3. CẤU TRÚC JSON BẮT BUỘC (Strict Format):
       - "anchor_text": Tên hoạt động gốc (hoặc ghi "Hoạt động đề xuất" nếu AI tự tạo).
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
    // FALLBACK: Trả về dữ liệu mẫu nếu AI bị lỗi để app không bị treo
    return {
      objectives_addition: "Hệ thống đang bận, thầy vui lòng thử lại sau giây lát.",
      materials_addition: "Máy tính, Máy chiếu, Mạng Internet.",
      activities_integration: [
        { 
            anchor_text: "Hoạt động Khởi động (AI Tự động tạo)", 
            content: "Sử dụng **Quizizz**. [Thao tác]: GV tổ chức trò chơi trắc nghiệm nhanh để kiểm tra bài cũ. [Câu lệnh mẫu]: 'Tạo 5 câu hỏi trắc nghiệm vui về chủ đề này'" 
        },
        { 
            anchor_text: "Hoạt động Hình thành kiến thức (AI Tự động tạo)", 
            content: "Sử dụng **Phần mềm Bộ môn/AI**. [Thao tác]: GV minh họa trực quan các khái niệm khó. HS quan sát và nhận xét." 
        }
      ],
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