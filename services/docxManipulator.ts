import JSZip from 'jszip';
import { GeneratedNLSContent } from '../types';

export const injectContentIntoDocx = async (
  file: File,
  content: GeneratedNLSContent,
  mode: 'NLS' | 'NAI',
  log: (msg: string) => void
): Promise<Blob> => {
  log("⚙️ Đang giải nén file Word...");
  
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);
  let xml = await zipContent.file("word/document.xml")?.async("string");
  if (!xml) throw new Error("File Word bị lỗi (không tìm thấy document.xml)");

  const prefixTitle = mode === 'NAI' ? "👉 Tích hợp AI Gen:" : "👉 Tích hợp NLS:";
  const colorCode = mode === 'NAI' ? "E11D48" : "1D4ED8"; // Màu đỏ hoặc xanh
  const actPrefix = mode === 'NAI' ? "➤ HOẠT ĐỘNG AI:" : "➤ HOẠT ĐỘNG SỐ:";

  // HÀM CHÈN THÔNG MINH (Tách dòng)
  const insertSmartContent = (keywordArr: string[], title: string, textContent: string, isActivity: boolean = false) => {
      let xmlBlock = "";
      
      // 1. Tạo tiêu đề (Đậm, Màu)
      xmlBlock += createParagraphXML(title, isActivity ? "7C3AED" : colorCode, true);
      
      // 2. Tách nội dung thành từng dòng để tạo các đoạn văn riêng biệt
      const lines = textContent.split('\n');
      lines.forEach(line => {
          if (line.trim()) {
              // Nếu dòng bắt đầu bằng dấu gạch đầu dòng, giữ nguyên, ngược lại có thể thêm indent
              xmlBlock += createParagraphXML(line.trim(), "000000", false);
          }
      });

      // 3. Tìm vị trí và chèn
      let inserted = false;
      for (const keyword of keywordArr) {
          // Regex tìm từ khóa trong thẻ w:t
          const regex = new RegExp(`(<w:t>|<w:t [^>]*>)[^<]*${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*</w:t>`, 'i');
          const match = xml!.match(regex); // Dùng xml! để báo TS là xml không null
          if (match && match.index !== undefined) {
              const endOfParaIndex = xml!.indexOf("</w:p>", match.index);
              if (endOfParaIndex !== -1) {
                  const insertPosition = endOfParaIndex + 6;
                  xml = xml!.slice(0, insertPosition) + xmlBlock + xml!.slice(insertPosition);
                  inserted = true;
                  break;
              }
          }
      }
      return inserted;
  };

  // 1. CHÈN MỤC TIÊU
  if (content.objectives_addition) {
    log(`🎯 Đang chèn mục tiêu ${mode}...`);
    const targetKeywords = ["2. Năng lực", "II. Năng lực", "Năng lực", "Yêu cầu cần đạt", "Mục tiêu bài học"];
    const inserted = insertSmartContent(targetKeywords, `${prefixTitle} MỤC TIÊU BỔ SUNG`, content.objectives_addition);
    
    if (!inserted) { // Nếu không tìm thấy, chèn đầu body
        const bodyStart = xml.indexOf("<w:body>") + 8;
        // Logic tạo block xml thủ công cho trường hợp này
        let xmlBlock = createParagraphXML(`${prefixTitle} MỤC TIÊU BỔ SUNG`, colorCode, true);
        content.objectives_addition.split('\n').forEach(line => { if(line.trim()) xmlBlock += createParagraphXML(line.trim(), "000000", false); });
        xml = xml.slice(0, bodyStart) + xmlBlock + xml.slice(bodyStart);
    }
  }

  // 2. CHÈN HỌC LIỆU
  if (content.materials_addition) {
    log("💻 Đang bổ sung Học liệu/Công cụ...");
    const materialKeywords = ["Thiết bị", "Học liệu", "Chuẩn bị", "Đồ dùng"];
    insertSmartContent(materialKeywords, "👉 CÔNG CỤ & HỌC LIỆU SỐ:", content.materials_addition);
  }

  // 3. CHÈN HOẠT ĐỘNG
  if (content.activities_integration.length > 0) {
      log("⚡ Đang lồng ghép Hoạt động...");
      content.activities_integration.forEach(act => {
          const searchKey = act.anchor_text.substring(0, 20); // Lấy 20 ký tự đầu làm neo
          // Với hoạt động, ta truyền 1 mảng chứa anchor text
          insertSmartContent([searchKey], `${actPrefix}`, act.content, true);
      });
  }

  // 4. CHÈN PHỤ LỤC
  if (content.appendix_table) {
      log("📊 Đang tạo bảng Phụ lục...");
      const bodyEndIndex = xml.lastIndexOf("</w:sectPr>");
      if (bodyEndIndex !== -1) {
          let appendixXml = createParagraphXML(`PHỤ LỤC: ĐÁNH GIÁ NĂNG LỰC`, colorCode, true);
          const lines = content.appendix_table.split('\n');
          lines.forEach(line => {
              if (line.trim()) appendixXml += createParagraphXML(line.trim(), "000000", false);
          });
          xml = xml.slice(0, bodyEndIndex) + appendixXml + xml.slice(bodyEndIndex);
      }
  }

  zip.file("word/document.xml", xml);
  return await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
};

function createParagraphXML(text: string, colorHex: string = "000000", isBold: boolean = false): string {
    const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    // w:sz = 26 (tương đương 13pt - chuẩn giáo án)
    // w:spacing w:after="60" (tạo khoảng cách dòng cho thoáng)
    return `<w:p>
              <w:pPr>
                <w:spacing w:before="60" w:after="60"/>
                <w:rPr>
                    <w:b w:val="${isBold ? '1' : '0'}"/>
                    <w:color w:val="${colorHex}"/>
                    <w:sz w:val="26"/> 
                    <w:szCs w:val="26"/>
                </w:rPr>
              </w:pPr>
              <w:r>
                <w:rPr>
                    <w:b w:val="${isBold ? '1' : '0'}"/>
                    <w:color w:val="${colorHex}"/>
                    <w:sz w:val="26"/>
                    <w:szCs w:val="26"/>
                </w:rPr>
                <w:t xml:space="preserve">${safeText}</w:t>
              </w:r>
            </w:p>`;
}