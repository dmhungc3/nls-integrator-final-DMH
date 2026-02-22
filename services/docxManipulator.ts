import PizZip from 'pizzip';
import { GeneratedNLSContent } from '../types';

export const injectContentIntoDocx = async (
  originalFile: File,
  content: GeneratedNLSContent,
  type: 'NLS',
  logCallback: (msg: string) => void
): Promise<Blob> => {
  logCallback("⏳ Đang phân tích cấu trúc XML...");
  const arrayBuffer = await originalFile.arrayBuffer();
  const zip = new PizZip(arrayBuffer);
  
  const docFile = zip.file("word/document.xml");
  if (!docFile) throw new Error("File Word bị lỗi cấu trúc (Không tìm thấy document.xml).");
  
  let xmlContent = docFile.asText();
  if (!xmlContent) throw new Error("Không đọc được nội dung XML.");

  // 1. Hàm mã hóa ký tự đặc biệt (Tránh lỗi XML do ký tự lạ)
  const escapeXml = (unsafe: string) => unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });

  // 2. Tạo đoạn văn NLS chuẩn (Màu xanh, in đậm)
  const createNLSXml = (text: string) => {
    const safeText = escapeXml(text);
    return `
      <w:p>
        <w:pPr><w:spacing w:before="100" w:after="100"/><w:jc w:val="left"/></w:pPr>
        <w:r>
          <w:rPr><w:b/><w:color w:val="C00000"/><w:sz w:val="24"/></w:rPr>
          <w:t>👉 [TÍCH HỢP NLS]: </w:t>
        </w:r>
        <w:r>
          <w:rPr><w:i/><w:color w:val="2E7D32"/><w:sz w:val="24"/></w:rPr>
          <w:t>${safeText}</w:t>
        </w:r>
      </w:p>
    `;
  };

  // 3. Kỹ thuật "Cắt - Chèn - Nối" (Fix lỗi file hỏng)
  // Thay vì chèn bừa, ta đóng thẻ cũ lại, chèn NLS, rồi mở thẻ mới
  const safeInsert = (originalXml: string, keyword: string, newContent: string) => {
    // Tìm vị trí từ khóa
    const index = originalXml.indexOf(keyword);
    if (index === -1) return originalXml;

    // Thay thế: KEYWORD -> KEYWORD + Đóng thẻ + Đoạn NLS + Mở thẻ giả
    // </w:t></w:r></w:p> : Kết thúc đoạn văn hiện tại
    // createNLSXml(...) : Chèn đoạn văn NLS
    // <w:p><w:r><w:t>    : Mở đoạn văn mới để chứa phần văn bản phía sau (tránh lỗi)
    
    const injection = `${keyword}</w:t></w:r></w:p>${createNLSXml(newContent)}<w:p><w:r><w:t>`;
    return originalXml.replace(keyword, injection);
  };

  // --- THỰC HIỆN CHÈN ---
  
  // Mục tiêu
  if (content.objectives_addition) {
    xmlContent = safeInsert(xmlContent, "MỤC TIÊU", content.objectives_addition);
    // Dự phòng nếu giáo án dùng "I. MỤC TIÊU" hoặc "1. Kiến thức"
    if (!xmlContent.includes("👉")) xmlContent = safeInsert(xmlContent, "Kiến thức", content.objectives_addition);
  }

  // Thiết bị
  if (content.materials_addition) {
    xmlContent = safeInsert(xmlContent, "THIẾT BỊ", content.materials_addition);
    if (!xmlContent.includes("👉 [TÍCH HỢP NLS]: " + escapeXml(content.materials_addition))) {
       xmlContent = safeInsert(xmlContent, "HỌC LIỆU", content.materials_addition);
    }
  }

  // Hoạt động (Tìm và chèn theo neo)
  if (content.activities_integration) {
    content.activities_integration.forEach(act => {
      // Chỉ chèn nếu tìm thấy neo trong file
      if (xmlContent.includes(act.anchor_text)) {
        xmlContent = safeInsert(xmlContent, act.anchor_text, act.content);
      }
    });
  }

  // Phụ lục (Chèn an toàn vào cuối file)
  const appendixXml = `
    <w:p><w:r><w:br w:type="page"/></w:r></w:p>
    <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>PHỤ LỤC: ĐÁNH GIÁ NĂNG LỰC SỐ</w:t></w:r></w:p>
    ${createNLSXml(content.appendix_table)}
  `;
  
  if (xmlContent.includes("</w:body>")) {
    xmlContent = xmlContent.replace("</w:body>", appendixXml + "</w:body>");
  }

  // Đóng gói lại
  zip.file("word/document.xml", xmlContent);
  
  return zip.generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE"
  });
};