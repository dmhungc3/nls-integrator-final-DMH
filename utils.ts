import PizZip from 'pizzip';

// 1. CẤU HÌNH CHIẾN LƯỢC NLS CHO TỪNG MÔN (BÍ QUYẾT CỐT LÕI)
const SUBJECT_STRATEGIES: Record<string, string> = {
  "Toán": "Tư duy tính toán & Mô hình hóa. Ưu tiên: GeoGebra, Desmos, Excel, WolframAlpha. Chuyển đổi số liệu khô khan thành đồ thị động.",
  "Ngữ Văn": "Sáng tạo nội dung đa phương tiện. Ưu tiên: Canva (Infographic), Podcast, Blog văn học, Từ điển số, E-book tương tác.",
  "Tiếng Anh": "Giao tiếp thực tế & Cá nhân hóa. Ưu tiên: Elsa Speak (AI), Duolingo, Grammarly, Ozdic, ChatGPT (sửa lỗi viết).",
  "Vật Lí": "Thí nghiệm ảo & Phân tích video. Ưu tiên: PhET Simulations, Tracker (phân tích chuyển động), Algodoo, Cảm biến số (Data Logger).",
  "Hóa Học": "Mô phỏng phân tử 3D. Ưu tiên: ChemDraw, PhET, Avogadro (cấu trúc tinh thể), Bảng tuần hoàn tương tác (Ptable).",
  "Sinh Học": "Giải phẫu ảo & Sinh thái số. Ưu tiên: Human Anatomy Atlas (3D), Google Earth (Sinh cảnh), iNaturalist (Định danh loài).",
  "Lịch Sử": "Tái hiện quá khứ (VR/AR). Ưu tiên: Bảo tàng ảo 3D, Google Earth VR, Bản đồ lịch sử tương tác, Phục dựng di tích 3D.",
  "Địa Lí": "Bản đồ số & Thực địa ảo. Ưu tiên: GIS (Hệ thống thông tin địa lý), Google Earth Pro, Google Maps, Worldometer (Số liệu thực), GPS.",
  "Tin Học": "Tư duy máy tính & Lập trình. Ưu tiên: Python, Scratch, Code.org, Tinkercad (Mạch điện), Giả lập mạng (Cisco Packet Tracer).",
  "Công Nghệ": "Thiết kế kỹ thuật (CAD) & Mô phỏng. Ưu tiên: AutoCAD, Tinkercad (In 3D), Sơ đồ tư duy quy trình công nghệ (Miro).",
  "Nghệ Thuật": "Sáng tạo nghệ thuật số. Ưu tiên: Photoshop, AI Art (Midjourney), GarageBand (Âm nhạc), MuseScore.",
  "Giáo dục thể chất": "Y tế số & Phân tích vận động. Ưu tiên: Smartwatch (Đo nhịp tim), App đo bước chân/calo, Video slow-motion phân tích kỹ thuật."
};

// 2. MÔ HÌNH SƯ PHẠM
export const PEDAGOGY_MODELS: Record<string, { name: string; desc: string }> = {
  "DEFAULT": { name: "Cấu trúc Chuẩn (Tools-Teacher-Student)", desc: "Trình bày chi tiết theo quy trình: Công cụ -> GV tổ chức -> HS thực hiện. Không dùng ký tự lạ." }
};

// 3. HÀM ĐỌC FILE WORD
export const extractTextFromDocx = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const zip = new PizZip(e.target?.result as ArrayBuffer);
        // Lấy text thuần, loại bỏ các ký tự gây nhiễu
        const text = zip.file("word/document.xml")?.asText().replace(/<[^>]+>/g, ' ').replace(/"/g, "'") || "";
        resolve(text);
      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
};

// 4. HÀM TẠO PROMPT (BỘ NÃO XỬ LÝ)
export const createIntegrationTextPrompt = (text: string, subject: string, grade: string, mode: 'NLS' | 'NAI') => {
  const label = mode === 'NLS' ? "Tích hợp NLS" : "Tích hợp AI";
  const strategy = SUBJECT_STRATEGIES[subject] || "Tích hợp công nghệ hỗ trợ hiện đại.";

  return `
  Đóng vai Chuyên gia Sư phạm số và Giáo viên bộ môn ${subject}.
  
  BỐI CẢNH: Hỗ trợ giáo viên lớp ${grade} chuyển đổi số giáo án.
  CHIẾN LƯỢC: "${strategy}"

  === QUY TẮC ĐỊNH DẠNG (TUYỆT ĐỐI TUÂN THỦ) ===
  1. KHÔNG dùng dấu sao đôi (**text**) để in đậm. Hãy viết văn bản thường.
  2. KHÔNG tự ý viết tiêu đề "👉 Tích hợp NLS:".
  3. Các dòng nội dung phải bắt đầu bằng dấu gạch ngang "- ".
  4. Tuyệt đối không dùng dấu ngoặc kép (") trong nội dung JSON.

  === NHIỆM VỤ ===

  --- BƯỚC 1: CHI TIẾT HÓA HOẠT ĐỘNG (Deep Scan) ---
  - Rà soát các hoạt động (kể cả trong bảng).
  - Viết nội dung theo cấu trúc 3 phần rõ ràng:
    - Công cụ số: [Tên công cụ/Phần mềm]
    - GV làm gì: [Mô tả hành động của GV]
    - HS làm gì: [Mô tả hành động của HS]

  --- BƯỚC 2: TỔNG HỢP MỤC TIÊU ---
  - Tóm tắt lại các công cụ đã dùng thành năng lực chung ở đầu bài.

  === MẪU ĐẦU RA (JSON) ===
  {
    "objectives_addition": "- [Năng lực 1: Sử dụng công cụ A để... ]\\n- [Năng lực 2: Khai thác phần mềm B để...]",
    
    "materials_addition": "",
    
    "activities_enhancement": [
      { 
        "activity_name": "[Tên chính xác Hoạt động 1]", 
        "enhanced_content": "- Công cụ số: [Tên công cụ]\\n- GV làm gì: [Hướng dẫn chi tiết...]\\n- HS làm gì: [Thao tác cụ thể...]" 
      },
      { 
        "activity_name": "[Tên chính xác Hoạt động 2]", 
        "enhanced_content": "- Công cụ số: [Tên công cụ]\\n- GV làm gì: [Hướng dẫn chi tiết...]\\n- HS làm gì: [Thao tác cụ thể...]" 
      }
    ]
  }

  NỘI DUNG GIÁO ÁN GỐC:
  """
  ${text.substring(0, 18000)}
  """
  `;
};