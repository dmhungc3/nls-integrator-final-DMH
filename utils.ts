import PizZip from 'pizzip';

export const PEDAGOGY_MODELS: Record<string, { name: string; desc: string }> = {
  "DEFAULT": { name: "Linh hoạt (Context-Based)", desc: "Tự động điều chỉnh theo bài dạy." },
  "5E": { name: "Mô hình 5E (STEM/KHTN)", desc: "Gắn kết - Khám phá - Giải thích - Áp dụng - Đánh giá." },
  "PBL": { name: "Dạy học Dự án", desc: "Giải quyết vấn đề thực tiễn." }
};

export const extractTextFromDocx = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const zip = new PizZip(e.target?.result as ArrayBuffer);
      const text = zip.file("word/document.xml")?.asText().replace(/<[^>]+>/g, ' ') || "";
      resolve(text);
    };
    reader.readAsArrayBuffer(file);
  });
};

export const createIntegrationTextPrompt = (text: string, subject: string, grade: string, mode: 'NLS' | 'NAI') => {
  const label = mode === 'NLS' ? "Tích hợp NLS" : "Tích hợp AI";
  return `Đóng vai chuyên gia EdTech. Phân tích giáo án môn ${subject} lớp ${grade}.
  NHIỆM VỤ: Thiết kế nội dung tích hợp công nghệ bắt đầu bằng "👉 ${label}: ".
  YÊU CẦU JSON:
  {
    "objectives_addition": "👉 ${label}: [Năng lực số toàn bài]",
    "materials_addition": "👉 ${label}: [Thiết bị/Phần mềm số]",
    "activities_enhancement": [{"activity_name": "Tên hoạt động gốc", "enhanced_content": "👉 ${label}: [Mô tả thao tác GV/HS]"}]
  }
  Nội dung: ${text.substring(0, 10000)}`;
};