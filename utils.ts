import PizZip from 'pizzip';

// 1. CHIẾN LƯỢC NLS: CƠ BẢN - THIẾT THỰC - CHUẨN BỘ GD&ĐT
const SUBJECT_STRATEGIES: Record<string, string> = {
  "Toán": "Tư duy tính toán. Ưu tiên: GeoGebra (Vẽ hình/Đồ thị), Excel (Thống kê), Azota/Olm (Giao bài tập), Máy tính cầm tay giả lập.",
  "Ngữ Văn": "Sáng tạo & Văn hóa đọc. Ưu tiên: Padlet (Thảo luận/Viết), Canva (Làm Poster/Infographic), PowerPoint (Thuyết trình), E-book.",
  "Tiếng Anh": "Giao tiếp & Tự học. Ưu tiên: Quizizz/Kahoot (Kiểm tra từ vựng), Google Forms, YouTube (Video bài học), Từ điển Ozdic/Oxford.",
  "Vật Lí": "Thí nghiệm ảo. Ưu tiên: PhET Simulations (Mô phỏng cơ/điện/quang), Excel (Xử lý số liệu thực hành), Video thí nghiệm thực tế.",
  "Hóa Học": "Trực quan hóa chất. Ưu tiên: Bảng tuần hoàn Ptable, PhET (Cân bằng phản ứng), Video thí nghiệm an toàn.",
  "Sinh Học": "Thế giới sống. Ưu tiên: Google Earth (Sinh cảnh), Video 3D về tế bào/cơ thể người, Hành trang số.",
  "Lịch Sử": "Tư duy thời gian. Ưu tiên: Google Maps (Địa danh lịch sử), Bảo tàng ảo 3D, Trục thời gian (Timeline), Phim tư liệu.",
  "Địa Lí": "Bản đồ số. Ưu tiên: Google Maps, Google Earth Pro, Địa lý hành chính (Atlas điện tử), Số liệu thống kê dân số.",
  "Tin Học": "Tư duy máy tính. Ưu tiên: Python, Scratch, Code.org, Sơ đồ tư duy (MindMap), Soạn thảo văn bản.",
  "Công Nghệ": "Thiết kế & Kỹ thuật. Ưu tiên: Tinkercad (Mô phỏng 3D đơn giản), Sơ đồ nguyên lý (vẽ trên máy), Video quy trình công nghệ.",
  "Nghệ Thuật": "Sáng tạo số. Ưu tiên: Canva, Paint, Ứng dụng chỉnh sửa ảnh cơ bản trên điện thoại.",
  "Giáo dục thể chất": "Sức khỏe số. Ưu tiên: Video hướng dẫn kỹ thuật động tác (Slow motion), Ứng dụng đếm nhịp tim/bước chân."
};

// 2. MÔ HÌNH SƯ PHẠM
export const PEDAGOGY_MODELS: Record<string, { name: string; desc: string }> = {
  "DEFAULT": { name: "Tổng hợp & Thực chiến (Aggregation & Practical)", desc: "Tổng hợp toàn bộ công cụ sử dụng trong bài vào mục Năng lực. Hướng dẫn chi tiết, dễ thực hiện." }
};

// 3. HÀM ĐỌC FILE WORD
export const extractTextFromDocx = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const zip = new PizZip(e.target?.result as ArrayBuffer);
        // Làm sạch văn bản: Xóa thẻ XML, xóa dấu ngoặc kép gây lỗi JSON
        const text = zip.file("word/document.xml")?.asText().replace(/<[^>]+>/g, ' ').replace(/"/g, "'") || "";
        resolve(text);
      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
};

// 4. HÀM TẠO PROMPT (FIX LỖI JSON TUYỆT ĐỐI)
export const createIntegrationTextPrompt = (text: string, subject: string, grade: string, mode: 'NLS' | 'NAI') => {
  const strategy = SUBJECT_STRATEGIES[subject] || "Tích hợp công nghệ giáo dục phổ thông hiệu quả.";

  return `
  BỐI CẢNH: Soạn giáo án điện tử theo định hướng GDPT 2018 cho HS lớp ${grade} môn ${subject}.
  CHIẾN LƯỢC: "${strategy}"

  *** CRITICAL INSTRUCTION (BẮT BUỘC): ***
  - ONLY return valid JSON. DO NOT write any introduction, explanation, or conversational text.
  - DO NOT use markdown code blocks (\`\`\`json). Just the raw JSON string.
  - Escape all double quotes within the content.

  === NHIỆM VỤ 1: QUÉT HOẠT ĐỘNG (CHI TIẾT) ===
  - Rà soát toàn bộ bài dạy (cả trong bảng và văn bản).
  - Chọn các công cụ số THIẾT THỰC, ĐƠN GIẢN, DỄ DÙNG.
  - Viết hướng dẫn 3 bước: (1) Công cụ - (2) GV tổ chức - (3) HS thực hiện.

  === NHIỆM VỤ 2: TỔNG HỢP NĂNG LỰC (LIỆT KÊ) ===
  - Hãy gom TẤT CẢ các công cụ/kỹ năng số đã dùng ở Nhiệm vụ 1.
  - Liệt kê chúng vào phần Mục tiêu (objectives_addition) dưới dạng các gạch đầu dòng.
  - Mỗi gạch đầu dòng là một năng lực cụ thể.
  - Ví dụ:
    "- Năng lực sử dụng GeoGebra để vẽ đồ thị hàm số."
    "- Năng lực khai thác thông tin từ bảng số liệu Excel."

  === CẤU TRÚC JSON ĐẦU RA ===
  {
    "objectives_addition": "- [Năng lực số 1...]\\n- [Năng lực số 2...]\\n- [Năng lực số 3...]",
    "materials_addition": "",
    "activities_enhancement": [
      { 
        "activity_name": "[Tên hoạt động 1 trong bài]", 
        "enhanced_content": "- Công cụ: [Tên]\\n- GV: [Hướng dẫn]\\n- HS: [Thực hiện]" 
      },
      { 
        "activity_name": "[Tên hoạt động 2 trong bài]", 
        "enhanced_content": "- Công cụ: [Tên]\\n- GV: [Hướng dẫn]\\n- HS: [Thực hiện]" 
      }
    ]
  }

  NỘI DUNG GIÁO ÁN GỐC:
  """
  ${text.substring(0, 15000)}
  """
  `;
};