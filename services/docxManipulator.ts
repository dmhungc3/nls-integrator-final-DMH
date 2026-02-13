import JSZip from 'jszip';
import { GeneratedNLSContent } from '../types';

/**
 * Hàm chèn nội dung vào file Word (Đã cập nhật tham số mode)
 */
export const injectContentIntoDocx = async (
  file: File,
  content: GeneratedNLSContent,
  mode: 'NLS' | 'NAI', // BẮT BUỘC PHẢI CÓ THAM SỐ NÀY
  log: (msg: string) => void
): Promise<Blob> => {
  log("⚙️ Đang giải nén file Word...");
  
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);
  let xml = await zipContent.file("word/document.xml")?.async("string");
  if (!xml) throw new Error("File Word bị lỗi (không tìm thấy document.xml)");

  // Cấu hình màu sắc theo chế độ
  const prefixTitle = mode === 'NAI' ? "👉 Tích hợp AI Gen:" : "👉 Tích hợp NLS:";
  const colorCode = mode === 'NAI' ? "E11D48" : "1D4ED8"; // Đỏ (AI) hoặc Xanh (NLS)
  const actPrefix = mode === 'NAI' ? "➤ HOẠT ĐỘNG AI:" : "➤ HOẠT ĐỘNG SỐ:";

  // 1. CHÈN MỤC TIÊU
  if (content.objectives_addition) {
    log(`🎯 Đang chèn mục tiêu ${mode}...`);
    const targetKeywords = ["2. Năng lực", "II. Năng lực", "Năng lực", "Yêu cầu cần đạt", "Mục tiêu bài học"];
    const xmlToInsert = createParagraphXML(`${prefixTitle} ${content.objectives_addition}`, colorCode);

    let inserted = false;
    for (const keyword of targetKeywords) {
        const regex = new RegExp(`(<w:t>|<w:t [^>]*>)[^<]*${keyword}[^<]*</w:t>`, 'i');
        const match = xml.match(regex);
        if (match && match.index !== undefined) {
            const endOfParaIndex = xml.indexOf("</w:p>", match.index);
            if (endOfParaIndex !== -1) {
                const insertPosition = endOfParaIndex + 6;
                xml = xml.slice(0, insertPosition) + xmlToInsert + xml.slice(insertPosition);
                inserted = true;
                break;
            }
        }
    }
    // Nếu không tìm thấy từ khóa, chèn vào đầu văn bản
    if (!inserted) { 
        const bodyStart = xml.indexOf("<w:body>") + 8;
        xml = xml.slice(0, bodyStart) + xmlToInsert + xml.slice(bodyStart);
    }
  }

  // 2. CHÈN HỌC LIỆU
  if (content.materials_addition) {
    log("💻 Đang bổ sung Học liệu/Công cụ...");
    const materialKeywords = ["Thiết bị", "Học liệu", "Chuẩn bị", "Đồ dùng"];
    const xmlToInsert = createParagraphXML(`👉 Công cụ: ${content.materials_addition}`, "059669");

    for (const keyword of materialKeywords) {
        const regex = new RegExp(`(<w:t>|<w:t [^>]*>)[^<]*${keyword}[^<]*</w:t>`, 'i');
        const match = xml.match(regex);
        if (match && match.index !== undefined) {
            const endOfParaIndex = xml.indexOf("</w:p>", match.index);
            if (endOfParaIndex !== -1) {
                const insertPosition = endOfParaIndex + 6;
                xml = xml.slice(0, insertPosition) + xmlToInsert + xml.slice(insertPosition);
                break;
            }
        }
    }
  }

  // 3. CHÈN HOẠT ĐỘNG
  if (content.activities_integration.length > 0) {
      log("⚡ Đang lồng ghép Hoạt động...");
      content.activities_integration.forEach(act => {
          const searchKey = act.anchor_text.substring(0, 20).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const actXml = createParagraphXML(`${actPrefix} ${act.content}`, "7C3AED", true);
          const regex = new RegExp(`(<w:t>|<w:t [^>]*>)[^<]*${searchKey}`, 'i');
          const match = xml.match(regex);
          
          if (match && match.index !== undefined) {
               const endOfParaIndex = xml.indexOf("</w:p>", match.index);
               if (endOfParaIndex !== -1) {
                   const insertPos = endOfParaIndex + 6;
                   xml = xml.slice(0, insertPos) + actXml + xml.slice(insertPos);
               }
          }
      });
  }

  // 4. CHÈN PHỤ LỤC
  if (content.appendix_table) {
      log("📊 Đang tạo bảng Phụ lục...");
      const bodyEndIndex = xml.lastIndexOf("</w:sectPr>");
      if (bodyEndIndex !== -1) {
          let appendixXml = createParagraphXML(`PHỤ LỤC: ĐÁNH GIÁ NĂNG LỰC ${mode === 'NAI' ? 'TRÍ TUỆ NHÂN TẠO' : 'SỐ'}`, colorCode, true);
          const lines = content.appendix_table.split('\n');
          lines.forEach(line => {
              if (line.trim()) appendixXml += createParagraphXML(line, "4B5563");
          });
          xml = xml.slice(0, bodyEndIndex) + appendixXml + xml.slice(bodyEndIndex);
      }
  }

  zip.file("word/document.xml", xml);
  return await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
};

function createParagraphXML(text: string, colorHex: string = "000000", isBold: boolean = true): string {
    const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    return `<w:p><w:pPr><w:spacing w:before="120" w:after="120"/><w:rPr><w:b w:val="${isBold ? '1' : '0'}"/><w:color w:val="${colorHex}"/><w:sz w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:b w:val="${isBold ? '1' : '0'}"/><w:color w:val="${colorHex}"/><w:sz w:val="24"/></w:rPr><w:t xml:space="preserve">${safeText}</w:t></w:r></w:p>`;
}