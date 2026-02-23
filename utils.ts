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
  "DEFAULT": { name: "Tổng hợp & Chi tiết (Comprehensive)", desc: "Tổng hợp NLS ở mục Tiêu và chèn hướng dẫn chi tiết vào từng Hoạt động (Luyện tập, Vận dụng...)." }
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
  
  // Lấy chiến lược đặc thù cho môn học
  const specificStrategy = SUBJECT_STRATEGIES[subject] || "Tích hợp công nghệ hỗ trợ dạy học hiệu quả.";

  return `
  Đóng vai Chuyên gia Sư phạm số và Giáo viên bộ môn ${subject}.
  
  BỐI CẢNH: Bạn đang hỗ trợ giáo viên lớp ${grade} chuyển đổi số giáo án theo định hướng GDPT 2018.
  CHIẾN LƯỢC MÔN HỌC: "${specificStrategy}"

  NHIỆM VỤ: PHÂN TÍCH VÀ TÍCH HỢP NĂNG LỰC SỐ (NLS) THEO CẤU TRÚC "TỔNG HỢP - CHI TIẾT".
  
  --- BƯỚC 1: XÁC ĐỊNH CẤU TRÚC ---
  - Xác định giáo án có mấy tiết (Tiết 1, Tiết 2...).
  - Tìm TẤT CẢ các hoạt động: Mở đầu, Hình thành kiến thức, Luyện tập, Vận dụng.

  --- BƯỚC 2: VIẾT NỘI DUNG (JSON) ---
  
  1. PHẦN NĂNG LỰC (objectives_addition) -> ĐÂY LÀ PHẦN TỔNG HỢP:
     - Viết nội dung NLS tổng quát cho TỪNG TIẾT dạy.
     - Nếu bài có 2 tiết, hãy viết 2 dòng riêng biệt.
     - QUAN TRỌNG: KHÔNG được ghi chữ "(Tiết 1)", "(Tiết 2)" vào văn bản (để tích hợp âm thầm). Chỉ ghi nội dung năng lực.
     - Định dạng: "👉 ${label}: [Tóm tắt các công cụ và kỹ năng số sẽ dùng trong tiết này]"

  2. PHẦN HOẠT ĐỘNG (activities_enhancement) -> ĐÂY LÀ PHẦN CHI TIẾT:
     - Rà soát TẤT CẢ các hoạt động: Hoạt động 1, Hoạt động 2, Luyện tập, Vận dụng...
     - Nếu hoạt động nào có thể ứng dụng công nghệ, hãy viết hướng dẫn chi tiết vào đó.
     - Trích dẫn CHÍNH XÁC tên hoạt động gốc (ví dụ: "Hoạt động 1: Khởi động", "Hoạt động 2.1...", "Hoạt động Luyện tập").
     - Viết nội dung: "👉 ${label}: GV dùng [Công cụ] để [Làm gì], HS sử dụng [Thiết bị] để [Thao tác gì]..."

  YÊU CẦU ĐẦU RA (JSON CHUẨN - KHÔNG MARKDOWN):
  {
    "objectives_addition": "👉 ${label}: [Nội dung tổng hợp tiết 1]\\n👉 ${label}: [Nội dung tổng hợp tiết 2]",
    "materials_addition": "",
    "activities_enhancement": [
      { "activity_name": "[Tên chính xác Hoạt động 1]", "enhanced_content": "👉 ${label}: [Hướng dẫn chi tiết...]" },
      { "activity_name": "[Tên chính xác Hoạt động 2]", "enhanced_content": "👉 ${label}: [Hướng dẫn chi tiết...]" },
      { "activity_name": "[Tên chính xác Hoạt động Luyện tập]", "enhanced_content": "👉 ${label}: [Hướng dẫn chi tiết...]" },
      { "activity_name": "[Tên chính xác Hoạt động Vận dụng]", "enhanced_content": "👉 ${label}: [Hướng dẫn chi tiết...]" }
    ]
  }

  NỘI DUNG GIÁO ÁN GỐC:
  """
  ${text.substring(0, 15000)}
  """
  `;
};