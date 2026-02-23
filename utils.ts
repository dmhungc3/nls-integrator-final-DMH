import PizZip from 'pizzip';

// --- CẤU HÌNH MỨC ĐỘ NĂNG LỰC SỐ (DIGITAL COMPETENCE FRAMEWORK) ---
const LEVEL_MAPPING: Record<string, { ten: string, kyHieu: string, nhiemVu: string }> = {
  "Lớp 1": { ten: "Khám phá (Level 1)", kyHieu: "L1", nhiemVu: "Nhận biết thiết bị, thao tác chạm/vuốt đơn giản." },
  "Lớp 2": { ten: "Khám phá (Level 1)", kyHieu: "L1", nhiemVu: "Sử dụng phần mềm học tập đơn giản dưới sự hướng dẫn." },
  "Lớp 3": { ten: "Làm quen (Level 2)", kyHieu: "L2", nhiemVu: "Gõ phím, mở thư mục, truy cập website an toàn." },
  "Lớp 4": { ten: "Làm quen (Level 2)", kyHieu: "L2", nhiemVu: "Soạn thảo văn bản cơ bản, tìm kiếm thông tin có mục đích." },
  "Lớp 5": { ten: "Làm quen (Level 2)", kyHieu: "L2", nhiemVu: "Tạo bài trình chiếu đơn giản, gửi thư điện tử." },
  "Lớp 6": { ten: "Vận dụng (Level 3)", kyHieu: "L3", nhiemVu: "Sử dụng sơ đồ tư duy số, lưu trữ đám mây cơ bản." },
  "Lớp 7": { ten: "Vận dụng (Level 3)", kyHieu: "L3", nhiemVu: "Xử lý số liệu bảng tính, làm việc nhóm trực tuyến." },
  "Lớp 8": { ten: "Tích hợp (Level 4)", kyHieu: "L4", nhiemVu: "Biên tập đa phương tiện (ảnh/video), đánh giá tin giả." },
  "Lớp 9": { ten: "Tích hợp (Level 4)", kyHieu: "L4", nhiemVu: "Giải quyết vấn đề bằng phần mềm, sử dụng mô phỏng ảo." },
  "Lớp 10": { ten: "Làm chủ (Level 5)", kyHieu: "L5", nhiemVu: "Phân tích dữ liệu lớn, sử dụng trợ lý AI hỗ trợ học tập." },
  "Lớp 11": { ten: "Sáng tạo (Level 6)", kyHieu: "L6", nhiemVu: "Thiết kế sản phẩm số sáng tạo, lập trình ứng dụng nhỏ." },
  "Lớp 12": { ten: "Chuyên gia (Level 6)", kyHieu: "L6", nhiemVu: "Quản trị dự án học tập số, đề xuất giải pháp công nghệ mới." },
};

export const PEDAGOGY_MODELS = {
  "DEFAULT": { name: "Linh hoạt (Context-Based)", desc: "Tự động điều chỉnh theo đặc thù từng môn học và nội dung bài dạy." },
  "5E": { name: "Mô hình 5E (STEM/KHTN)", desc: "Gắn kết (Engage) - Khám phá (Explore) - Giải thích (Explain) - Áp dụng (Elaborate) - Đánh giá (Evaluate)." },
  "PBL": { name: "Dạy học Dự án (Project-Based)", desc: "Học sinh giải quyết vấn đề thực tiễn thông qua dự án dài hạn." },
  "FLIPPED": { name: "Lớp học đảo ngược (Flipped Classroom)", desc: "Học sinh tự tìm hiểu tài liệu số ở nhà, lên lớp thảo luận sâu và thực hành." },
  "GAMIFICATION": { name: "Trò chơi hóa (Gamification)", desc: "Tăng hứng thú học tập thông qua các trò chơi số (Quizizz, Kahoot, Blooket)." }
};

// Hàm tạo Prompt gửi cho AI (QUAN TRỌNG NHẤT)
export const createIntegrationTextPrompt = (
  text: string, subject: string, grade: string, mode: 'NLS' | 'NAI', pedagogy: string
): string => {
  const levelInfo = LEVEL_MAPPING[grade] || { ten: "Cơ bản", kyHieu: "L1", nhiemVu: "Làm quen" };
  const modelName = PEDAGOGY_MODELS[pedagogy as keyof typeof PEDAGOGY_MODELS]?.name || "Linh hoạt";
  const integrationType = mode === 'NLS' ? "Năng lực Số (Digital Competence)" : "Trí tuệ nhân tạo (AI Competence)";

  return `
    Đóng vai: Chuyên gia Sư phạm & Công nghệ Giáo dục (EdTech Expert).
    Nhiệm vụ: Phân tích giáo án sau để tích hợp ${integrationType} một cách tự nhiên và hiệu quả.
    
    THÔNG TIN LỚP HỌC:
    - Môn học: ${subject}
    - Khối lớp: ${grade}
    - Mức độ năng lực yêu cầu: ${levelInfo.ten} (${levelInfo.kyHieu}) - ${levelInfo.nhiemVu}.
    - Chiến lược sư phạm áp dụng: ${modelName}.

    NỘI DUNG GIÁO ÁN GỐC (Trích đoạn):
    """${text.substring(0, 15000)}"""

    YÊU CẦU XỬ LÝ (RẤT QUAN TRỌNG):
    
    1. PHẦN "MỤC TIÊU - NĂNG LỰC" (Objectives):
       - Chỉ liệt kê ngắn gọn tên các năng lực chung/đặc thù cần hình thành.
       - Ví dụ: "Năng lực ứng dụng CNTT và TT", "Năng lực tự chủ và tự học".
       - TUYỆT ĐỐI KHÔNG liệt kê các thao tác chi tiết (như "bấm chuột", "truy cập link") ở đây.

    2. PHẦN "THIẾT BỊ & HỌC LIỆU" (Materials):
       - Bổ sung danh sách cụ thể các công cụ/phần mềm sẽ dùng.
       - Ví dụ: "Máy tính kết nối Internet", "Phần mềm GeoGebra", "Padlet", "ChatGPT", "Canva".

    3. PHẦN "HOẠT ĐỘNG DẠY HỌC" (Activities Enhancement):
       - Đây là phần quan trọng nhất. Hãy rà soát các hoạt động chính trong giáo án gốc.
       - Viết lại hoặc bổ sung nội dung cho từng hoạt động để thể hiện rõ Giáo viên và Học sinh làm gì với công nghệ.
       - Cấu trúc viết lại: "Giáo viên sử dụng [Công cụ] để [Hành động]...", "Học sinh truy cập [Phần mềm] để [Nhiệm vụ]...".
       - Đảm bảo các hành động phù hợp với mức độ năng lực của học sinh lớp ${grade}.

    OUTPUT FORMAT (JSON ONLY - NO MARKDOWN):
    {
      "objectives_addition": "Các dòng bổ sung cho phần Mục tiêu (dạng gạch đầu dòng, ngắn gọn)",
      "materials_addition": "Các dòng bổ sung cho phần Học liệu (dạng gạch đầu dòng)",
      "activities_enhancement": [
        {
           "activity_name": "Tên hoạt động trong bài (Ví dụ: Hoạt động 1: Khởi động)",
           "enhanced_content": "Nội dung chi tiết của hoạt động đã được viết lại có lồng ghép công nghệ/AI."
        },
        {
           "activity_name": "Tên hoạt động tiếp theo...",
           "enhanced_content": "..."
        }
      ]
    }
  `;
};

// Hàm đọc text từ file Docx (Giữ nguyên vì đã hoạt động tốt)
export const extractTextFromDocx = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        if (!content) { resolve(""); return; }
        
        const zip = new PizZip(content as ArrayBuffer);
        const doc = zip.file("word/document.xml");
        if (!doc) { resolve(""); return; }
        
        const xml = doc.asText();
        // Loại bỏ XML tags, giữ lại text nội dung
        const text = xml.replace(/<[^>]+>/g, ' ');
        resolve(text);
      } catch (error) {
        console.error("Lỗi đọc file Docx:", error);
        reject(error);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};