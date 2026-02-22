import PizZip from 'pizzip';
import { GeneratedNLSContent } from '../types';

export const injectContentIntoDocx = async (
  originalFile: File,
  content: GeneratedNLSContent,
  type: 'NLS',
  logCallback: (msg: string) => void
): Promise<Blob> => {
  logCallback("⏳ Đang xử lý cấu trúc file Word an toàn...");
  const arrayBuffer = await originalFile.arrayBuffer();
  const zip = new PizZip(arrayBuffer);
  
  const docFile = zip.file("word/document.xml");
  // KIỂM TRA CHẶT CHẼ ĐỂ TRÁNH LỖI 'UNDEFINED'
  if (!docFile) throw new Error("File Word bị lỗi cấu trúc (Không tìm thấy document.xml).");
  
  let xmlContent = docFile.asText();
  if (!xmlContent) throw new Error("Không đọc được nội dung XML.");

  // 1. Hàm mã hóa ký tự đặc biệt (QUAN TRỌNG: Tránh lỗi Corrupted File)
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

  // 2. Tạo đoạn văn NLS chuẩn (Màu xanh, in đậm, căn chỉnh)
  const createParaXML = (text: string, isBold: boolean = false, color: string = "2E7D32") => {
    const safeText = escapeXml(text);
    return `
      <w:p>
        <w:pPr><w:spacing w:before="100" w:after="100"/><w:jc w:val="left"/></w:pPr>
        <w:r>
          <w:rPr><w:b/><w:color w:val="C00000"/><w:sz w:val="24"/></w:rPr>
          <w:t>👉 [TÍCH HỢP NLS]: </w:t>
        </w:r>
        <w:r>
          <w:rPr>${isBold ? '<w:b/>' : ''}<w:color w:val="${color}"/><w:sz w:val="24"/></w:rPr>
          <w:t>${safeText}</w:t>
        </w:r>
      </w:p>
    `;
  };

  // 3. Kỹ thuật "Cắt - Chèn - Nối" (An toàn cho Word)
  // Thay vì chèn bừa, ta đóng thẻ cũ lại, chèn NLS, rồi mở thẻ mới để không vỡ cấu trúc
  const safeInsert = (originalXml: string, keyword: string, newContent: string) => {
    // Tìm vị trí từ khóa (Không phân biệt hoa thường)
    const regex = new RegExp(keyword, 'i');
    const match = originalXml.match(regex);
    
    if (!match) return originalXml;

    // Chèn vào: Từ khóa -> Từ khóa + Đóng thẻ + Đoạn NLS + Mở thẻ giả
    const keywordFound = match[0];
    const injection = `${keywordFound}</w:t></w:r></w:p>${createParaXML(newContent)}<w:p><w:r><w:t>`;
    return originalXml.replace(regex, injection);
  };

  // --- THỰC HIỆN CHÈN ---
  
  // Mục tiêu (Ưu tiên tìm mục 2. Năng lực trước)
  if (content.objectives_addition) {
    if (xmlContent.includes("Năng lực")) {
       xmlContent = safeInsert(xmlContent, "Năng lực", content.objectives_addition);
    } else {
       xmlContent = safeInsert(xmlContent, "MỤC TIÊU", content.objectives_addition);
    }
  }

  // Thiết bị
  if (content.materials_addition) {
    xmlContent = safeInsert(xmlContent, "THIẾT BỊ", content.materials_addition);
    if (!xmlContent.includes("👉")) { // Nếu chưa chèn được thì thử từ khóa khác
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
    ${createParaXML(content.appendix_table)}
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