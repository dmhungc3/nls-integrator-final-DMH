import PizZip from 'pizzip';

// 1. CẤU HÌNH CHIẾN LƯỢC NLS CHO TỪNG MÔN (BÍ QUYẾT CỐT LÕI)
const SUBJECT_STRATEGIES: Record<string, string> = {
  "Toán": "Tư duy tính toán, Mô hình hóa (GeoGebra, Excel).",
  "Ngữ Văn": "Sáng tạo nội dung số, Văn hóa đọc mạng.",
  "Tiếng Anh": "Giao tiếp số, Học tập cá nhân hóa.",
  "Vật Lí": "Thí nghiệm ảo (PhET), Xử lý số liệu thực nghiệm.",
  "Hóa Học": "Mô phỏng 3D cấu trúc, An toàn hóa chất số.",
  "Sinh Học": "Giải phẫu ảo, Thế giới quan sinh học số.",
  "Lịch Sử": "Tái hiện lịch sử, Bảo tàng số 3D.",
  "Địa Lí": "Bản đồ số (GIS), Thực địa ảo (Google Earth).",
  "Tin Học": "Tư duy máy tính, Đạo đức số.",
  "Công Nghệ": "Thiết kế kỹ thuật (CAD), Mô phỏng.",
  "Nghệ Thuật": "Sáng tạo nghệ thuật số.",
  "Giáo dục thể chất": "Y tế số, Phân tích vận động."
};

// 2. MÔ HÌNH SƯ PHẠM
export const PEDAGOGY_MODELS: Record<string, { name: string; desc: string }> = {
  "DEFAULT": { name: "Tích hợp Sâu & Chi tiết (Deep & Dense)", desc: "Quét sâu vào bảng/văn bản, viết hướng dẫn chi tiết từng bước và tổng hợp ngược lên mục tiêu." }
};

// 3. HÀM ĐỌC FILE WORD
export const extractTextFromDocx = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const zip = new PizZip(e.target?.result as ArrayBuffer);
        // Lấy text thuần để AI đọc nội dung
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
  
  BỐI CẢNH: Bạn đang hỗ trợ giáo viên lớp ${grade} chuyển đổi số giáo án. 
  LƯU Ý: Giáo án này có thể trình bày dạng văn bản HOẶC DẠNG BẢNG (Table).
  CHIẾN LƯỢC: "${strategy}"

  NHIỆM VỤ: TÍCH HỢP NLS MỘT CÁCH "ĐẬM ĐẶC", CHI TIẾT VÀ QUÉT SÂU VÀO CẤU TRÚC.

  --- BƯỚC 1: QUÉT HOẠT ĐỘNG (Deep Scan) ---
  - Rà soát TẤT CẢ các hoạt động: Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng.
  - Nếu giáo án là BẢNG: Hãy tìm tên hoạt động nằm trong các cột/ô.
  - Phân tích xem hoạt động nào có thể "số hóa" mạnh mẽ nhất.

  --- BƯỚC 2: VIẾT NỘI DUNG (JSON) ---
  
  1. PHẦN NĂNG LỰC (objectives_addition) -> TỔNG HỢP NGƯỢC:
     - Dựa trên các công cụ đã chọn ở phần Hoạt động, hãy viết tóm tắt năng lực lên đầu bài.
     - Viết tách dòng cho từng tiết (nếu bài nhiều tiết).
     - Định dạng: "👉 ${label}: [Tiết X sử dụng thành thạo phần mềm A để làm B...]" (Không ghi chữ "(Tiết X)" nếu chỉ có 1 tiết).

  2. PHẦN HOẠT ĐỘNG (activities_enhancement) -> CHI TIẾT CẦM TAY CHỈ VIỆC:
     - Đây là phần quan trọng nhất. KHÔNG viết chung chung kiểu "GV dùng phần mềm".
     - Hãy viết quy trình 3 bước: 
       + Bước 1: GV chuẩn bị gì (Link, File, App)? 
       + Bước 2: HS thao tác gì trên thiết bị (Quét QR, Nhập code, Vẽ hình)? 
       + Bước 3: Kết quả hiển thị ra sao?
     - Trích dẫn CHÍNH XÁC tên hoạt động gốc (ví dụ: "Hoạt động 1", "HĐ Khởi động", "2.1. Tìm hiểu...").

  YÊU CẦU ĐẦU RA (JSON CHUẨN - KHÔNG MARKDOWN):
  {
    "objectives_addition": "👉 ${label}: [Tổng hợp năng lực số của Tiết 1...]\\n👉 ${label}: [Tổng hợp năng lực số của Tiết 2...]",
    "materials_addition": "",
    "activities_enhancement": [
      { 
        "activity_name": "[Tên chính xác Hoạt động 1]", 
        "enhanced_content": "👉 ${label}: [Hướng dẫn chi tiết đậm đặc: GV chiếu... HS dùng... Kết quả...]" 
      },
      { 
        "activity_name": "[Tên chính xác Hoạt động 2]", 
        "enhanced_content": "👉 ${label}: [Hướng dẫn chi tiết đậm đặc...]" 
      },
      { 
        "activity_name": "[Tên chính xác Hoạt động Luyện tập]", 
        "enhanced_content": "👉 ${label}: [Hướng dẫn chi tiết...]" 
      },
      { 
        "activity_name": "[Tên chính xác Hoạt động Vận dụng]", 
        "enhanced_content": "👉 ${label}: [Hướng dẫn chi tiết...]" 
      }
    ]
  }

  NỘI DUNG GIÁO ÁN GỐC:
  """
  ${text.substring(0, 18000)}
  """
  `;
};