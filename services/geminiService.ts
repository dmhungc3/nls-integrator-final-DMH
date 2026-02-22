import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json" } }); 

  try {
    const result = await model.generateContent(prompt + `
      YÊU CẦU: Đóng vai chuyên gia GDPT 2018. Trả về JSON:
      1. objectives_addition: Liệt kê 3 năng lực số đặc thù (Sử dụng phần mềm gì? Khai thác nguồn nào?).
      2. activities_integration: Tìm hoạt động trong bài, chèn cách dùng công nghệ (GeoGebra, Quizizz, Padlet...).
      3. materials_addition: Thiết bị số cần dùng.
      4. appendix_table: Tiêu chí đánh giá học sinh.
    `);
    const parsed = JSON.parse(result.response.text().trim().match(/\{[\s\S]*\}/)?.[0] || "{}");
    return {
      objectives_addition: parsed.objectives_addition || "👉 [NLS]: Bổ sung năng lực công nghệ.",
      materials_addition: parsed.materials_addition || "👉 [NLS]: Máy tính, PM dạy học.",
      appendix_table: parsed.appendix_table || "Tiêu chí đánh giá.",
      activities_integration: parsed.activities_integration || []
    };
  } catch (e) { return { objectives_addition: "Lỗi AI", materials_addition: "", appendix_table: "", activities_integration: [] }; }
};