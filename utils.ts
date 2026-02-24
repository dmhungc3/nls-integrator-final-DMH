import PizZip from 'pizzip';

// 1. CHIẾN LƯỢC NLS: CƠ BẢN - THIẾT THỰC - CHUẨN BỘ GD&ĐT
const SUBJECT_STRATEGIES: Record<string, string> = {
  "Toán": "Tư duy tính toán. Ưu tiên: GeoGebra, Excel, Azota, Máy tính cầm tay giả lập.",
  "Ngữ Văn": "Sáng tạo & Văn hóa đọc. Ưu tiên: Padlet, Canva, PowerPoint, E-book.",
  "Tiếng Anh": "Giao tiếp & Tự học. Ưu tiên: Quizizz, Google Forms, YouTube, Từ điển Ozdic.",
  "Vật Lí": "Thí nghiệm ảo. Ưu tiên: PhET Simulations, Excel, Video thí nghiệm.",
  "Hóa Học": "Trực quan hóa chất. Ưu tiên: Bảng tuần hoàn Ptable, PhET, Video thí nghiệm an toàn.",
  "Sinh Học": "Thế giới sống. Ưu tiên: Google Earth, Video 3D tế bào/cơ thể, Hành trang số.",
  "Lịch Sử": "Tư duy thời gian. Ưu tiên: Google Maps, Bảo tàng ảo 3D, Timeline.",
  "Địa Lí": "Bản đồ số. Ưu tiên: Google Maps, Google Earth Pro, Worldometer.",
  "Tin Học": "Tư duy máy tính. Ưu tiên: Python, Scratch, Code.org, Sơ đồ tư duy.",
  "Công nghệ Công nghiệp": "Thiết kế kỹ thuật. Ưu tiên: AutoCAD, Tinkercad, Mô phỏng mạch điện.",
  "Công nghệ Nông nghiệp": "Nông nghiệp 4.0. Ưu tiên: App nhận diện cây trồng, Thiết kế cảnh quan, IoT.",
  "Nghệ Thuật": "Sáng tạo số. Ưu tiên: Canva, Paint, Chỉnh sửa ảnh.",
  "Giáo dục thể chất": "Sức khỏe số. Ưu tiên: Video kỹ thuật, Ứng dụng đếm nhịp tim."
};

// 2. MÔ HÌNH SƯ PHẠM
export const PEDAGOGY_MODELS: Record<string, { name: string; desc: string }> = {
  "DEFAULT": { name: "Trích dẫn Chính xác (Exact Matching)", desc: "AI phải trích dẫn y hệt tên tiêu đề trong giáo án (bao gồm cả số thứ tự A, B, C...) để chèn đúng vị trí." }
};

// 3. HÀM ĐỌC FILE WORD
export const extractTextFromDocx = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const zip = new PizZip(e.target?.result as ArrayBuffer);
        const text = zip.file("word/document.xml")?.asText().replace(/<[^>]+>/g, ' ').replace(/"/g, "'") || "";
        resolve(text);
      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
};

// 4. HÀM TẠO PROMPT (CHỈ ĐẠO AI COPY TIÊU ĐỀ)
export const createIntegrationTextPrompt = (text: string, subject: string, grade: string, mode: 'NLS' | 'NAI') => {
  const strategy = SUBJECT_STRATEGIES[subject] || "Tích hợp công nghệ giáo dục phổ thông hiệu quả.";

  return `
  BỐI CẢNH: Soạn giáo án điện tử theo định hướng GDPT 2018 cho HS lớp ${grade} môn ${subject}.
  CHIẾN LƯỢC: "${strategy}"

  *** CRITICAL INSTRUCTION (BẮT BUỘC): ***
  - ONLY return valid JSON. DO NOT write any introduction.
  - DO NOT use markdown code blocks (\`\`\`json). Just the raw JSON string.
  - Escape all double quotes within the content.

  === NHIỆM VỤ 1: QUÉT HOẠT ĐỘNG (CHI TIẾT & CHÍNH XÁC) ===
  - Rà soát toàn bộ bài dạy.
  - Quan trọng: Khi chọn hoạt động nào, hãy COPY Y HỆT tên tiêu đề của nó trong giáo án gốc.
  - Ví dụ: Nếu giáo án ghi "C. HOẠT ĐỘNG LUYỆN TẬP", bạn phải ghi đúng "C. HOẠT ĐỘNG LUYỆN TẬP" (không được ghi tắt là "Luyện tập").
  - Viết hướng dẫn 3 bước: (1) Công cụ - (2) GV tổ chức - (3) HS thực hiện.

  === NHIỆM VỤ 2: TỔNG HỢP NĂNG LỰC (LIỆT KÊ) ===
  - Gom TẤT CẢ các công cụ/kỹ năng số đã dùng ở Nhiệm vụ 1.
  - Liệt kê chúng vào phần Mục tiêu.

  === CẤU TRÚC JSON ĐẦU RA ===
  {
    "objectives_addition": "- [Năng lực số 1...]\\n- [Năng lực số 2...]",
    "materials_addition": "",
    "activities_enhancement": [
      { 
        "activity_name": "[COPY Y HỆT TÊN TIÊU ĐỀ TRONG GIÁO ÁN GỐC, VÍ DỤ: C. HOẠT ĐỘNG LUYỆN TẬP]", 
        "enhanced_content": "- Công cụ: [Tên]\\n- GV: [Hướng dẫn]\\n- HS: [Thực hiện]" 
      }
    ]
  }

  NỘI DUNG GIÁO ÁN GỐC:
  """
  ${text.substring(0, 20000)}
  """
  `;
};