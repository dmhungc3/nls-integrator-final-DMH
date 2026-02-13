import mammoth from 'mammoth';

// --- CẤU HÌNH MỨC ĐỘ NĂNG LỰC ---
const LEVEL_MAPPING: Record<string, { ten: string, kyHieu: string, nhiemVu: string }> = {
  "Lớp 1": { ten: "Khám phá (Level 1)", kyHieu: "L1", nhiemVu: "Nhận biết, thao tác đơn giản." },
  "Lớp 2": { ten: "Khám phá (Level 1)", kyHieu: "L1", nhiemVu: "Sử dụng phần mềm đơn giản." },
  "Lớp 3": { ten: "Làm quen (Level 2)", kyHieu: "L2", nhiemVu: "Gõ phím, truy cập thư mục." },
  "Lớp 4": { ten: "Làm quen (Level 2)", kyHieu: "L2", nhiemVu: "Soạn thảo, tìm kiếm thông tin." },
  "Lớp 5": { ten: "Làm quen (Level 2)", kyHieu: "L2", nhiemVu: "Tạo bài trình chiếu, gửi thư." },
  "Lớp 6": { ten: "Vận dụng (Level 3)", kyHieu: "L3", nhiemVu: "Tổ chức dữ liệu, sơ đồ tư duy." },
  "Lớp 7": { ten: "Vận dụng (Level 3)", kyHieu: "L3", nhiemVu: "Xử lý số liệu, làm việc nhóm." },
  "Lớp 8": { ten: "Tích hợp (Level 4)", kyHieu: "L4", nhiemVu: "Đa phương tiện, đánh giá nguồn tin." },
  "Lớp 9": { ten: "Tích hợp (Level 4)", kyHieu: "L4", nhiemVu: "Giải quyết vấn đề, mô phỏng." },
  "Lớp 10": { ten: "Làm chủ (Level 5)", kyHieu: "L5", nhiemVu: "Phân tích dữ liệu, ứng dụng STEM." },
  "Lớp 11": { ten: "Sáng tạo (Level 6)", kyHieu: "L6", nhiemVu: "Thiết kế sản phẩm, lập trình." },
  "Lớp 12": { ten: "Chuyên gia (Level 6)", kyHieu: "L6", nhiemVu: "Quản trị dự án, giải pháp mới." },
};

// --- CÁC MÔ HÌNH DẠY HỌC ---
export const PEDAGOGY_MODELS = {
  "DEFAULT": { name: "Mặc định (Truyền thống)", desc: "Tích hợp công nghệ vào các bước lên lớp thông thường." },
  "5E": { name: "Mô hình 5E (STEM)", desc: "5 bước: Gắn kết - Khám phá - Giải thích - Áp dụng - Đánh giá." },
  "PBL": { name: "Dạy học Dự án (PBL)", desc: "Học sinh thực hiện dự án giải quyết vấn đề thực tiễn." },
  "FLIPPED": { name: "Lớp học đảo ngược", desc: "HS xem tài liệu số ở nhà, lên lớp thảo luận/thực hành." },
  "GAMIFICATION": { name: "Trò chơi hóa", desc: "Sử dụng trò chơi số (Quizizz, Kahoot) để dạy học." }
};

const NLS_CONTEXT = `KHUNG NĂNG LỰC SỐ (DigComp & GDPT 2018):
1. Vận hành thiết bị & Phần mềm.
2. Khai thác dữ liệu.
3. Giao tiếp & Hợp tác số.
4. Sáng tạo nội dung số.
5. An toàn số.
6. Giải quyết vấn đề.`;

const NAI_CONTEXT = `KHUNG NĂNG LỰC AI:
1. Hiểu biết AI.
2. Kỹ năng Prompting.
3. Tư duy phản biện AI.
4. Đạo đức AI.
5. Đồng sáng tạo.`;

export const createIntegrationTextPrompt = (
  text: string, subject: string, grade: string, mode: 'NLS' | 'NAI', pedagogy: string
): string => {
  const mucDo = LEVEL_MAPPING[grade] || { ten: "Cơ bản", kyHieu: "L1", nhiemVu: "Làm quen" };
  const context = mode === 'NAI' ? NAI_CONTEXT : NLS_CONTEXT;
  const selectedModel = PEDAGOGY_MODELS[pedagogy as keyof typeof PEDAGOGY_MODELS] || PEDAGOGY_MODELS["DEFAULT"];

  const instruction = mode === 'NAI'
    ? "Tập trung vào tương tác với AI (ChatGPT, Gemini) để phát triển tư duy."
    : "Tập trung vào sử dụng phần mềm, thiết bị số, khai thác Internet.";

  return `
    Đóng vai: Chuyên gia Sư phạm số. Nhiệm vụ: Tích hợp ${mode === 'NAI' ? 'NĂNG LỰC AI' : 'NĂNG LỰC SỐ'} vào giáo án môn ${subject} lớp ${grade}.
    Mô hình: ${selectedModel.name}.
    Đối tượng: ${mucDo.ten} - ${mucDo.nhiemVu}.
    
    QUY TẮC TRÌNH BÀY (BẮT BUỘC):
    1. Viết ngắn gọn, súc tích, gạch đầu dòng (-).
    2. Xuống dòng rõ ràng giữa các ý.
    3. KHÔNG viết thành đoạn văn dài dòng.

    NỘI DUNG GIÁO ÁN: """${text.substring(0, 30000)}"""

    YÊU CẦU ĐẦU RA (ĐÚNG ĐỊNH DẠNG):

    ===BAT_DAU_MUC_TIEU===
    - Kiến thức: ...
    - Năng lực số: ...
    - Phẩm chất: ...
    ===KET_THUC_MUC_TIEU===

    ===BAT_DAU_HOC_LIEU===
    - Giáo viên: (Liệt kê phần mềm, link...)
    - Học sinh: (Thiết bị, App...)
    ===KET_THUC_HOC_LIEU===

    ===BAT_DAU_HOAT_DONG===
    ANCHOR: (Trích dẫn điểm neo)
    CONTENT: (Mô tả hoạt động. Bắt đầu bằng "➤ Hoạt động ${mode}:".
    - GV: Yêu cầu...
    - HS: Sử dụng...)
    ---PHAN_CACH_HOAT_DONG---
    ANCHOR: (Điểm neo 2...)
    CONTENT: (Nội dung 2...)
    ===KET_THUC_HOAT_DONG===

    ===BAT_DAU_PHU_LUC===
    (Bảng tiêu chí đánh giá ngắn gọn)
    ===KET_THUC_PHU_LUC===
  `;
};

export const extractTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};