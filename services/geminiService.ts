import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedNLSContent } from "../types";

export const generateCompetencyIntegration = async (prompt: string, apiKey: string): Promise<GeneratedNLSContent> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Dùng model thông minh nhất để hiểu sâu GDPT 2018
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

  const result = await model.generateContent(prompt + `
    ---------------------------------------------------
    YÊU CẦU CỐT LÕI: CHUYÊN GIA GIÁO DỤC 4.0 (CHUẨN BỘ GD&ĐT & GDPT 2018)
    
    1. TƯ DUY TÍCH HỢP NĂNG LỰC SỐ (NLS):
       - KHÔNG liệt kê phần mềm vô hồn. Phải gắn công cụ với **Yêu cầu cần đạt** của bài học.
       - Bám sát định hướng Chuyển đổi số của Bộ GD&ĐT: Tăng cường AI, Học liệu số, Kiểm tra đánh giá thường xuyên.
       - Đảm bảo tính "Sư phạm hiện đại": Lấy học sinh làm trung tâm, phát triển phẩm chất (Trung thực, Trách nhiệm) và năng lực chung (Tự chủ, Giao tiếp).

    2. CẤU TRÚC VÀ VĂN PHONG (BẮT BUỘC GIỐNG MẪU):
       - Mọi dòng đề xuất phải bắt đầu bằng: "👉 Tích hợp NLS:"
       - Văn phong trang trọng, gãy gọn, đúng chuẩn giáo án Việt Nam.

    3. HƯỚNG DẪN CHI TIẾT TỪNG PHẦN:
       
       A. MỤC TIÊU (objectives_addition):
          - Viết 2-3 ý về việc dùng công nghệ để phát triển năng lực đặc thù môn học.
          - Ví dụ: "👉 Tích hợp NLS: Sử dụng phần mềm mô phỏng để trực quan hóa khái niệm trừu tượng, phát triển năng lực tư duy khoa học."
       
       B. THIẾT BỊ & HỌC LIỆU (materials_addition):
          - Đề xuất các kho học liệu số uy tín (Hệ thống LMS, OLM, Hoclieu.vn, PhET, GeoGebra, Youtube Edu...).
          - Ví dụ: "👉 Tích hợp NLS: Bộ câu hỏi tương tác trên Quizizz/Azota để đánh giá nhanh cuối bài."
       
       C. TIẾN TRÌNH DẠY HỌC (activities_integration):
          - Rà soát từng hoạt động. Đề xuất công nghệ giúp HS "Học qua làm" (Learning by doing).
          - Ưu tiên các phương pháp: Lớp học đảo ngược (Flipped Classroom), Dạy học dự án (Project Based Learning).
          - Ví dụ: "👉 Tích hợp NLS: GV yêu cầu HS làm việc nhóm trên Padlet/Jamboard để thảo luận và trình bày ý tưởng..."
       
       D. PHỤ LỤC ĐÁNH GIÁ (appendix_table):
          - Xây dựng tiêu chí đánh giá năng lực số cụ thể (Biết tra cứu, Biết chọn lọc, Biết trình bày).

    4. XỬ LÝ KHI GIÁO ÁN SƠ SÀI:
       - Nếu không tìm thấy hoạt động cụ thể, hãy TỰ ĐỘNG THIẾT KẾ 3 hoạt động chuẩn (Khởi động -> Khám phá -> Luyện tập) phù hợp với nội dung bài dạy.

    LƯU Ý KỸ THUẬT: 
    - TRẢ VỀ JSON THUẦN TÚY (Raw JSON).
    - TUYỆT ĐỐI KHÔNG dùng Markdown (\`\`\`json).
  `);

  const response = await result.response;
  // Làm sạch dữ liệu JSON (Xóa các ký tự thừa nếu AI lỡ thêm vào)
  const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
  
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    console.error("Lỗi parse JSON:", text);
    // Fallback an toàn: Trả về nội dung mặc định nếu AI gặp sự cố
    return {
      objectives_addition: "👉 Tích hợp NLS: Hệ thống đang quá tải, vui lòng thử lại sau giây lát.",
      materials_addition: "👉 Tích hợp NLS: Máy tính, máy chiếu, kết nối Internet.",
      activities_integration: [
        { anchor_text: "Hoạt động chung", content: "Vui lòng kiểm tra lại kết nối mạng và thử lại." }
      ],
      appendix_table: "..."
    };
  }

  // Chuẩn hóa dữ liệu đầu ra để tránh lỗi giao diện
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