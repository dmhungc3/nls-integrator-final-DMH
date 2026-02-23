import PizZip from 'pizzip';

// 1. CẤU HÌNH CHIẾN LƯỢC NLS CHO TỪNG MÔN (BÍ QUYẾT CỐT LÕI)
const SUBJECT_STRATEGIES: Record<string, string> = {
  "Toán": "Tập trung vào 'Tư duy tính toán' (Computational Thinking) và 'Mô hình hóa toán học'. Ưu tiên các công cụ: GeoGebra, Desmos, Excel (xử lý thống kê), WolframAlpha. Nhấn mạnh việc biến các con số khô khan thành hình ảnh trực quan.",
  
  "Ngữ Văn": "Tập trung vào 'Sáng tạo nội dung số' và 'Văn hóa đọc/viết trên không gian mạng'. Ưu tiên: Tạo Podcast, Infographic (Canva), E-book, Blog văn học, tra cứu từ điển số. Nhấn mạnh đạo đức trích dẫn nguồn và an toàn thông tin.",
  
  "Tiếng Anh": "Tập trung vào 'Giao tiếp xuyên biên giới' và 'Cá nhân hóa lộ trình học'. Ưu tiên: Elsa Speak (AI phát âm), Duolingo, Grammarly, kết nối với người nước ngoài qua Skype/Zoom, tra từ điển ngữ cảnh (Ozdic).",
  
  "Vật Lí": "Tập trung vào 'Thí nghiệm ảo' và 'Thu thập số liệu thực nghiệm'. Ưu tiên: PhET Simulations, phần mềm phân tích video chuyển động (Tracker), cảm biến số (Data logger).",
  
  "Hóa Học": "Tập trung vào 'Mô phỏng cấu trúc phân tử' và 'Phản ứng nguy hiểm'. Ưu tiên: ChemDraw, PhET, Video thí nghiệm 3D, bảng tuần hoàn tương tác.",
  
  "Sinh Học": "Tập trung vào 'Giải phẫu ảo' và 'Hệ sinh thái số'. Ưu tiên: Human Anatomy Atlas, kính hiển vi ảo, Google Earth (quan sát sinh cảnh), iNaturalist (định danh loài).",
  
  "Lịch Sử": "Tập trung vào 'Tái hiện quá khứ' và 'Tư duy đa chiều'. Ưu tiên: Bảo tàng ảo 3D, Google Earth VR, Bản đồ lịch sử tương tác, phục dựng 3D di tích.",
  
  "Địa Lí": "Tập trung vào 'Hệ thống thông tin địa lý (GIS)' và 'Dữ liệu thực địa'. Ưu tiên: Google Maps/Earth, GPS, Worldometer (số liệu dân số thực), phân tích biểu đồ số.",
  
  "Tin Học": "Tập trung vào 'Tư duy lập trình', 'Giải quyết vấn đề' và 'Đạo đức số'. Ưu tiên: Python, Scratch, Code.org, an toàn an ninh mạng.",
  
  "Công Nghệ": "Tập trung vào 'Thiết kế kỹ thuật' và 'Mô phỏng quy trình'. Ưu tiên: AutoCAD, Tinkercad (in 3D), sơ đồ tư duy quy trình công nghệ.",
  
  "Nghệ Thuật": "Tập trung vào 'Sáng tạo nghệ thuật số'. Ưu tiên: Photoshop, AI vẽ tranh (Midjourney), soạn nhạc số (GarageBand).",
  
  "Giáo dục thể chất": "Tập trung vào 'Theo dõi sức khỏe số'. Ưu tiên: Smartwatch, App đo bước chân/calo, phân tích video kỹ thuật động tác (Slow motion)."
};

// 2. MÔ HÌNH SƯ PHẠM
export const PEDAGOGY_MODELS: Record<string, { name: string; desc: string }> = {
  "DEFAULT": { name: "Phân hóa theo Tiết (Session-Based)", desc: "Tự động phân chia nội dung NLS phù hợp cho từng tiết học riêng biệt." },
  "5E": { name: "Mô hình 5E (STEM)", desc: "Gắn kết - Khám phá - Giải thích - Áp dụng - Đánh giá (Phù hợp KHTN)." },
  "PBL": { name: "Dạy học Dự án", desc: "Giải quyết vấn đề thực tiễn (Phù hợp KHXH & Công nghệ)." }
};

// 3. HÀM ĐỌC FILE WORD
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

// 4. HÀM TẠO PROMPT (BỘ NÃO XỬ LÝ)
export const createIntegrationTextPrompt = (text: string, subject: string, grade: string, mode: 'NLS' | 'NAI') => {
  const label = mode === 'NLS' ? "Tích hợp NLS" : "Tích hợp AI";
  
  // Lấy chiến lược đặc thù cho môn học (nếu không có thì dùng mặc định)
  const specificStrategy = SUBJECT_STRATEGIES[subject] || "Tập trung vào việc sử dụng công cụ số để giải quyết vấn đề, tra cứu thông tin và cộng tác trực tuyến.";

  return `
  Đóng vai Chuyên gia Sư phạm số và Giáo viên bộ môn ${subject}.
  
  BỐI CẢNH: Bạn đang hỗ trợ giáo viên lớp ${grade} chuyển đổi số giáo án theo định hướng GDPT 2018.
  CHIẾN LƯỢC MÔN HỌC: "${specificStrategy}"

  NHIỆM VỤ: PHÂN TÍCH VÀ TÍCH HỢP NĂNG LỰC SỐ (NLS) THEO TỪNG TIẾT DẠY.
  
  Bước 1: Phân tích cấu trúc giáo án.
  - Xác định giáo án gồm mấy tiết (Tiết 1, Tiết 2...).
  - Tìm phần "Năng lực" (hoặc "Phẩm chất năng lực") CỦA TỪNG TIẾT.
  - Tìm các "Hoạt động" cụ thể trong từng tiết.

  Bước 2: Viết nội dung tích hợp (JSON).
  
  1. PHẦN NĂNG LỰC (objectives_addition):
     - Viết nội dung NLS riêng cho từng tiết.
     - Định dạng bắt buộc: "👉 ${label} (Tiết X): [Năng lực số cụ thể ứng với nội dung tiết đó]"
     - Ví dụ: Tiết 1 dùng phần mềm mô phỏng thì ghi năng lực mô phỏng; Tiết 2 làm bài tập thì ghi năng lực sử dụng công cụ kiểm tra đánh giá.

  2. PHẦN HOẠT ĐỘNG (activities_enhancement):
     - Chọn 1-2 hoạt động tiêu biểu NHẤT của MỖI tiết để tích hợp.
     - Trích dẫn CHÍNH XÁC tên hoạt động (ví dụ: "Hoạt động 1: Khởi động", "Hoạt động 2.1...").
     - Viết nội dung tích hợp: GV dùng công cụ gì? HS làm gì trên thiết bị số?

  YÊU CẦU ĐẦU RA (JSON CHUẨN - KHÔNG MARKDOWN, KHÔNG GIẢI THÍCH):
  {
    "objectives_addition": "👉 ${label} (Tiết 1): [Nội dung NLS tiết 1]\\n👉 ${label} (Tiết 2): [Nội dung NLS tiết 2]",
    "materials_addition": "👉 ${label}: [Danh sách thiết bị/phần mềm hỗ trợ chung]",
    "activities_enhancement": [
      { "activity_name": "[Tên chính xác hoạt động A ở Tiết 1]", "enhanced_content": "👉 ${label}: [Cách dùng công nghệ trong hoạt động A]" },
      { "activity_name": "[Tên chính xác hoạt động B ở Tiết 2]", "enhanced_content": "👉 ${label}: [Cách dùng công nghệ trong hoạt động B]" }
    ]
  }

  NỘI DUNG GIÁO ÁN GỐC:
  """
  ${text.substring(0, 15000)}
  """
  `;
};