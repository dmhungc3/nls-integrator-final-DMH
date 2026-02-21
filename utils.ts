import mammoth from 'mammoth';

export const PEDAGOGY_MODELS = {
  "DEFAULT": { name: "Linh hoạt (Context-Based)", desc: "Tự động điều chỉnh theo đặc thù từng môn học và đối tượng HS." },
  "5E": { name: "Mô hình 5E (STEM/KHTN)", desc: "Gắn kết - Khám phá - Giải thích - Áp dụng - Đánh giá chuyên sâu công nghệ." },
  "PBL": { name: "Dạy học Dự án (Project-Based)", desc: "Giải quyết vấn đề thực tiễn qua dự án số và sản phẩm AI." },
  "FLIPPED": { name: "Lớp học đảo ngược", desc: "Học sinh tự học qua học liệu số, lên lớp thảo luận và thực hành AI." },
  "GAMIFICATION": { name: "Trò chơi hóa", desc: "Tăng cường tương tác qua Quizizz, Kahoot và hệ thống điểm thưởng số." },
  "DIFFERENTIATED": { name: "Dạy học phân hóa", desc: "AI hỗ trợ cá nhân hóa nhiệm vụ học tập theo năng lực từng học sinh." }
};

export const createIntegrationTextPrompt = (
  text: string, subject: string, grade: string, mode: 'NLS' | 'NAI', pedagogy: string
): string => {
  const selectedModel = PEDAGOGY_MODELS[pedagogy as keyof typeof PEDAGOGY_MODELS] || PEDAGOGY_MODELS["DEFAULT"];
  const label = mode === 'NAI' ? "TÍCH HỢP TRÍ TUỆ NHÂN TẠO (AI)" : "TÍCH HỢP NĂNG LỰC SỐ (NLS)";

  return `
    BẠN LÀ MỘT CHUYÊN GIA GIÁO DỤC SỐ ĐẦU NGÀNH (EDUTECH EXPERT).
    Nhiệm vụ: Nâng cấp và tích hợp năng lực thời đại vào giáo án môn ${subject} - Khối lớp: ${grade}.
    Chế độ ưu tiên: ${label}. 
    Mô hình sư phạm áp dụng: ${selectedModel.name} (${selectedModel.desc}).

    DỮ LIỆU GIÁO ÁN GỐC TỪ THẦY HÙNG: 
    """
    ${text.substring(0, 18000)}
    """

    YÊU CẦU PHÂN TÍCH CHIỀU SÂU:
    1. Tìm các khái niệm cốt lõi trong bài học và đề xuất công cụ số (GeoGebra, Desmos, Maple...) hoặc AI (Gemini, ChatGPT) tương ứng để minh họa.
    2. Thiết kế các hoạt động phải đảm bảo tính khả thi trong môi trường lớp học Việt Nam.
    3. ĐẶC BIỆT: Nội dung trả về phải khớp với các mốc "HOẠT ĐỘNG", "MỤC TIÊU" có trong văn bản gốc.
    4. Không được thay đổi nội dung kiến thức chuyên môn, chỉ được bổ sung các lớp năng lực công nghệ lên trên nền tảng đó.
  `;
};

export const extractTextFromDocx = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error("Lỗi trích xuất văn bản Word:", error);
    throw new Error("Không thể đọc nội dung file giáo án. Thầy hãy kiểm tra lại định dạng .docx");
  }
};