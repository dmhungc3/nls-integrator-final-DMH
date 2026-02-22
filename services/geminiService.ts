import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  // Dùng Gemini 1.5 Flash ổn định và nhanh nhất
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  }); 

  const result = await model.generateContent(prompt + `
    ---------------------------------------------------
    NHIỆM VỤ: Chuyên gia Giáo dục 4.0 tích hợp Năng lực số (NLS) bám sát GDPT 2018.
    
    YÊU CẦU BẮT BUỘC:
    1. Mọi nội dung NLS phải bắt đầu bằng: "👉 Tích hợp NLS:"
    2. Nếu giáo án không chia rõ hoạt động, TỰ ĐỀ XUẤT: Khởi động, Khám phá, Luyện tập.
    3. Đề xuất công cụ phù hợp môn: Toán (GeoGebra), Văn (AI Chatbot), Lý/Hóa (PhET)...
    4. Trả về JSON thuần túy, không được để trống bất kỳ mục nào.
  `);

  const response = await result.response;
  let text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) text = jsonMatch[0];

  const parsed = JSON.parse(text);
  return {
    objectives_addition: parsed.objectives_addition || "👉 Tích hợp NLS: Phát triển năng lực số.",
    materials_addition: parsed.materials_addition || "👉 Tích hợp NLS: Học liệu số tương tác.",
    activities_integration: parsed.activities_integration || [{ anchor_text: "Hoạt động chung", content: "👉 Tích hợp NLS: Sử dụng AI hỗ trợ học tập." }],
    appendix_table: parsed.appendix_table || "👉 Tích hợp NLS: Tiêu chí đánh giá kỹ năng số."
  };
};