import PizZip from 'pizzip';

// 1. CHIẾN LƯỢC NLS CHUYÊN SÂU & HIỆN ĐẠI (Cập nhật mới nhất)
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
  "DEFAULT": { name: "Quét sâu & Đồng bộ (Deep Scan & Sync)", desc: "Quét sâu vào nội dung chuyên môn, tổng hợp Năng lực số chuẩn xác và đồng bộ định dạng văn bản." }
};

// 3. HÀM ĐỌC FILE WORD
export const extractTextFromDocx = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const zip = new PizZip(e.target?.result as ArrayBuffer);
        // Loại bỏ các ký tự gây nhiễu để AI đọc sạch hơn
        const text = zip.file("word/document.xml")?.asText().replace(/<[^>]+>/g, ' ').replace(/"/g, "'") || "";
        resolve(text);
      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
};

// 4. HÀM TẠO PROMPT (CHUYÊN SÂU)
export const createIntegrationTextPrompt = (text: string, subject: string, grade: string, mode: 'NLS' | 'NAI') => {
  const strategy = SUBJECT_STRATEGIES[subject] || "Tích hợp công nghệ hỗ trợ hiện đại.";

  return `
  Đóng vai Chuyên gia Giáo dục số và Giáo viên bộ môn ${subject} xuất sắc.
  
  BỐI CẢNH: Hỗ trợ giáo viên lớp ${grade} soạn giáo án điện tử hiện đại.
  CHIẾN LƯỢC MÔN HỌC: "${strategy}"

  NHIỆM VỤ: "QUÉT SÂU" VÀ "TỔNG HỢP NGƯỢC".

  --- BƯỚC 1: QUÉT SÂU HOẠT ĐỘNG (Deep Scan) ---
  - Đọc kỹ từng hoạt động trong bài (kể cả trong bảng).
  - Đề xuất công cụ số "chuẩn và hiện đại nhất" cho hoạt động đó.
  - Viết hướng dẫn chi tiết (GV làm gì, HS làm gì).

  --- BƯỚC 2: TỔNG HỢP NĂNG LỰC (Synthesis) ---
  - Từ các hoạt động ở Bước 1, hãy tổng hợp lại thành các đầu mục Năng lực số để đưa vào phần Mục tiêu (Năng lực) ở đầu bài.
  - Nội dung phải khái quát được kỹ năng và công cụ sử dụng.

  YÊU CẦU ĐẦU RA (JSON CHUẨN):
  {
    "objectives_addition": "- [Năng lực số 1: Sử dụng công cụ X để giải quyết vấn đề Y...]\\n- [Năng lực số 2: Khai thác phần mềm Z để thực hiện nhiệm vụ T...]",
    
    "materials_addition": "",
    
    "activities_enhancement": [
      { 
        "activity_name": "[Tên chính xác Hoạt động 1]", 
        "enhanced_content": "- [Hướng dẫn chi tiết sử dụng công nghệ cho HĐ 1...]" 
      },
      { 
        "activity_name": "[Tên chính xác Hoạt động 2]", 
        "enhanced_content": "- [Hướng dẫn chi tiết sử dụng công nghệ cho HĐ 2...]" 
      }
    ]
  }

  QUY TẮC ĐỊNH DẠNG:
  - Không viết tiêu đề thừa (như "Tích hợp NLS:").
  - Các ý bắt đầu bằng gạch đầu dòng "- ".
  - Tuyệt đối không dùng dấu ngoặc kép (") trong nội dung.

  NỘI DUNG GIÁO ÁN GỐC:
  """
  ${text.substring(0, 18000)}
  """
  `;
};