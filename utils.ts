import mammoth from 'mammoth';

// --- CẤU HÌNH MỨC ĐỘ NĂNG LỰC ---
const LEVEL_MAPPING: Record<string, { ten: string, kyHieu: string, nhiemVu: string }> = {
  "Lớp 1": { ten: "Khám phá (L1)", kyHieu: "L1", nhiemVu: "Nhận biết, thao tác chạm/kéo thả." },
  "Lớp 2": { ten: "Khám phá (L1)", kyHieu: "L1", nhiemVu: "Sử dụng phần mềm đơn giản." },
  "Lớp 3": { ten: "Làm quen (L2)", kyHieu: "L2", nhiemVu: "Gõ phím, mở thư mục." },
  "Lớp 4": { ten: "Làm quen (L2)", kyHieu: "L2", nhiemVu: "Soạn thảo, tìm kiếm cơ bản." },
  "Lớp 5": { ten: "Làm quen (L2)", kyHieu: "L2", nhiemVu: "Tạo slide, gửi thư điện tử." },
  "Lớp 6": { ten: "Vận dụng (L3)", kyHieu: "L3", nhiemVu: "Sơ đồ tư duy, lưu trữ đám mây." },
  "Lớp 7": { ten: "Vận dụng (L3)", kyHieu: "L3", nhiemVu: "Xử lý số liệu, làm việc nhóm online." },
  "Lớp 8": { ten: "Tích hợp (L4)", kyHieu: "L4", nhiemVu: "Đa phương tiện, đánh giá tin giả." },
  "Lớp 9": { ten: "Tích hợp (L4)", kyHieu: "L4", nhiemVu: "Giải quyết vấn đề, mô phỏng ảo." },
  "Lớp 10": { ten: "Làm chủ (L5)", kyHieu: "L5", nhiemVu: "Phân tích dữ liệu, trợ lý AI." },
  "Lớp 11": { ten: "Sáng tạo (L6)", kyHieu: "L6", nhiemVu: "Thiết kế sản phẩm, lập trình." },
  "Lớp 12": { ten: "Chuyên gia (L6)", kyHieu: "L6", nhiemVu: "Quản trị dự án số, giải pháp mới." },
};

// --- CÁC MÔ HÌNH DẠY HỌC ---
export const PEDAGOGY_MODELS = {
  "DEFAULT": { name: "Truyền thống nâng cao", desc: "Tích hợp công nghệ vào từng bước lên lớp." },
  "5E": { name: "Mô hình 5E (STEM)", desc: "Gắn kết - Khám phá - Giải thích - Áp dụng - Đánh giá." },
  "PBL": { name: "Dạy học Dự án", desc: "Giải quyết vấn đề thực tiễn qua dự án dài hạn." },
  "FLIPPED": { name: "Lớp học đảo ngược", desc: "HS xem tài liệu ở nhà, lên lớp thảo luận sâu." },
  "GAMIFICATION": { name: "Trò chơi hóa", desc: "Học thông qua trò chơi số (Quizizz, Kahoot)." }
};

const NLS_CONTEXT = `KHUNG NĂNG LỰC SỐ: Vận hành thiết bị, Khai thác dữ liệu, Giao tiếp số, Sáng tạo nội dung, An toàn số.`;
const NAI_CONTEXT = `KHUNG NĂNG LỰC AI: Hiểu biết AI, Prompting, Tư duy phản biện, Đạo đức AI.`;

export const createIntegrationTextPrompt = (
  text: string, subject: string, grade: string, mode: 'NLS' | 'NAI', pedagogy: string
): string => {
  const mucDo = LEVEL_MAPPING[grade] || { ten: "Cơ bản", kyHieu: "L1", nhiemVu: "Làm quen" };
  const context = mode === 'NAI' ? NAI_CONTEXT : NLS_CONTEXT;
  const selectedModel = PEDAGOGY_MODELS[pedagogy as keyof typeof PEDAGOGY_MODELS] || PEDAGOGY_MODELS["DEFAULT"];

  return `
    Đóng vai: Chuyên gia Sư phạm Số.
    Nhiệm vụ: Viết các dòng **BỔ SUNG** để chèn vào giáo án môn ${subject} lớp ${grade}.
    Chế độ: ${mode === 'NAI' ? 'NĂNG LỰC AI' : 'NĂNG LỰC SỐ'}. Mô hình: ${selectedModel.name}.
    
    ⚠️ QUY TẮC SỐ 1 (CHỐNG TRÙNG LẶP - QUAN TRỌNG NHẤT):
    - KHÔNG ĐƯỢC viết lại các mục "Kiến thức", "Phẩm chất", "Năng lực chung" đã có trong bài.
    - CHỈ VIẾT DUY NHẤT các gạch đầu dòng về **Công nghệ/AI** để bổ sung vào danh sách có sẵn.

    ⚠️ QUY TẮC SỐ 2 (LEN LỎI VÀO HOẠT ĐỘNG):
    - Tìm các "Điểm neo" (Anchor) là các bước cụ thể (Ví dụ: "Bước 1", "GV giao nhiệm vụ", "HS thảo luận").
    - Chèn hoạt động công nghệ ngay sau các bước đó.

    NỘI DUNG GIÁO ÁN GỐC: """${text.substring(0, 30000)}"""

    YÊU CẦU ĐẦU RA (ĐỊNH DẠNG LIST NGẮN GỌN):

    ===BAT_DAU_MUC_TIEU===
    + Năng lực số/AI (Bổ sung): Sử dụng [Công cụ] để [Hành động]...
    + Năng lực số/AI (Bổ sung): Phối hợp trên [Nền tảng] để...
    ===KET_THUC_MUC_TIEU===

    ===BAT_DAU_HOC_LIEU===
    + Thiết bị (Bổ sung): Máy tính/Điện thoại kết nối mạng.
    + Phần mềm (Bổ sung): [Tên App], [Link video/web]...
    ===KET_THUC_HOC_LIEU===

    ===BAT_DAU_HOAT_DONG===
    ANCHOR: (Trích dẫn chính xác một câu/tiêu đề bước trong bài. Ví dụ: "Hoạt động 1:", "Bước 2:", "GV yêu cầu:")
    CONTENT: (Mô tả hành động công nghệ ngắn gọn:
    + [NLS]: GV tổ chức cho HS dùng...
    + [NLS]: HS thực hiện thao tác...)
    ---PHAN_CACH_HOAT_DONG---
    ANCHOR: (Điểm neo tiếp theo...)
    CONTENT: (Nội dung...)
    ===KET_THUC_HOAT_DONG===

    ===BAT_DAU_PHU_LUC===
    + Tiêu chí số 1: Thao tác kỹ thuật chính xác.
    + Tiêu chí số 2: Khai thác thông tin đúng mục đích.
    ===KET_THUC_PHU_LUC===
  `;
};

export const extractTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};