import mammoth from 'mammoth';

export const PEDAGOGY_MODELS = {
  "DEFAULT": { name: "Linh hoạt (Context-Based)", desc: "Tự động điều chỉnh theo đặc thù từng môn học." },
  "5E": { name: "Mô hình 5E (STEM/KHTN)", desc: "Gắn kết - Khám phá - Giải thích - Áp dụng - Đánh giá." },
  "PBL": { name: "Dạy học Dự án (XH/NT)", desc: "Giải quyết vấn đề thực tiễn qua dự án dài hạn." },
  "FLIPPED": { name: "Lớp học đảo ngược", desc: "HS xem tài liệu ở nhà, lên lớp thảo luận sâu." },
  "GAMIFICATION": { name: "Trò chơi hóa", desc: "Học thông qua trò chơi số (Quizizz, Kahoot)." }
};

export const createIntegrationTextPrompt = (
  text: string, subject: string, grade: string, mode: 'NLS' | 'NAI', pedagogy: string
): string => {
  const selectedModel = PEDAGOGY_MODELS[pedagogy as keyof typeof PEDAGOGY_MODELS] || PEDAGOGY_MODELS["DEFAULT"];
  const label = mode === 'NAI' ? "Tích hợp AI" : "Tích hợp NLS";

  return `
    Nhiệm vụ: Phân tích giáo án môn ${subject} lớp ${grade}.
    Chế độ: ${label}. Mô hình: ${selectedModel.name}.
    NỘI DUNG GIÁO ÁN GỐC: """${text.substring(0, 20000)}"""
    (Yêu cầu AI phân tích và trả về các hoạt động tích hợp thông minh nhất).
  `;
};

export const extractTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};