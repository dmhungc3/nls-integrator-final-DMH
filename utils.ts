import PizZip from 'pizzip';

export const PEDAGOGY_MODELS: Record<string, { name: string; desc: string }> = {
  "DEFAULT": { name: "Linh hoạt (Context-Based)", desc: "Tự động điều chỉnh theo bài dạy." },
  "5E": { name: "Mô hình 5E", desc: "Gắn kết - Khám phá - Áp dụng..." },
  "PBL": { name: "Dạy học Dự án", desc: "Giải quyết vấn đề thực tiễn." }
};

export const extractTextFromDocx = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const zip = new PizZip(e.target?.result as ArrayBuffer);
        const text = zip.file("word/document.xml")?.asText().replace(/<[^>]+>/g, ' ') || "";
        resolve(text);
      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
};

export const createIntegrationTextPrompt = (text: string, subject: string, grade: string, mode: 'NLS' | 'NAI') => {
  const label = mode === 'NLS' ? "Tích hợp NLS" : "Tích hợp AI";
  return `Đóng vai chuyên gia EdTech. Phân tích giáo án môn ${subject} lớp ${grade}.
  YÊU CẦU TRẢ VỀ JSON CHUẨN:
  {
    "objectives_addition": "👉 ${label}: [Nội dung]\\n👉 ${label}: [Nội dung]",
    "materials_addition": "👉 ${label}: [Công cụ]\\n👉 ${label}: [Công cụ]",
    "activities_enhancement": [
      {"activity_name": "Trích dẫn tên hoạt động gốc", "enhanced_content": "👉 ${label}: [Mô tả thao tác]"}
    ]
  }
  Nội dung: ${text.substring(0, 10000)}`;
};