import mammoth from 'mammoth';

// --- CẤU HÌNH MỨC ĐỘ NĂNG LỰC ---
// (Giữ nguyên phần LEVEL_MAPPING cũ)
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

// --- ĐỊNH NGHĨA CÁC MÔ HÌNH DẠY HỌC ---
export const PEDAGOGY_MODELS = {
  "DEFAULT": { name: "Mặc định (Cơ bản)", desc: "Tích hợp hoạt động vào các bước lên lớp thông thường." },
  "5E": { name: "Mô hình 5E (STEM/KHTN)", desc: "5 bước: Gắn kết (Engage) - Khám phá (Explore) - Giải thích (Explain) - Áp dụng (Elaborate) - Đánh giá (Evaluate)." },
  "PBL": { name: "Dạy học Dự án (Project-Based)", desc: "Học sinh giải quyết vấn đề thực tế thông qua việc thực hiện một dự án dài hạn." },
  "FLIPPED": { name: "Lớp học đảo ngược (Flipped)", desc: "Học sinh xem tài liệu/video tại nhà (dùng CNTT), lên lớp để thảo luận và thực hành." },
  "GAMIFICATION": { name: "Trò chơi hóa (Gamification)", desc: "Biến hoạt động học tập thành trò chơi (Quizizz, Kahoot, Bảng xếp hạng)." }
};

const NLS_CONTEXT = `KHUNG NĂNG LỰC SỐ (DigComp & GDPT 2018):
1. Vận hành thiết bị & Phần mềm.
2. Khai thác dữ liệu & Thông tin.
3. Giao tiếp & Hợp tác số.
4. Sáng tạo nội dung số.
5. An toàn & An ninh số.
6. Giải quyết vấn đề với Công nghệ.`;

const NAI_CONTEXT = `KHUNG NĂNG LỰC AI (AI Literacy):
1. Hiểu biết về AI (Cơ chế, Ảo giác).
2. Kỹ năng Prompting (Ra lệnh hiệu quả).
3. Tư duy phản biện với AI (Fact-check).
4. Đạo đức AI (Liêm chính, Bản quyền).
5. Đồng sáng tạo (AI as Co-pilot).`;

export const createIntegrationTextPrompt = (
  text: string, subject: string, grade: string, mode: 'NLS' | 'NAI',
  pedagogy: string
): string => {
  const mucDo = LEVEL_MAPPING[grade] || { ten: "Cơ bản", kyHieu: "L1", nhiemVu: "Làm quen" };
  const context = mode === 'NAI' ? NAI_CONTEXT : NLS_CONTEXT;
  const selectedModel = PEDAGOGY_MODELS[pedagogy as keyof typeof PEDAGOGY_MODELS] || PEDAGOGY_MODELS["DEFAULT"];

  const instruction = mode === 'NAI'
    ? "Tập trung vào các hoạt động tương tác với AI (ChatGPT, Gemini) để phát triển tư duy bậc cao."
    : "Tập trung vào sử dụng phần mềm, thiết bị số, khai thác Internet.";

  return `
    Đóng vai: Chuyên gia Sư phạm số Quốc tế & GDPT 2018.
    Nhiệm vụ: Tích hợp ${mode === 'NAI' ? 'NĂNG LỰC AI' : 'NĂNG LỰC SỐ'} vào giáo án môn ${subject} lớp ${grade}.
    
    YÊU CẦU QUAN TRỌNG VỀ TRÌNH BÀY (FORMAT):
    1. Trình bày KHOA HỌC, NGẮN GỌN, SÚC TÍCH.
    2. Sử dụng gạch đầu dòng (-) cho các ý nhỏ.
    3. KHÔNG viết thành đoạn văn dài dòng.
    4. Phân tách rõ ràng giữa Giáo viên và Học sinh.
    
    MÔ HÌNH DẠY HỌC: **${selectedModel.name}** (${selectedModel.desc}).
    ĐỐI TƯỢNG: ${mucDo.ten} (${mucDo.kyHieu}) - ${mucDo.nhiemVu}.
    KHUNG NĂNG LỰC: ${context}
    ${instruction}

    NỘI DUNG GIÁO ÁN GỐC:
    """
    ${text.substring(0, 30000)}
    """

    YÊU CẦU ĐẦU RA (BẮT BUỘC DÙNG ĐÚNG CÁC THẺ SAU):

    ===BAT_DAU_MUC_TIEU===
    (Viết mục tiêu bổ sung. Dùng gạch đầu dòng. Ví dụ:
    - Kiến thức: ...
    - Năng lực số: ...
    - Phẩm chất: ...)
    ===KET_THUC_MUC_TIEU===

    ===BAT_DAU_HOC_LIEU===
    (Chia rõ 2 phần:
    1. Giáo viên: (Liệt kê phần mềm, thiết bị, link video...)
    2. Học sinh: (Thiết bị cá nhân, App cần cài...))
    ===KET_THUC_HOC_LIEU===

    ===BAT_DAU_HOAT_DONG===
    ANCHOR: (Trích dẫn điểm neo trong bài)
    CONTENT: (Mô tả hoạt động. Bắt đầu bằng **➤ Hoạt động (${mode}):**. Xuống dòng rõ ràng:
    - GV: ...
    - HS: ...
    - Sản phẩm: ...)
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