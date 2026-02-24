import PizZip from 'pizzip';

// 1. CẤU HÌNH CHIẾN LƯỢC NLS CHO TỪNG MÔN (BÍ QUYẾT CỐT LÕI)
const SUBJECT_STRATEGIES: Record<string, string> = {
  "Toán": "Tập trung vào 'Tư duy tính toán' (Computational Thinking) và 'Mô hình hóa toán học'. Ưu tiên: GeoGebra, Desmos, Excel. Biến con số khô khan thành hình ảnh trực quan.",
  "Ngữ Văn": "Tập trung vào 'Sáng tạo nội dung số' và 'Văn hóa đọc mạng'. Ưu tiên: Podcast, Infographic (Canva), E-book, Từ điển số.",
  "Tiếng Anh": "Tập trung vào 'Giao tiếp xuyên biên giới' và 'Học tập cá nhân hóa'. Ưu tiên: Elsa Speak, Duolingo, Grammarly, Ozdic.",
  "Vật Lí": "Tập trung vào 'Thí nghiệm ảo' và 'Xử lý số liệu'. Ưu tiên: PhET Simulations, Tracker (phân tích video), Data logger.",
  "Hóa Học": "Tập trung vào 'Mô phỏng cấu trúc 3D' và 'An toàn hóa chất'. Ưu tiên: ChemDraw, PhET, Bảng tuần hoàn tương tác.",
  "Sinh Học": "Tập trung vào 'Giải phẫu ảo' và 'Hệ sinh thái số'. Ưu tiên: Human Anatomy Atlas, Google Earth, iNaturalist.",
  "Lịch Sử": "Tập trung vào 'Tái hiện quá khứ' và 'Bảo tàng số'. Ưu tiên: Bảo tàng ảo 3D, Google Earth VR, Bản đồ lịch sử tương tác.",
  "Địa Lí": "Tập trung vào 'GIS' và 'Dữ liệu thực địa'. Ưu tiên: Google Maps/Earth, GPS, Worldometer.",
  "Tin Học": "Tập trung vào 'Tư duy lập trình', 'Giải quyết vấn đề' và 'Đạo đức số'. Ưu tiên: Python, Scratch, Code.org.",
  "Công Nghệ": "Tập trung vào 'Thiết kế kỹ thuật' và 'Mô phỏng'. Ưu tiên: AutoCAD, Tinkercad (in 3D).",
  "Nghệ Thuật": "Tập trung vào 'Sáng tạo nghệ thuật số'. Ưu tiên: Photoshop, AI Art, GarageBand.",
  "Giáo dục thể chất": "Tập trung vào 'Theo dõi sức khỏe số'. Ưu tiên: Smartwatch, App đo bước chân, Video slow-motion."
};

// 2. MÔ HÌNH SƯ PHẠM
export const PEDAGOGY_MODELS: Record<string, { name: string; desc: string }> = {
  "DEFAULT": { name: "Quét sâu & Đậm đặc (Deep & Dense)", desc: "Quét sâu vào bảng/văn bản, viết hướng dẫn chi tiết dạng danh sách và tổng hợp ngược lên mục tiêu." }
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
  const strategy = SUBJECT_STRATEGIES[subject] || "Tích hợp công nghệ hỗ trợ.";

  return `
  Đóng vai Chuyên gia Sư phạm số và Giáo viên bộ môn ${subject}.
  
  BỐI CẢNH: Hỗ trợ giáo viên lớp ${grade} chuyển đổi số giáo án.
  LƯU Ý QUAN TRỌNG: Giáo án này có thể trình bày dạng VĂN BẢN hoặc BẢNG (Table).
  CHIẾN LƯỢC: "${strategy}"

  QUY TẮC ĐỊNH DẠNG (BẮT BUỘC ĐỂ HIỂN THỊ ĐẸP):
  1. KHÔNG tự ý viết tiêu đề "👉 Tích hợp NLS:" (Hệ thống sẽ tự thêm một lần duy nhất).
  2. Nội dung phải trình bày dạng danh sách, bắt đầu bằng dấu gạch ngang "- ".
  3. Viết chi tiết, "đậm đặc", không viết chung chung.

  NHIỆM VỤ:

  --- BƯỚC 1: QUÉT SÂU HOẠT ĐỘNG (Deep Scan) ---
  - Rà soát TẤT CẢ các hoạt động: Khởi động, Kiến thức mới, Luyện tập, Vận dụng.
  - Tìm tên hoạt động ngay cả khi nó nằm trong cột/ô của Bảng.
  - Viết hướng dẫn "Cầm tay chỉ việc" (Quy trình 3 bước: Chuẩn bị -> Thao tác -> Kết quả).
  - Ví dụ:
    "- GV cung cấp mã QR Padlet..."
    "- HS dùng điện thoại quét mã và đăng tải ý kiến..."
    "- Kết quả hiển thị trực quan trên màn hình..."

  --- BƯỚC 2: TỔNG HỢP NGƯỢC LÊN MỤC TIÊU ---
  - Gom tất cả các công cụ/phần mềm đã dùng ở Bước 1.
  - Viết thành các đầu dòng năng lực tổng quát để đưa vào mục "Năng lực" đầu bài.
  - Nếu bài nhiều tiết: Tách dòng cho từng tiết.

  YÊU CẦU ĐẦU RA (JSON CHUẨN - KHÔNG MARKDOWN):
  {
    "objectives_addition": "- [Tổng hợp năng lực số của Tiết 1...]\\n- [Tổng hợp năng lực số của Tiết 2...]",
    
    "materials_addition": "",
    
    "activities_enhancement": [
      { 
        "activity_name": "[Tên chính xác Hoạt động 1]", 
        "enhanced_content": "- [Bước 1: GV làm gì...]\\n- [Bước 2: HS làm gì...]\\n- [Bước 3: Kết quả...]" 
      },
      { 
        "activity_name": "[Tên chính xác Hoạt động 2]", 
        "enhanced_content": "- [Hướng dẫn chi tiết đậm đặc...]" 
      },
      { 
        "activity_name": "[Tên chính xác Hoạt động Luyện tập]", 
        "enhanced_content": "- [Hướng dẫn chi tiết...]" 
      },
      { 
        "activity_name": "[Tên chính xác Hoạt động Vận dụng]", 
        "enhanced_content": "- [Hướng dẫn chi tiết...]" 
      }
    ]
  }

  NỘI DUNG GIÁO ÁN GỐC:
  """
  ${text.substring(0, 18000)}
  """
  `;
};