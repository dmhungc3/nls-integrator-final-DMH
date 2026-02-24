import PizZip from 'pizzip';

// 1. CHIẾN LƯỢC NLS: CƠ BẢN - HIỆN ĐẠI - PHÙ HỢP (CHUẨN GDPT 2018)
const SUBJECT_STRATEGIES: Record<string, string> = {
  "Toán": "Tư duy tính toán & Mô hình hóa. Ưu tiên: GeoGebra, Desmos (Vẽ đồ thị), Excel (Thống kê), WolframAlpha (Kiểm chứng). Biến công thức khô khan thành hình ảnh trực quan.",
  "Ngữ Văn": "Sáng tạo nội dung số & Văn hóa mạng. Ưu tiên: Canva (Infographic/Poster), Padlet (Thảo luận), Podcast (Nói và Nghe), E-book.",
  "Tiếng Anh": "Giao tiếp đa phương tiện & Tự học. Ưu tiên: Elsa Speak (Luyện phát âm AI), Duolingo, Quizizz/Kahoot (Kiểm tra từ vựng), Google Docs (Viết cộng tác).",
  "Vật Lí": "Thí nghiệm ảo & Xử lý số liệu. Ưu tiên: PhET Simulations (Mô phỏng), Tracker (Phân tích video chuyển động), Excel (Vẽ đồ thị thực nghiệm).",
  "Hóa Học": "Mô phỏng vi mô & Cấu trúc chất. Ưu tiên: PhET (Phản ứng), ChemDraw/Avogadro (Vẽ cấu trúc phân tử 3D), Bảng tuần hoàn Ptable.",
  "Sinh Học": "Trực quan hóa & Sinh thái số. Ưu tiên: Human Anatomy Atlas (Giải phẫu 3D), Google Earth (Sinh cảnh), Kính hiển vi ảo.",
  "Lịch Sử": "Tái hiện lịch sử & Tư duy thời gian. Ưu tiên: Google Earth VR (Tham quan di tích), Bảo tàng ảo 3D, TimelineJS (Trục thời gian số).",
  "Địa Lí": "Bản đồ số & Thực địa ảo. Ưu tiên: Google Maps/Earth Pro (Quan sát địa hình), GIS cơ bản, Worldometer (Số liệu dân số thực).",
  "Tin Học": "Tư duy máy tính & Giải quyết vấn đề. Ưu tiên: Python, Scratch, Code.org, Tinkercad (Mô phỏng mạch/3D).",
  "Công Nghệ": "Thiết kế kỹ thuật & Mô phỏng quy trình. Ưu tiên: Tinkercad (Thiết kế 3D đơn giản), AutoCAD (Cơ bản), Sơ đồ tư duy (Miro/Xmind).",
  "Nghệ Thuật": "Sáng tạo nghệ thuật số. Ưu tiên: Canva, Photoshop cơ bản, AI Art, GarageBand.",
  "Giáo dục thể chất": "Y tế số & Phân tích kỹ thuật. Ưu tiên: App đo bước chân/nhịp tim, Quay video slow-motion để sửa động tác."
};

// 2. MÔ HÌNH SƯ PHẠM
export const PEDAGOGY_MODELS: Record<string, { name: string; desc: string }> = {
  "DEFAULT": { name: "Chuẩn hóa & Đồng bộ (Standard & Sync)", desc: "Nội dung sạch, không ký tự lạ, cấu trúc rõ ràng và đồng bộ định dạng với văn bản gốc." }
};

// 3. HÀM ĐỌC FILE WORD
export const extractTextFromDocx = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const zip = new PizZip(e.target?.result as ArrayBuffer);
        // Làm sạch văn bản đầu vào để AI đọc tốt hơn
        const text = zip.file("word/document.xml")?.asText().replace(/<[^>]+>/g, ' ').replace(/"/g, "'") || "";
        resolve(text);
      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
};

// 4. HÀM TẠO PROMPT (BỘ NÃO XỬ LÝ - SIÊU SẠCH & CHUẨN MỰC)
export const createIntegrationTextPrompt = (text: string, subject: string, grade: string, mode: 'NLS' | 'NAI') => {
  const strategy = SUBJECT_STRATEGIES[subject] || "Tích hợp công nghệ hỗ trợ hiện đại, phù hợp lứa tuổi.";

  return `
  Đóng vai Chuyên gia Sư phạm số và Giáo viên bộ môn ${subject} cốt cán.
  BỐI CẢNH: Soạn giáo án điện tử theo định hướng Chương trình GDPT 2018 cho học sinh lớp ${grade}.
  CHIẾN LƯỢC: "${strategy}"

  === QUY TẮC ĐỊNH DẠNG TUYỆT ĐỐI (ĐỂ ĐỒNG BỘ FILE WORD) ===
  1. KHÔNG dùng dấu sao (**text**), dấu gạch dưới (_text_) hay ngoặc kép (") trong nội dung. Chỉ viết văn bản thường.
  2. KHÔNG viết tiêu đề thừa (như "👉 Tích hợp NLS:", "Tiết 1:", "Phần 1:").
  3. Mọi ý phải bắt đầu bằng dấu gạch ngang "- ".
  4. Ngôn ngữ: Sư phạm, ngắn gọn, súc tích, đi thẳng vào vấn đề.

  === NHIỆM VỤ ===

  --- BƯỚC 1: QUÉT HOẠT ĐỘNG (Chi tiết hóa - Cầm tay chỉ việc) ---
  - Rà soát toàn bộ bài dạy (kể cả nội dung trong bảng).
  - Đề xuất hoạt động số thiết thực, khả thi.
  - Viết nội dung theo cấu trúc 3 phần (viết liền mạch thành 1 đoạn hoặc các gạch đầu dòng):
    - Công cụ: [Tên phần mềm/Web]
    - GV: [Tổ chức thế nào?]
    - HS: [Thao tác gì trên thiết bị?]

  --- BƯỚC 2: TỔNG HỢP MỤC TIÊU (Tư duy ngược) ---
  - Từ các hoạt động chi tiết ở trên, hãy rút ra "Năng lực số" mà học sinh đạt được.
  - Viết thành câu mục tiêu chuẩn (Ví dụ: Năng lực sử dụng phần mềm X để giải quyết vấn đề Y).
  - Nếu bài nhiều tiết, hãy tách dòng cho từng tiết.

  === MẪU ĐẦU RA (JSON CHUẨN) ===
  {
    "objectives_addition": "- [Năng lực số 1...]\\n- [Năng lực số 2...]",
    "materials_addition": "",
    "activities_enhancement": [
      { 
        "activity_name": "[Tên chính xác Hoạt động 1]", 
        "enhanced_content": "- Công cụ: [Tên]\\n- GV: [Hướng dẫn]\\n- HS: [Thực hiện]" 
      },
      { 
        "activity_name": "[Tên chính xác Hoạt động 2]", 
        "enhanced_content": "- Công cụ: [Tên]\\n- GV: [Hướng dẫn]\\n- HS: [Thực hiện]" 
      }
    ]
  }

  NỘI DUNG GIÁO ÁN GỐC:
  """
  ${text.substring(0, 18000)}
  """
  `;
};