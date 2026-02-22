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
      NHIỆM VỤ: Chuyên gia GDPT 2018 - Tích hợp Năng lực số (NLS).
      
      YÊU CẦU CỤ THỂ CHO TỪNG PHẦN (JSON OUTPUT ONLY):

      1. "objectives_addition" (QUAN TRỌNG - CHÈN VÀO PHẦN 2. NĂNG LỰC):
         - Hãy liệt kê cụ thể 2-3 năng lực số đặc thù cho môn học này.
         - Cấu trúc bắt buộc:
           "+ Năng lực sử dụng [Tên phần mềm/Thiết bị] để [Mục đích cụ thể trong bài].
            + Năng lực khai thác học liệu số trên [Nguồn] để [Mục đích].
            + Năng lực hợp tác trên không gian mạng qua [Công cụ]."

      2. "activities_integration" (CHÈN VÀO HOẠT ĐỘNG):
         - Tìm các hoạt động trong bài, chèn cách dùng công nghệ vào đó.
         - Ví dụ: "GV yêu cầu HS dùng Padlet để thảo luận...", "HS dùng GeoGebra vẽ đồ thị..."

      3. "materials_addition": Liệt kê phần mềm, thiết bị số cụ thể (Máy chiếu, PM trắc nghiệm...).
      4. "appendix_table": Tiêu chí đánh giá kỹ năng công nghệ của HS.
    `);

    const response = await result.response;
    let text = response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];

    const parsed = JSON.parse(text);

    return {
      objectives_addition: parsed.objectives_addition || "👉 [TÍCH HỢP NLS]: Phát triển năng lực sử dụng công nghệ đặc thù.",
      materials_addition: parsed.materials_addition || "👉 [TÍCH HỢP NLS]: Máy tính, máy chiếu, phần mềm dạy học.",
      appendix_table: parsed.appendix_table || "Tiêu chí đánh giá NLS.",
      activities_integration: (parsed.activities_integration && parsed.activities_integration.length > 0) 
        ? parsed.activities_integration 
        : [{ anchor_text: "Hoạt động chung", content: "👉 [TÍCH HỢP NLS]: Sử dụng công cụ số hỗ trợ giảng dạy." }]
    };
  } catch (error) {
    console.error("Lỗi AI:", error);
    // Fallback an toàn
    return {
      objectives_addition: "👉 [TÍCH HỢP NLS]: Ứng dụng CNTT trong giải quyết vấn đề.",
      materials_addition: "👉 [TÍCH HỢP NLS]: Học liệu số đa phương tiện.",
      activities_integration: [{ anchor_text: "Hoạt động", content: "👉 [TÍCH HỢP NLS]: GV sử dụng bài giảng điện tử." }],
      appendix_table: "Đánh giá kỹ năng sử dụng phần mềm."
    };
  }
};