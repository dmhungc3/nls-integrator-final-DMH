import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // SỬ DỤNG GEMINI 1.5 FLASH (BẢN ỔN ĐỊNH NHẤT - KHÔNG BỊ LỖI KẾT NỐI)
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" } // Ép buộc trả về JSON
  }); 

  try {
    const result = await model.generateContent(prompt + `
      ---------------------------------------------------
      NHIỆM VỤ: Đóng vai Chuyên gia Giáo dục 4.0, tích hợp Năng lực số (NLS) vào giáo án.
      
      YÊU CẦU ĐẦU RA (JSON FORMAT ONLY):
      {
        "objectives_addition": "👉 Tích hợp NLS: [Nội dung mục tiêu số]",
        "materials_addition": "👉 Tích hợp NLS: [Các phần mềm/thiết bị]",
        "activities_integration": [
          {
            "anchor_text": "[Tên hoạt động trong bài]", 
            "content": "👉 Tích hợp NLS: [Cách dùng công nghệ cụ thể cho hoạt động này]"
          }
        ],
        "appendix_table": "👉 Tích hợp NLS: [Tiêu chí đánh giá]"
      }

      LƯU Ý QUAN TRỌNG:
      1. Nếu không tìm thấy tên hoạt động cụ thể, HÃY TỰ ĐỀ XUẤT 3 hoạt động (Khởi động, Khám phá, Luyện tập).
      2. Nội dung phải thực tế, phù hợp GDPT 2018 (dùng GeoGebra, Padlet, Quizizz, AI...).
      3. KHÔNG được trả về mảng rỗng.
    `);

    const response = await result.response;
    let text = response.text();

    // --- THUẬT TOÁN LÀM SẠCH JSON (QUAN TRỌNG) ---
    // 1. Xóa Markdown ```json ... ```
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // 2. Dùng Regex để chỉ lấy phần nằm trong dấu ngoặc nhọn {} (Bỏ qua lời dẫn thừa)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      console.error("Lỗi cấu trúc JSON:", text);
      throw new Error("AI trả về dữ liệu không đúng định dạng.");
    }

    // --- KIỂM TRA & SỬA LỖI DỮ LIỆU RỖNG ---
    const defaultActivities = [
      { anchor_text: "Hoạt động Khởi động", content: "👉 Tích hợp NLS: Sử dụng Quizizz/Kahoot để kiểm tra kiến thức nền." },
      { anchor_text: "Hoạt động Hình thành kiến thức", content: "👉 Tích hợp NLS: Sử dụng phần mềm mô phỏng (GeoGebra/PhET) để trực quan hóa bài học." },
      { anchor_text: "Hoạt động Luyện tập", content: "👉 Tích hợp NLS: HS làm bài tập trên Padlet/Azota để nhận phản hồi ngay." }
    ];

    return {
      objectives_addition: parsed.objectives_addition || "👉 Tích hợp NLS: Phát triển năng lực sử dụng công nghệ trong giải quyết vấn đề.",
      materials_addition: parsed.materials_addition || "👉 Tích hợp NLS: Máy tính, máy chiếu, mạng Internet.",
      appendix_table: Array.isArray(parsed.appendix_table) ? parsed.appendix_table.join('\n') : (parsed.appendix_table || "👉 Tích hợp NLS: Tiêu chí đánh giá đang cập nhật."),
      // Nếu không có hoạt động nào, dùng danh sách mẫu
      activities_integration: (Array.isArray(parsed.activities_integration) && parsed.activities_integration.length > 0) 
        ? parsed.activities_integration 
        : defaultActivities
    };

  } catch (error) {
    console.error("Lỗi xử lý AI:", error);
    // FALLBACK CUỐI CÙNG: Đảm bảo không bao giờ hiện màn hình trắng
    return {
      objectives_addition: "👉 Tích hợp NLS: Đã cập nhật theo chuẩn GDPT 2018.",
      materials_addition: "👉 Tích hợp NLS: Các phần mềm dạy học thông dụng.",
      activities_integration: [
        { anchor_text: "Hoạt động chung (Tự động)", content: "👉 Tích hợp NLS: GV sử dụng bài giảng điện tử và các video minh họa." }
      ],
      appendix_table: "👉 Tích hợp NLS: Đánh giá kỹ năng sử dụng công nghệ."
    };
  }
};