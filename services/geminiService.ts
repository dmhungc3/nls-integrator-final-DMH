import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  }); 

  try {
    const result = await model.generateContent(prompt + `
      ---------------------------------------------------
      HÃY ĐÓNG VAI CHUYÊN GIA GIÁO DỤC 4.0 TẠI VIỆT NAM.
      NHIỆM VỤ: Tích hợp NLS vào giáo án bám sát GDPT 2018.
      
      YÊU CẦU CỨNG:
      1. Nội dung NLS phải bắt đầu bằng: "👉 Tích hợp NLS:"
      2. Môn Toán phải dùng GeoGebra/Desmos. Môn Lý dùng PhET. Môn Văn dùng AI/Canva.
      3. ĐẦU RA LÀ JSON THUẦN TÚY (Raw JSON).
      4. KHÔNG ĐƯỢC ĐỂ TRỐNG activities_integration.
    `);

    const response = await result.response;
    let text = response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];

    const parsed = JSON.parse(text);

    // KIỂM TRA DỮ LIỆU ĐỂ CHỐNG TRẮNG TRANG
    return {
      objectives_addition: parsed.objectives_addition || "👉 Tích hợp NLS: Phát triển năng lực khai thác và sử dụng các công cụ công nghệ thông tin trong học tập.",
      materials_addition: parsed.materials_addition || "👉 Tích hợp NLS: Sử dụng các phần mềm chuyên dụng và nền tảng học liệu số trực tuyến.",
      appendix_table: parsed.appendix_table || "👉 Tích hợp NLS: Tiêu chí 1: Sử dụng thành thạo phần mềm; Tiêu chí 2: Khai thác học liệu số an toàn.",
      activities_integration: (parsed.activities_integration && parsed.activities_integration.length > 0) 
        ? parsed.activities_integration 
        : [
            { anchor_text: "Hoạt động chung", content: "👉 Tích hợp NLS: Giáo viên sử dụng video minh họa trực quan và tổ chức thảo luận trên bảng trắng số." },
            { anchor_text: "Củng cố kiến thức", content: "👉 Tích hợp NLS: Học sinh thực hiện bài kiểm tra nhanh trên Quizizz để nhận phản hồi tức thì." }
          ]
    };
  } catch (error) {
    console.error("Lỗi AI:", error);
    // Fallback an toàn tuyệt đối
    return {
      objectives_addition: "👉 Tích hợp NLS: Ứng dụng công nghệ số vào bài học.",
      materials_addition: "👉 Tích hợp NLS: Máy tính và internet.",
      activities_integration: [{ anchor_text: "Hoạt động chung", content: "👉 Tích hợp NLS: Sử dụng các công cụ học tập tương tác." }],
      appendix_table: "👉 Tích hợp NLS: Đánh giá kỹ năng số."
    };
  }
};