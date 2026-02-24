import PizZip from 'pizzip';

// 1. CẤU HÌNH CHIẾN LƯỢC NLS CHO TỪNG MÔN (BÍ QUYẾT CỐT LÕI)
const SUBJECT_STRATEGIES: Record<string, string> = {
  "Toán": "Tư duy tính toán, Mô hình hóa (GeoGebra, Excel). Ưu tiên biến con số khô khan thành hình ảnh trực quan.",
  "Ngữ Văn": "Sáng tạo nội dung số, Văn hóa đọc mạng. Ưu tiên: Podcast, Infographic (Canva), E-book.",
  "Tiếng Anh": "Giao tiếp xuyên biên giới, Học tập cá nhân hóa. Ưu tiên: Elsa Speak, Duolingo, Grammarly.",
  "Vật Lí": "Thí nghiệm ảo (PhET), Xử lý số liệu thực nghiệm (Tracker).",
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
  "DEFAULT": { name: "Quét sâu & Đậm đặc (Deep & Dense)", desc: "Quét sâu vào bảng/văn bản, viết hướng dẫn chi tiết dạng danh sách và tổng hợp ngược lên mục tiêu." }
};

// 3. HÀM ĐỌC FILE WORD
export const extractTextFromDocx = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const zip = new PizZip(e.target?.result as ArrayBuffer);
        // Lấy text thuần để AI đọc nội dung, loại bỏ các ký tự gây nhiễu
        const text = zip.file("word/document.xml")?.asText().replace(/<[^>]+>/g, ' ').replace(/"/g, "'") || "";
        resolve(text);
      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
};

// 4. HÀM TẠO PROMPT (BỘ NÃO XỬ LÝ - PHIÊN BẢN FIX LỖI JSON)
export const createIntegrationTextPrompt = (text: string, subject: string, grade: string, mode: 'NLS' | 'NAI') => {
  const label = mode === 'NLS' ? "Tích hợp NLS" : "Tích hợp AI";
  const strategy = SUBJECT_STRATEGIES[subject] || "Tích hợp công nghệ hỗ trợ.";

  return `
  Đóng vai Chuyên gia Sư phạm số và Giáo viên bộ môn ${subject}.
  
  BỐI CẢNH: Hỗ trợ giáo viên lớp ${grade} chuyển đổi số giáo án.
  LƯU Ý QUAN TRỌNG: Giáo án này có thể trình bày dạng VĂN BẢN hoặc BẢNG (Table).
  CHIẾN LƯỢC: "${strategy}"

  === QUY TẮC AN TOÀN DỮ LIỆU (BẮT BUỘC ĐỂ TRÁNH LỖI) ===
  1. Trả về đúng định dạng JSON thuần túy. KHÔNG bọc trong \`\`\`json ... \`\`\`.
  2. Tuyệt đối KHÔNG sử dụng dấu ngoặc kép (") bên trong nội dung văn bản. Hãy dùng dấu ngoặc đơn (') thay thế.
  3. KHÔNG được xuống dòng (Enter) bên trong giá trị JSON. Hãy dùng ký tự \\n để biểu thị xuống dòng.
  4. KHÔNG viết tiêu đề "👉 Tích hợp NLS:" (Hệ thống sẽ tự thêm).

  === NHIỆM VỤ ===

  --- BƯỚC 1: QUÉT SÂU HOẠT ĐỘNG (Deep Scan) ---
  - Rà soát TẤT CẢ các hoạt động: Khởi động, Kiến thức mới, Luyện tập, Vận dụng.
  - Tìm tên hoạt động ngay cả khi nó nằm trong cột/ô của Bảng.
  - Viết hướng dẫn "Cầm tay chỉ việc" (Quy trình 3 bước: Chuẩn bị -> Thao tác -> Kết quả).
  - Nội dung phải trình bày dạng danh sách, bắt đầu bằng dấu gạch ngang "- ".

  --- BƯỚC 2: TỔNG HỢP NGƯỢC LÊN MỤC TIÊU ---
  - Gom tất cả các công cụ/phần mềm đã dùng ở Bước 1.
  - Viết thành các đầu dòng năng lực tổng quát để đưa vào mục "Năng lực" đầu bài.
  - Nếu bài nhiều tiết: Tách dòng cho từng tiết (sử dụng \\n để ngắt dòng).

  === MẪU ĐẦU RA MONG MUỐN (JSON) ===
  {
    "objectives_addition": "- [Tổng hợp năng lực số của Tiết 1...]\\n- [Tổng hợp năng lực số của Tiết 2...]",
    "materials_addition": "",
    "activities_enhancement": [
      { 
        "activity_name": "[Tên chính xác Hoạt động 1]", 
        "enhanced_content": "- GV cung cấp mã QR...\\n- HS dùng điện thoại quét...\\n- Kết quả hiển thị..." 
      },
      { 
        "activity_name": "[Tên chính xác Hoạt động 2]", 
        "enhanced_content": "- Hướng dẫn chi tiết..." 
      }
    ]
  }

  NỘI DUNG GIÁO ÁN GỐC:
  """
  ${text.substring(0, 18000)}
  """
  `;
};