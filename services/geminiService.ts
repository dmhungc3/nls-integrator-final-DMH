import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (
  prompt: string, 
  apiKey: string, 
  trend: string = 'none', 
  level: string = 'basic'
): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  // Sử dụng model Flash cho tốc độ nhanh
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash-001",
    generationConfig: { responseMimeType: "application/json" } 
  }); 

  // Xây dựng hướng dẫn bổ sung cho AI dựa trên cấu hình Trend/Level
  let trendGuide = "";
  if (trend === 'ai') trendGuide = "Tích hợp công cụ Trí tuệ nhân tạo (ChatGPT, Gemini, Canva AI...) để hỗ trợ học sinh.";
  else if (trend === 'stem') trendGuide = "Tích hợp hoạt động trải nghiệm STEM, liên môn.";
  else if (trend === 'robotics') trendGuide = "Tích hợp tư duy lập trình và điều khiển robot/mô phỏng.";
  else if (trend === 'design') trendGuide = "Tích hợp thiết kế đồ họa, infographic, video.";

  let levelGuide = "";
  if (level === 'basic') levelGuide = "Mức độ CƠ BẢN: Học sinh sử dụng phần mềm có sẵn, tra cứu thông tin, làm bài tập online.";
  else levelGuide = "Mức độ NÂNG CAO: Học sinh tự tạo sản phẩm số, lập trình, giải quyết vấn đề phức tạp, làm việc cộng tác sâu.";

  try {
    const result = await model.generateContent(prompt + `
      ---------------------------------------------------
      CẤU HÌNH BỔ SUNG (NẾU CÓ):
      - Xu hướng công nghệ: ${trendGuide}
      - Cấp độ yêu cầu: ${levelGuide}
      
      YÊU CẦU ĐẦU RA: Trả về JSON chuẩn (không Markdown) với các trường:
      1. "objectives_addition": Liệt kê 3 năng lực số đặc thù môn học phù hợp với cấp độ và xu hướng trên.
      2. "activities_integration": Tìm các hoạt động chính, chèn cách dùng công nghệ tương ứng.
      3. "materials_addition": Thiết bị/Học liệu số.
      4. "appendix_table": Tiêu chí đánh giá.
    `);
    
    let text = result.response.text().trim();
    
    // Xử lý làm sạch chuỗi JSON (Tránh lỗi nếu AI thêm dấu ```json)
    if (text.startsWith("```json")) text = text.replace(/^```json/, "").replace(/```$/, "");
    if (text.startsWith("```")) text = text.replace(/^```/, "").replace(/```$/, "");
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : "{}");

    return {
      objectives_addition: parsed.objectives_addition || "👉 [NLS]: Bổ sung năng lực công nghệ.",
      materials_addition: parsed.materials_addition || "👉 [NLS]: Máy tính, PM dạy học.",
      appendix_table: parsed.appendix_table || "Tiêu chí đánh giá.",
      activities_integration: parsed.activities_integration || []
    };
  } catch (e) { 
    console.error("Lỗi AI:", e);
    return { 
      objectives_addition: "Lỗi kết nối AI hoặc hết hạn ngạch.", 
      materials_addition: "", 
      appendix_table: "", 
      activities_integration: [] 
    }; 
  }
};