import mammoth from 'mammoth';

// --- CẤU HÌNH MỨC ĐỘ NĂNG LỰC (ĐÃ CHUẨN HÓA SƯ PHẠM) ---
const LEVEL_MAPPING: Record<string, { ten: string, kyHieu: string, nhiemVu: string }> = {
  // CẤP 1: KHÁM PHÁ & LÀM QUEN (Học thông qua Chơi & Quan sát)
  "Lớp 1": { ten: "Khám phá (Cơ bản 1)", kyHieu: "Level 1", nhiemVu: "Nhận biết, gọi tên thiết bị, thao tác chạm/kéo thả đơn giản dưới sự hướng dẫn trực tiếp." },
  "Lớp 2": { ten: "Khám phá (Cơ bản 1)", kyHieu: "Level 1", nhiemVu: "Sử dụng phần mềm học tập đơn giản, tuân thủ quy tắc an toàn thiết bị." },
  "Lớp 3": { ten: "Làm quen (Cơ bản 2)", kyHieu: "Level 2", nhiemVu: "Gõ phím, truy cập thư mục, sử dụng trình duyệt để xem nội dung được chỉ định." },
  "Lớp 4": { ten: "Làm quen (Cơ bản 2)", kyHieu: "Level 2", nhiemVu: "Soạn thảo văn bản ngắn, tìm kiếm thông tin cơ bản trên Internet với từ khóa đơn giản." },
  "Lớp 5": { ten: "Làm quen (Cơ bản 2)", kyHieu: "Level 2", nhiemVu: "Tạo bài trình chiếu đơn giản, gửi thư điện tử, ý thức về bản quyền nội dung số." },

  // CẤP 2: VẬN DỤNG & KẾT NỐI (Học thông qua Làm & Tương tác)
  "Lớp 6": { ten: "Vận dụng (Trung cấp 1)", kyHieu: "Level 3", nhiemVu: "Tổ chức và lưu trữ dữ liệu khoa học. Sử dụng sơ đồ tư duy số. Biết chọn lọc thông tin cơ bản." },
  "Lớp 7": { ten: "Vận dụng (Trung cấp 1)", kyHieu: "Level 3", nhiemVu: "Sử dụng bảng tính để xử lý số liệu. Trao đổi, thảo luận nhóm trên không gian mạng an toàn." },
  "Lớp 8": { ten: "Tích hợp (Trung cấp 2)", kyHieu: "Level 4", nhiemVu: "Đa phương tiện hóa nội dung (Video/Infographic). Đánh giá độ tin cậy của nguồn tin Internet." },
  "Lớp 9": { ten: "Tích hợp (Trung cấp 2)", kyHieu: "Level 4", nhiemVu: "Giải quyết vấn đề thực tế bằng phần mềm mô phỏng. Sử dụng AI hỗ trợ tra cứu (có kiểm chứng)." },

  // CẤP 3: SÁNG TẠO & LÀM CHỦ (Học thông qua Dự án & Phản biện)
  "Lớp 10": { ten: "Làm chủ (Nâng cao 1)", kyHieu: "Level 5", nhiemVu: "Phân tích dữ liệu phức tạp. Sử dụng AI làm trợ lý (Co-pilot) để lên ý tưởng. Ứng dụng CNTT trong STEM." },
  "Lớp 11": { ten: "Sáng tạo (Nâng cao 2)", kyHieu: "Level 6", nhiemVu: "Thiết kế sản phẩm số chuyên sâu. Lập trình giải quyết bài toán. Tư duy phản biện khi sử dụng AI Generative." },
  "Lớp 12": { ten: "Chuyên gia (Nâng cao 2)", kyHieu: "Level 6", nhiemVu: "Quản trị dự án học tập trên nền tảng số. Đề xuất giải pháp công nghệ mới. Đạo đức và trách nhiệm số cao." },
};

// 1. KHUNG NĂNG LỰC SỐ (DigComp) - CỐT LÕI
const NLS_CONTEXT = `
KHUNG NĂNG LỰC SỐ (Tiêu chuẩn DigComp & GDPT 2018):
1. Vận hành thiết bị & Phần mềm: Sử dụng thành thạo Office, Web, App môn học (GeoGebra, Canva, ChemSketch...).
2. Khai thác dữ liệu: Chiến lược tìm kiếm thông minh, đánh giá nguồn tin (Fake news), quản lý dữ liệu đám mây.
3. Giao tiếp & Hợp tác số: Làm việc nhóm (Zalo/Padlet/Drive), văn hóa ứng xử mạng (Netiquette), công dân số.
4. Sáng tạo nội dung số: Biên tập Video, Infographic, Website, lập trình đơn giản.
5. An toàn & An ninh số: Bảo mật thông tin cá nhân, sức khỏe thể chất/tinh thần thời đại số.
6. Giải quyết vấn đề với Công nghệ: Tư duy máy tính (Computational Thinking), tự khắc phục lỗi kỹ thuật.
`;

// 2. KHUNG NĂNG LỰC AI (AI Literacy) - MỞ RỘNG
const NAI_CONTEXT = `
KHUNG NĂNG LỰC TRÍ TUỆ NHÂN TẠO (AI Competency):
1. Hiểu biết về AI (AI Literacy): Hiểu AI tạo sinh (GenAI) là gì, phân biệt AI và con người, nguyên lý máy học cơ bản.
2. Kỹ năng Prompting (Ra lệnh): Kỹ thuật đặt câu hỏi bối cảnh (Context), vai trò (Persona), tinh chỉnh (Refine) để AI trả lời đúng.
3. Tư duy phản biện với AI (Critical Thinking): Luôn Fact-check (kiểm chứng) thông tin AI, phát hiện ảo giác (Hallucination), không sao chép mù quáng.
4. Đạo đức AI (AI Ethics): Liêm chính học thuật, chống gian lận, tôn trọng bản quyền dữ liệu, thiên kiến (Bias) của AI.
5. Đồng sáng tạo (Co-creation): Dùng AI để Brainstorm ý tưởng, tóm tắt tài liệu, sửa lỗi code/văn bản (AI as a Co-pilot).
`;

/**
 * Tạo câu lệnh Prompt gửi cho Gemini (Đã tối ưu hóa vai trò chuyên gia)
 */
export const createIntegrationTextPrompt = (
  text: string, 
  subject: string, 
  grade: string, 
  mode: 'NLS' | 'NAI'
): string => {
  const mucDo = LEVEL_MAPPING[grade] || { ten: "Cơ bản", kyHieu: "Level 1", nhiemVu: "Làm quen công nghệ" };
  
  // Chọn ngữ cảnh dựa trên Mode
  const context = mode === 'NAI' ? NAI_CONTEXT : NLS_CONTEXT;
  const role = mode === 'NAI' 
    ? "Chuyên gia Giáo dục về AI Generative & Đổi mới sáng tạo" 
    : "Chuyên gia Sư phạm số & Công nghệ giáo dục (EdTech)";
  
  // Hướng dẫn trọng tâm (Instruction)
  const focusInstruction = mode === 'NAI'
    ? "Tập trung đề xuất các hoạt động học sinh tương tác với AI (ChatGPT, Gemini, Copilot...) nhằm phát triển tư duy bậc cao (Phân tích, Đánh giá, Sáng tạo)."
    : "Tập trung đề xuất các hoạt động thực hành trên máy tính/điện thoại, khai thác phần mềm dạy học và tài nguyên số để giải quyết nhiệm vụ học tập.";

  return `
    Đóng vai là: ${role}.
    Nhiệm vụ: Phân tích giáo án môn ${subject} lớp ${grade} và tích hợp ${mode === 'NAI' ? 'NĂNG LỰC TRÍ TUỆ NHÂN TẠO (AI)' : 'NĂNG LỰC SỐ (DIGITAL)'} một cách tự nhiên, hiệu quả.
    
    ĐỐI TƯỢNG HỌC SINH:
    - Trình độ: ${mucDo.ten} (${mucDo.kyHieu}).
    - Yêu cầu năng lực: ${mucDo.nhiemVu}.

    THAM CHIẾU KHUNG NĂNG LỰC:
    ${context}

    YÊU CẦU CỤ THỂ:
    ${focusInstruction}

    NỘI DUNG GIÁO ÁN GỐC:
    """
    ${text.substring(0, 30000)}
    """

    YÊU CẦU ĐẦU RA (BẮT BUỘC DÙNG ĐÚNG CÁC THẺ SAU ĐỂ HỆ THỐNG XỬ LÝ):

    ===BAT_DAU_MUC_TIEU===
    (Viết 2-3 gạch đầu dòng mục tiêu phát triển năng lực. Ngôn ngữ chuẩn sư phạm: "Học sinh sử dụng được...", "Học sinh vận dụng...". KHÔNG viết chung chung.)
    ===KET_THUC_MUC_TIEU===

    ===BAT_DAU_HOC_LIEU===
    (Liệt kê cụ thể: Tên phần mềm, Tên App, Loại thiết bị, Đường link (nếu có ý tưởng). Ví dụ: Máy tính cài GeoGebra, Điện thoại có App Quizizz...)
    ===KET_THUC_HOC_LIEU===

    ===BAT_DAU_HOAT_DONG===
    (Chọn 2-3 vị trí phù hợp nhất trong bài để chèn hoạt động công nghệ)

    ANCHOR: (Trích dẫn chính xác 1 câu ngắn/tiêu đề mục trong giáo án gốc để làm điểm neo chèn nội dung)
    CONTENT: (Mô tả hoạt động ${mode}. Bắt đầu bằng **➤ Tích hợp ${mode}:**. Mô tả rõ: GV giao nhiệm vụ gì? HS làm gì trên máy? Sản phẩm đầu ra là gì?)
    ---PHAN_CACH_HOAT_DONG---

    ANCHOR: (Điểm neo 2...)
    CONTENT: (Nội dung 2...)
    ===KET_THUC_HOAT_DONG===

    ===BAT_DAU_PHU_LUC===
    (Tạo bảng tiêu chí đánh giá (Rubric) dạng text cho hoạt động công nghệ vừa đề xuất. Gồm: Tiêu chí | Mức đạt | Mức chưa đạt)
    ===KET_THUC_PHU_LUC===
  `;
};

export const extractTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};