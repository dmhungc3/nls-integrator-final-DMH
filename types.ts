import PizZip from 'pizzip';

// QUAN TRỌNG: Thêm export vào trước mỗi hằng số/hàm
export const PEDAGOGY_MODELS = {
  DEFAULT: { name: "Linh hoạt (Context-Based)", desc: "Tự động điều chỉnh" }
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

export const createIntegrationTextPrompt = (text: string, subject: string, grade: string, mode: string, pedagogy: string) => {
  const label = mode === 'NLS' ? "Tích hợp NLS" : "Tích hợp AI";
  return `Phân tích giáo án môn ${subject} lớp ${grade}. Trả về JSON chuẩn có: objectives_addition, materials_addition, activities_enhancement. Nội dung: ${text.substring(0, 5000)}`;
};