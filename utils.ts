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

export const PEDAGOGY_MODELS = {
  "DEFAULT": { name: "Linh hoạt (Context-Based)", desc: "Tự động điều chỉnh theo đặc thù từng môn học." },
  "5E": { name: "Mô hình 5E (STEM/KHTN)", desc: "Gắn kết - Khám phá - Giải thích - Áp dụng - Đánh giá." },
  "PBL": { name: "Dạy học Dự án (XH/NT)", desc: "Giải quyết vấn đề thực tiễn qua dự án dài hạn." },
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
  const label = mode === 'NAI' ? "Tích hợp AI" : "Tích hợp NLS";

  return `
    Đóng vai: Chuyên gia Sư phạm Số & Công nghệ dạy học Đa lĩnh vực.
    Nhiệm vụ: Phân tích giáo án môn ${subject} lớp ${grade} để chèn hoạt động Công nghệ/AI "thông minh" nhất.
    Chế độ: ${mode === 'NAI' ? 'NĂNG LỰC AI' : 'NĂNG LỰC SỐ'}. Mô hình: ${selectedModel.name}.
    
    ⚠️ QUY TẮC "BẤT KHẢ XÂM PHẠM":
    1. CHỐNG TRÙNG LẶP: Không viết lại kiến thức/phẩm chất cũ.
    2. LEN LỎI: Tìm đúng tên Hoạt động/Bước để chèn vào dưới.
    
    ⚠️ QUY TẮC "THÔNG MINH ĐA MÔN" (CONTEXT-AWARE):
    Hãy đọc kỹ nội dung bài dạy và áp dụng công cụ tương ứng với đặc thù môn học:
    
    1. NHÓM KHTN (Toán, Lý, Hóa, Sinh):
       - Nếu có hình học/đồ thị/cấu trúc phân tử -> Dùng: GeoGebra, Desmos, KingDraw, PhET Simulations.
       - Nếu có tính toán/xử lý số liệu -> Dùng: Excel, Google Sheets.
    
    2. NHÓM KHXH (Văn, Sử, Địa, GDCD):
       - Nếu có tìm hiểu tác giả/địa danh -> Dùng: Google Earth, Google Maps, Tra cứu thư viện số.
       - Nếu có đóng vai/kể chuyện -> Dùng: Canva (làm Poster), PowerPoint (làm Slide), Podcast (thu âm).
       - Nếu có tranh luận/nghị luận -> Dùng: Padlet/Linoit (để thảo luận nhóm), Kỹ thuật "Bể cá" online.

    3. NHÓM NGHỆ THUẬT/THỂ CHẤT (Âm nhạc, MT, GDTC):
       - Âm nhạc/Mỹ thuật: Dùng GarageBand, MuseScore, Paint 3D, AI vẽ tranh (Midjourney/Bing).
       - Thể dục/GDQP: Dùng Video phân tích động tác (Slow motion), App đo bước chân/nhịp tim.
    
    4. NHÓM NGOẠI NGỮ:
       - Dùng: Duolingo, ELSA Speak, Từ điển Online, AI Chatbot để luyện hội thoại.

    NỘI DUNG GIÁO ÁN GỐC: """${text.substring(0, 30000)}"""

    YÊU CẦU ĐẦU RA (ĐỊNH DẠNG CHUẨN):

    ===BAT_DAU_MUC_TIEU===
    👉 ${label}: [Năng lực số] Sử dụng [Công cụ cụ thể] để [Hành động phù hợp với môn học]...
    👉 ${label}: [Năng lực số] Khai thác [Nguồn dữ liệu] để...
    ===KET_THUC_MUC_TIEU===

    ===BAT_DAU_HOC_LIEU===
    👉 ${label}: [Tên App/Phần mềm chuyên dụng cho môn này].
    👉 ${label}: [Link video/web] (liên quan bài học).
    ===KET_THUC_HOC_LIEU===

    ===BAT_DAU_HOAT_DONG===
    ANCHOR: (Trích dẫn Tên hoạt động/Bước thực hiện)
    CONTENT: (Mô tả hành động công nghệ CỤ THỂ:
    👉 ${label}: GV tổ chức cho HS dùng [Công cụ] để [Giải quyết vấn đề của bài]...
    👉 ${label}: HS nộp sản phẩm [Tranh/Slide/Video/File] lên [Nền tảng]...)
    ---PHAN_CACH_HOAT_DONG---
    ANCHOR: (Điểm neo tiếp theo...)
    CONTENT: (Nội dung...)
    ===KET_THUC_HOAT_DONG===

    ===BAT_DAU_PHU_LUC===
    👉 ${label}: Tiêu chí 1: Sử dụng thành thạo [Công cụ đã chọn].
    👉 ${label}: Tiêu chí 2: Sản phẩm số đảm bảo tính [Thẩm mỹ/Chính xác/Sáng tạo].
    ===KET_THUC_PHU_LUC===
  `;
};

export const extractTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};