import PizZip from 'pizzip';

// 1. CHIẾN LƯỢC MÔN HỌC (Giữ nguyên)
const SUBJECT_STRATEGIES: Record<string, string> = {
  "Toán": "Tư duy tính toán & Mô hình hóa. Ưu tiên: GeoGebra, Desmos, Excel, WolframAlpha.",
  "Ngữ Văn": "Sáng tạo nội dung đa phương tiện. Ưu tiên: Canva, Podcast, Blog văn học, E-book.",
  "Tiếng Anh": "Giao tiếp thực tế & Cá nhân hóa. Ưu tiên: Elsa Speak, Duolingo, Grammarly, Ozdic.",
  "Vật Lí": "Thí nghiệm ảo & Phân tích video. Ưu tiên: PhET, Tracker, Algodoo, Cảm biến số.",
  "Hóa Học": "Mô phỏng phân tử 3D. Ưu tiên: ChemDraw, PhET, Avogadro, Ptable.",
  "Sinh Học": "Giải phẫu ảo & Sinh thái số. Ưu tiên: Human Anatomy Atlas, Google Earth, iNaturalist.",
  "Lịch Sử": "Tái hiện quá khứ. Ưu tiên: Bảo tàng ảo 3D, Google Earth VR, Bản đồ lịch sử tương tác.",
  "Địa Lí": "Bản đồ số & Thực địa ảo. Ưu tiên: GIS, Google Earth Pro, Worldometer, GPS.",
  "Tin Học": "Tư duy máy tính. Ưu tiên: Python, Scratch, Code.org, Tinkercad.",
  "Công Nghệ": "Thiết kế kỹ thuật. Ưu tiên: AutoCAD, Tinkercad, Miro.",
  "Nghệ Thuật": "Sáng tạo nghệ thuật số. Ưu tiên: Photoshop, AI Art, GarageBand.",
  "Giáo dục thể chất": "Y tế số. Ưu tiên: Smartwatch, App đo sức khỏe, Video slow-motion."
};

// 2. MÔ HÌNH SƯ PHẠM
export const PEDAGOGY_MODELS: Record<string, { name: string; desc: string }> = {
  "DEFAULT": { name: "Chuẩn hóa & Đồng bộ (Standard & Sync)", desc: "Nội dung sạch (không ký tự lạ), cấu trúc rõ ràng và đồng bộ định dạng với văn bản gốc." }
};

// 3. HÀM ĐỌC FILE WORD
export const extractTextFromDocx = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const zip = new PizZip(e.target?.result as ArrayBuffer);
        // Loại bỏ các ký tự gây nhiễu
        const text = zip.file("word/document.xml")?.asText().replace(/<[^>]+>/g, ' ').replace(/"/g, "'") || "";
        resolve(text);
      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
};

// 4. HÀM TẠO PROMPT (BỘ NÃO XỬ LÝ - SIÊU SẠCH)
export const createIntegrationTextPrompt = (text: string, subject: string, grade: string, mode: 'NLS' | 'NAI') => {
  const strategy = SUBJECT_STRATEGIES[subject] || "Tích hợp công nghệ hỗ trợ hiện đại.";

  return `
  Đóng vai Chuyên gia Sư phạm số và Giáo viên bộ môn ${subject}.
  BỐI CẢNH: Hỗ trợ giáo viên lớp ${grade} chuyển đổi số giáo án.
  CHIẾN LƯỢC: "${strategy}"

  === QUY TẮC ĐỊNH DẠNG TUYỆT ĐỐI (KHÔNG ĐƯỢC VI PHẠM) ===
  1. KHÔNG sử dụng dấu sao đôi (**text**) hay dấu sao đơn (*text*) để in đậm/nghiêng. Hãy viết văn bản thường.
  2. KHÔNG viết tiêu đề thừa như "👉 Tích hợp NLS:" (Hệ thống tự lo).
  3. KHÔNG dùng dấu ngoặc kép (") trong nội dung.
  4. Các ý phải bắt đầu bằng gạch đầu dòng "- ".

  === NHIỆM VỤ ===

  --- BƯỚC 1: QUÉT HOẠT ĐỘNG (Chi tiết hóa) ---
  - Rà soát các hoạt động (cả trong bảng và văn bản).
  - Viết nội dung theo cấu trúc 3 phần (viết liền mạch, gãy gọn):
    - Công cụ: [Tên công cụ]
    - GV: [Hành động của GV]
    - HS: [Hành động của HS]

  --- BƯỚC 2: TỔNG HỢP MỤC TIÊU ---
  - Tổng hợp lại các công cụ đã dùng thành năng lực chung.

  === MẪU ĐẦU RA (JSON) ===
  {
    "objectives_addition": "- [Năng lực 1...]\\n- [Năng lực 2...]",
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