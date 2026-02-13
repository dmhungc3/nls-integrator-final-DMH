import mammoth from 'mammoth';

// Mapping mức độ năng lực theo khối lớp
const LEVEL_MAPPING: Record<string, { ten: string, kyHieu: string, nhiemVu: string }> = {
  "Lớp 1": { ten: "Cơ bản 1", kyHieu: "CB1", nhiemVu: "Nhiệm vụ đơn giản, có hướng dẫn" },
  "Lớp 2": { ten: "Cơ bản 1", kyHieu: "CB1", nhiemVu: "Nhiệm vụ đơn giản, có hướng dẫn" },
  "Lớp 3": { ten: "Cơ bản 2", kyHieu: "CB2", nhiemVu: "Nhiệm vụ đơn giản, tự chủ hơn" },
  "Lớp 4": { ten: "Cơ bản 2", kyHieu: "CB2", nhiemVu: "Nhiệm vụ đơn giản, tự chủ hơn" },
  "Lớp 5": { ten: "Cơ bản 2", kyHieu: "CB2", nhiemVu: "Nhiệm vụ đơn giản, tự chủ hơn" },
  "Lớp 6": { ten: "Trung cấp 1", kyHieu: "TC1", nhiemVu: "Nhiệm vụ xác định rõ ràng, thường xuyên" },
  "Lớp 7": { ten: "Trung cấp 1", kyHieu: "TC1", nhiemVu: "Nhiệm vụ xác định rõ ràng, thường xuyên" },
  "Lớp 8": { ten: "Trung cấp 2", kyHieu: "TC2", nhiemVu: "Nhiệm vụ không thường xuyên, theo nhu cầu cá nhân" },
  "Lớp 9": { ten: "Trung cấp 2", kyHieu: "TC2", nhiemVu: "Nhiệm vụ không thường xuyên, theo nhu cầu cá nhân" },
  "Lớp 10": { ten: "Nâng cao 1", kyHieu: "NC1", nhiemVu: "Nhiệm vụ phức tạp, hướng dẫn người khác" },
  "Lớp 11": { ten: "Nâng cao 1", kyHieu: "NC1", nhiemVu: "Nhiệm vụ phức tạp, hướng dẫn người khác" },
  "Lớp 12": { ten: "Nâng cao 1", kyHieu: "NC1", nhiemVu: "Nhiệm vụ phức tạp, hướng dẫn người khác" },
};

// 1. KHUNG NĂNG LỰC SỐ (ĐÃ BỔ SUNG MỤC 6: AI CƠ BẢN)
const NLS_CONTEXT = `
KHUNG NĂNG LỰC SỐ (DigComp):
1. Khai thác dữ liệu: Tìm kiếm thông tin, đánh giá độ tin cậy, lưu trữ dữ liệu.
2. Giao tiếp và hợp tác: Tương tác qua mạng xã hội (Zalo, Padlet), chia sẻ tài liệu, quy tắc ứng xử mạng (Netiquette).
3. Sáng tạo nội dung số: Soạn thảo văn bản, tạo bài trình chiếu, chỉnh sửa ảnh/video cơ bản.
4. An toàn số: Bảo vệ thiết bị, dữ liệu cá nhân, sức khỏe thể chất và tinh thần.
5. Giải quyết vấn đề: Xử lý lỗi kỹ thuật, sử dụng công nghệ để giải quyết bài tập.
6. Trí tuệ nhân tạo (Mới): Hiểu biết cơ bản về AI, sử dụng AI để hỗ trợ học tập đơn giản.
`;

// 2. KHUNG NĂNG LỰC AI CHUYÊN SÂU (Dành cho chế độ NAI)
const NAI_CONTEXT = `
KHUNG NĂNG LỰC AI (AI Competency - Chuyên sâu):
1. Hiểu biết về AI (AI Literacy): Hiểu cơ chế hoạt động của GenAI, phân biệt AI và con người.
2. Kỹ năng Prompting: Kỹ thuật đặt câu lệnh (Prompt) rõ ràng, bối cảnh cụ thể, tinh chỉnh câu hỏi.
3. Tư duy phản biện (Critical Thinking): Kiểm chứng thông tin (Fact-check), phát hiện ảo giác AI, không tin tưởng mù quáng.
4. Đạo đức AI (AI Ethics): Liêm chính học thuật, không gian lận, tôn trọng bản quyền và quyền riêng tư.
5. Đồng sáng tạo (Co-creation): Sử dụng AI như "Trợ lý ảo" (Co-pilot) để brainstorm, lập dàn ý, tối ưu hóa giải pháp.
`;

/**
 * Tạo câu lệnh Prompt gửi cho Gemini
 */
export const createIntegrationTextPrompt = (
  text: string, 
  subject: string, 
  grade: string, 
  mode: 'NLS' | 'NAI'
): string => {
  const mucDo = LEVEL_MAPPING[grade] || { ten: "Cơ bản", kyHieu: "CB", nhiemVu: "Cơ bản" };
  
  // Chọn ngữ cảnh dựa trên Mode
  const context = mode === 'NAI' ? NAI_CONTEXT : NLS_CONTEXT;
  const role = mode === 'NAI' 
    ? "Chuyên gia Giáo dục về AI Generative (Trí tuệ nhân tạo)" 
    : "Chuyên gia Sư phạm số và Công nghệ giáo dục";
  
  // Hướng dẫn trọng tâm
  const focusInstruction = mode === 'NAI'
    ? "Tập trung đề xuất hoạt động sử dụng AI (ChatGPT, Gemini) làm trợ lý, rèn luyện kỹ năng Prompting và Phản biện."
    : "Tập trung đề xuất sử dụng phần mềm, thiết bị số, Internet. CÓ THỂ kết hợp AI ở mức độ cơ bản (tra cứu, gợi ý).";

  return `
    Đóng vai là: ${role}.
    Nhiệm vụ: Phân tích giáo án môn ${subject} lớp ${grade} và tích hợp ${mode === 'NAI' ? 'NĂNG LỰC AI' : 'NĂNG LỰC SỐ'}.
    Cấp độ học sinh: ${mucDo.ten} (${mucDo.kyHieu}).

    THAM CHIẾU KHUNG NĂNG LỰC:
    ${context}

    ${focusInstruction}

    NỘI DUNG GIÁO ÁN GỐC:
    """
    ${text.substring(0, 30000)}
    """

    YÊU CẦU ĐẦU RA (BẮT BUỘC DÙNG ĐÚNG CÁC THẺ SAU ĐỂ MÁY TÍNH ĐỌC):

    ===BAT_DAU_MUC_TIEU===
    (Viết 3-4 gạch đầu dòng mục tiêu. Cấu trúc: [Mã]: [Hành động]. Ví dụ: 6.1.TC1: Sử dụng AI để...)
    ===KET_THUC_MUC_TIEU===

    ===BAT_DAU_HOC_LIEU===
    (Liệt kê thiết bị/phần mềm/AI Tool cần dùng. Ví dụ: Máy tính, ChatGPT, Canva...)
    ===KET_THUC_HOC_LIEU===

    ===BAT_DAU_HOAT_DONG===
    (Chọn 2-3 vị trí đắt giá nhất để chèn hoạt động)

    ANCHOR: (Trích dẫn chính xác 1 câu ngắn trong giáo án gốc làm điểm neo)
    CONTENT: (Mô tả chi tiết hoạt động ${mode}. Bắt đầu bằng **➤ Tích hợp ${mode}:**. Mô tả rõ: GV yêu cầu gì? HS tương tác với công cụ thế nào?)
    ---PHAN_CACH_HOAT_DONG---

    ANCHOR: (Điểm neo 2...)
    CONTENT: (Nội dung 2...)
    ===KET_THUC_HOAT_DONG===

    ===BAT_DAU_PHU_LUC===
    (Tạo bảng tiêu chí đánh giá dạng text. Cột 1: Tiêu chí, Cột 2: Yêu cầu cần đạt)
    ===KET_THUC_PHU_LUC===
  `;
};

export const extractTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};