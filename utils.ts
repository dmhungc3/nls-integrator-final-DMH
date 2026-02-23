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

export const PEDAGOGY_MODELS: Record<string, { name: string; desc: string }> = {
  "DEFAULT": { name: "Linh hoạt (Context-Based)", desc: "Tự động điều chỉnh theo đặc thù môn học và nội dung bài dạy." },
  "5E": { name: "Mô hình 5E (STEM)", desc: "Gắn kết - Khám phá - Giải thích - Áp dụng - Đánh giá (Phù hợp KHTN)." },
  "PBL": { name: "Dạy học Dự án", desc: "Giải quyết vấn đề thực tiễn (Phù hợp KHXH & Công nghệ)." }
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
  
  // Lấy chiến lược đặc thù cho môn học (nếu không có thì dùng mặc định)
  const specificStrategy = SUBJECT_STRATEGIES[subject] || "Tập trung vào việc sử dụng công cụ số để giải quyết vấn đề, tra cứu thông tin và cộng tác trực tuyến.";

  return `
  Đóng vai Chuyên gia Giáo dục số và Chuyên gia bộ môn ${subject}.
  
  BỐI CẢNH: Bạn đang hỗ trợ giáo viên lớp ${grade} chuyển đổi số giáo án theo định hướng GDPT 2018.
  
  CHIẾN LƯỢC CỐT LÕI CHO MÔN ${subject.toUpperCase()}:
  "${specificStrategy}"

  NHIỆM VỤ: Phân tích nội dung giáo án dưới đây và đề xuất nội dung ${label} vào 3 vị trí sau:

  1. MỤC TIÊU NĂNG LỰC (objectives_addition):
     - Viết 2-3 gạch đầu dòng mục tiêu năng lực số/AI cụ thể, đo lường được.
     - Phải gắn liền với nội dung bài (Ví dụ: Đừng nói "dùng phần mềm" chung chung, hãy nói "Dùng GeoGebra để vẽ đồ thị...").

  2. THIẾT BỊ & HỌC LIỆU (materials_addition):
     - Liệt kê tên các phần mềm, ứng dụng, trang web, thiết bị cụ thể.
     - Gợi ý: LMS, App bộ môn, Video mô phỏng, Kính VR...

  3. HOẠT ĐỘNG DẠY HỌC (activities_enhancement):
     - Tìm trong giáo án các hoạt động quan trọng (Hoạt động Khám phá hoặc Luyện tập).
     - Viết lại cách tổ chức hoạt động đó có sử dụng công nghệ (GV làm gì trên máy? HS tương tác thế nào?).
     - Quan trọng: Trích dẫn CHÍNH XÁC tên hoạt động trong giáo án gốc để hệ thống chèn đúng chỗ.

  YÊU CẦU ĐẦU RA (JSON CHUẨN - KHÔNG MARKDOWN):
  {
    "objectives_addition": "👉 ${label}: [Mục tiêu 1]\\n👉 ${label}: [Mục tiêu 2]",
    "materials_addition": "👉 ${label}: [Công cụ 1]\\n👉 ${label}: [Công cụ 2]",
    "activities_enhancement": [
      {
        "activity_name": "Trích dẫn chính xác tên hoạt động gốc (Ví dụ: Hoạt động 1: Khởi động)", 
        "enhanced_content": "👉 ${label}: [Mô tả chi tiết hoạt động với công nghệ...]"
      }
    ]
  }

  NỘI DUNG GIÁO ÁN GỐC:
  """
  ${text.substring(0, 12000)}
  """
  `;
};