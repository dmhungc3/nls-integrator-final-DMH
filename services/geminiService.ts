import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, userApiKey: string): Promise<GeneratedNLSContent> => {
  
  if (!userApiKey || userApiKey.trim() === "") {
    throw new Error("API Key chưa được cung cấp từ giao diện.");
  }

  const genAI = new GoogleGenerativeAI(userApiKey);

  try {
    // --- CẤU HÌNH NĂM 2026 ---
    // Model 1.5 đã bị xóa (Lỗi 404).
    // Sử dụng gemini-2.0-flash là bản chuẩn cho Free Tier hiện tại.
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash', 
      generationConfig: {
        temperature: 0.5,
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (text) {
      return parseStructuredResponse(text);
    } else {
      throw new Error("Không nhận được phản hồi văn bản từ Gemini.");
    }

  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    
    // Xử lý các lỗi đặc thù năm 2026
    if (error.message?.includes("API key expired")) {
        throw new Error("Key cũ đã hết hạn. Vui lòng vào Google AI Studio tạo Key mới.");
    }
    if (error.message?.includes("404") || error.message?.includes("not found")) {
        throw new Error("Model cũ không còn hỗ trợ. Đã chuyển sang gemini-2.0-flash.");
    }
    if (error.message?.includes("429")) {
        throw new Error("Vượt quá hạn mức. Hãy chắc chắn bạn đã dùng API Key MỚI TẠO.");
    }
    
    throw new Error(`Lỗi Gemini API: ${error.message || error}`);
  }
};

// ... (Giữ nguyên hàm parseStructuredResponse ở dưới cùng file) ...
function parseStructuredResponse(text: string): GeneratedNLSContent {
  const result: GeneratedNLSContent = {
    objectives_addition: "",
    materials_addition: "",
    activities_integration: [],
    appendix_table: ""
  };
  
  // Logic parse cũ giữ nguyên
  const objectivesMatch = text.match(/===BAT_DAU_MUC_TIEU===([\s\S]*?)===KET_THUC_MUC_TIEU===/);
  if (objectivesMatch && objectivesMatch[1]) result.objectives_addition = objectivesMatch[1].trim();

  const materialsMatch = text.match(/===BAT_DAU_HOC_LIEU===([\s\S]*?)===KET_THUC_HOC_LIEU===/);
  if (materialsMatch && materialsMatch[1]) result.materials_addition = materialsMatch[1].trim();

  const appendixMatch = text.match(/===BAT_DAU_PHU_LUC===([\s\S]*?)===KET_THUC_PHU_LUC===/);
  if (appendixMatch && appendixMatch[1]) result.appendix_table = appendixMatch[1].trim();

  const activitiesBlockMatch = text.match(/===BAT_DAU_HOAT_DONG===([\s\S]*?)===KET_THUC_HOAT_DONG===/);
  if (activitiesBlockMatch && activitiesBlockMatch[1]) {
    const rawActivities = activitiesBlockMatch[1].split('---PHAN_CACH_HOAT_DONG---');
    rawActivities.forEach(block => {
      const anchorMatch = block.match(/ANCHOR:\s*([\s\S]*?)(?=CONTENT:|$)/);
      const contentMatch = block.match(/CONTENT:\s*([\s\S]*?)$/);
      if (anchorMatch && anchorMatch[1] && contentMatch && contentMatch[1]) {
        result.activities_integration.push({
          anchor_text: anchorMatch[1].trim(),
          content: contentMatch[1].trim()
        });
      }
    });
  }
  return result;
}