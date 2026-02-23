import PizZip from 'pizzip';

// --- CẤU HÌNH MỨC ĐỘ NĂNG LỰC ---
const LEVEL_MAPPING: Record<string, { ten: string, kyHieu: string, nhiemVu: string }> = {
  "Lớp 1": { ten: "Khám phá (L1)", kyHieu: "L1", nhiemVu: "Nhận biết, thao tác chạm/kéo thả." },
  "Lớp 2": { ten: "Khám phá (L1)", kyHieu: "L1", nhiemVu: "Sử dụng phần mềm đơn giản." },
  "Lớp 3": { ten: "Làm quen (L2)", kyHieu: "L2", nhiemVu: "Gõ phím, mở thư mục." },
  "Lớp 4": { ten: "Làm quen (L2)", kyHieu: "L2", nhiemVu: "Soạn thảo, tìm kiếm cơ bản." },
  "Lớp 5": { ten: "Làm quen (L2)", kyHieu: "L2", nhiemVu: "Tạo slide, gửi thư điện tử." },
  "Lớp 6": { ten: "Vận dụng (L3)", kyHieu: "L3", nhiemVu: "Sơ đồ tư duy, lưu trữ đám mây." },
  "Lớp 7": { ten: "Vận dụng (L3)", kyHieu: "L3", nhiemVu: "Xử lý số liệu, làm việc nhóm online." },
  "Lớp 8": { ten: "Tích hợp (L4)", kyHieu: "L4", nhiemVu: "Đa phương tiện, đánh giá tin giả." },
  "Lớp 9": { ten: "Tích hợp (L4)", kyHieu: "L4", nhiemVu: "Giải quyết vấn đề, mô phỏng ảo." },
  "Lớp 10": { ten: "Làm chủ (L5)", kyHieu: "L5", nhiemVu: "Phân tích dữ liệu, trợ lý AI." },
  "Lớp 11": { ten: "Sáng tạo (L6)", kyHieu: "L6", nhiemVu: "Thiết kế sản phẩm, lập trình." },
  "Lớp 12": { ten: "Chuyên gia (L6)", kyHieu: "L6", nhiemVu: "Quản trị dự án số, giải pháp mới." },
};

export const PEDAGOGY_MODELS = {
  "DEFAULT": { name: "Linh hoạt (Context-Based)", desc: "Tự động điều chỉnh theo đặc thù từng môn học." },
  "5E": { name: "Mô hình 5E (STEM/KHTN)", desc: "Gắn kết - Khám phá - Giải thích - Áp dụng - Đánh giá." },
  "PBL": { name: "Dạy học Dự án (XH/NT)", desc: "Giải quyết vấn đề thực tiễn qua dự án dài hạn." },
  "FLIPPED": { name: "Lớp học đảo ngược", desc: "HS xem tài liệu ở nhà, lên lớp thảo luận sâu." },
  "GAMIFICATION": { name: "Trò chơi hóa", desc: "Học thông qua trò chơi số (Quizizz, Kahoot)." }
};

const NLS_CONTEXT = `KHUNG NĂNG LỰC SỐ: Vận hành thiết bị, Khai thác dữ liệu, Giao tiếp số, Sáng tạo nội dung, An toàn số.`;
const NAI_CONTEXT = `KHUNG NĂNG LỰC AI: Hiểu biết AI, Prompting, Tư duy phản biện, Đạo đức AI.`;

export const createIntegrationTextPrompt = (
  text: string, subject: string, grade: string, mode: 'NLS' | 'NAI', pedagogy: string
): string => {
  const mucDo = LEVEL_MAPPING[grade] || { ten: "Cơ bản", kyHieu: "L1", nhiemVu: "Làm quen" };
  const context = mode === 'NAI' ? NAI_CONTEXT : NLS_CONTEXT;
  const selectedModel = PEDAGOGY_MODELS[pedagogy as keyof typeof PEDAGOGY_MODELS] || PEDAGOGY_MODELS["DEFAULT"];
  const label = mode === 'NAI' ? "Tích hợp AI" : "Tích hợp NLS";

  return `
    Đóng vai: Chuyên gia Sư phạm Số & Công nghệ dạy học Đa lĩnh vực.
    Nhiệm vụ: Phân tích giáo án môn ${subject} lớp ${grade} để chèn hoạt động Công nghệ/AI "thông minh".
    Mức độ yêu cầu: ${mucDo.ten} - ${mucDo.nhiemVu}.
    Chiến lược: ${selectedModel.name}.
    Ngữ cảnh: ${context}.

    ⚠️ QUY TẮC "THÔNG MINH ĐA MÔN" (Context-Aware):
    1. NHÓM KHTN (Toán, Lý, Hóa, Sinh): Dùng GeoGebra, Desmos, PhET, Excel...
    2. NHÓM KHXH (Văn, Sử, Địa, GDCD): Dùng Google Earth, Canva, Padlet, Podcast...
    3. NHÓM NGHỆ THUẬT/THỂ CHẤT: Dùng MuseScore, Paint 3D, Video slow-motion...
    4. NHÓM NGOẠI NGỮ: Dùng Duolingo, ELSA, AI Chatbot...

    NỘI DUNG GIÁO ÁN GỐC: """${text.substring(0, 20000)}"""

    YÊU CẦU TRẢ VỀ JSON DUY NHẤT (Không Markdown):
    {
      "objectives_addition": "Viết 2-3 gạch đầu dòng nội dung ${label} bổ sung vào mục Mục tiêu/Năng lực. (Ví dụ: Sử dụng phần mềm... để...)",
      "materials_addition": "Liệt kê phần mềm/thiết bị số cụ thể bổ sung vào mục Thiết bị (Ví dụ: Máy chiếu, GeoGebra, Padlet...)",
      "activities_integration": [
        {
          "anchor_text": "Trích dẫn CHÍNH XÁC tên hoạt động hoặc mục trong bài (Ví dụ: 'Hoạt động 1', '1. Mở đầu', 'Hoạt động luyện tập')",
          "content": "Mô tả chi tiết hoạt động giáo viên và học sinh sử dụng công nghệ trong phần này."
        }
      ],
      "appendix_table": "Danh sách 3-4 tiêu chí đánh giá kỹ năng công nghệ của học sinh trong bài."
    }
  `;
};

// Hàm đọc file Word sử dụng PizZip (Chạy tốt trên trình duyệt)
export const extractTextFromDocx = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        // PizZip giúp đọc file zip (docx thực chất là zip)
        const zip = new PizZip(content as ArrayBuffer);
        const doc = zip.file("word/document.xml");
        if (!doc) { resolve(""); return; }
        const xml = doc.asText();
        // Loại bỏ các thẻ XML để lấy text thuần
        const text = xml.replace(/<[^>]+>/g, ' ');
        resolve(text);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};