import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  // Sử dụng model Flash cho tốc độ nhanh và chính xác
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" } 
  }); 

  try {
    const result = await model.generateContent(prompt + `
      ---------------------------------------------------
      VAI TRÒ: Chuyên gia Công nghệ Giáo dục (EdTech) am hiểu GDPT 2018.
      NHIỆM VỤ: Tích hợp Năng lực số (NLS) vào giáo án.
      
      HÃY TRẢ VỀ JSON VỚI CÁC TRƯỜNG SAU (Nội dung tiếng Việt):

      1. "objectives_addition" (Chèn vào phần Năng lực):
         - Viết 2-3 gạch đầu dòng về năng lực số cụ thể.
         - VD: "Sử dụng phần mềm [Tên] để mô phỏng...", "Khai thác học liệu trên [Nguồn]..."

      2. "materials_addition" (Chèn vào phần Thiết bị):
         - Liệt kê cụ thể: "Máy chiếu, Phần mềm GeoGebra/Desmos, Padlet, Quizizz..."

      3. "activities_integration" (Danh sách các hoạt động):
         - Tìm các mục như "Hoạt động 1", "Hoạt động 2", "Luyện tập".
         - Với mỗi mục, viết nội dung: "GV yêu cầu HS dùng [Công cụ] để [Làm gì]..."
         - Cấu trúc: { "anchor_text": "Tên hoạt động trong bài", "content": "Nội dung tích hợp NLS..." }

      4. "appendix_table" (Phụ lục):
         - Viết 3-4 tiêu chí đánh giá kỹ năng số của học sinh trong bài này.
    `);

    const response = await result.response;
    let text = response.text().trim();
    // Lọc lấy phần JSON chuẩn
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];

    const parsed = JSON.parse(text);

    return {
      objectives_addition: parsed.objectives_addition || "Sử dụng công cụ dạy học số.",
      materials_addition: parsed.materials_addition || "Máy tính, máy chiếu.",
      appendix_table: parsed.appendix_table || "Đánh giá kỹ năng công nghệ.",
      activities_integration: parsed.activities_integration || []
    };
  } catch (error) {
    console.error("Lỗi AI:", error);
    return {
      objectives_addition: "Lỗi kết nối AI.",
      materials_addition: "",
      appendix_table: "",
      activities_integration: []
    };
  }
};