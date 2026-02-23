import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (
  prompt: string,
  apiKey: string
): Promise<GeneratedNLSContent> => {
  if (!apiKey) throw new Error("API Key không tồn tại");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Sử dụng model flash chuẩn (không có chữ 'models/')
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json", // Bắt buộc AI trả về JSON
        temperature: 0.7,
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Hàm làm sạch chuỗi JSON (đề phòng AI trả về Markdown ```json ... ```)
    const cleanJson = (str: string) => {
      let cleaned = str.replace(/```json/g, "").replace(/```/g, "").trim();
      return cleaned;
    };

    const jsonString = cleanJson(text);
    const parsedData = JSON.parse(jsonString);

    // --- CHUẨN HÓA DỮ LIỆU ĐỂ KHỚP VỚI TYPES.TS ---
    // Đây là bước quan trọng để sửa lỗi "Property is missing"
    
    const finalContent: GeneratedNLSContent = {
      objectives_addition: parsedData.objectives_addition || "",
      materials_addition: parsedData.materials_addition || "",
      
      // Kiểm tra và map dữ liệu vào trường mới activities_enhancement
      activities_enhancement: Array.isArray(parsedData.activities_enhancement) 
        ? parsedData.activities_enhancement 
        : [], // Nếu AI không trả về mảng thì để mảng rỗng để tránh lỗi

      // Giữ lại các trường cũ nếu có (để debug)
      activities_integration: parsedData.activities_integration,
      appendix_table: parsedData.appendix_table
    };

    return finalContent;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Không thể kết nối với AI hoặc cấu trúc dữ liệu trả về bị lỗi.");
  }
};