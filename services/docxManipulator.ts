import JSZip from 'jszip';
import { GeneratedNLSContent } from '../types';

export const injectContentIntoDocx = async (
  file: File,
  content: GeneratedNLSContent,
  mode: 'NLS' | 'NAI',
  log: (msg: string) => void
): Promise<Blob> => {
  log("⚙️ Đang xử lý file Word...");
  
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);
  let xml = await zipContent.file("word/document.xml")?.async("string");
  if (!xml) throw new Error("File Word bị lỗi (không tìm thấy document.xml)");

  const colorCode = mode === 'NAI' ? "E11D48" : "1D4ED8"; // Đỏ hoặc Xanh

  // Hàm chèn nội dung có định dạng đặc biệt
  const insertStyledContent = (keywordArr: string[], textContent: string) => {
      let xmlBlock = "";
      const lines = textContent.split('\n');
      
      lines.forEach(line => {
          const cleanLine = line.trim();
          if (!cleanLine) return;

          // Tách phần Tiêu đề (👉 Tích hợp NLS:) và Nội dung để format riêng
          const parts = cleanLine.split(':');
          if (parts.length > 1 && cleanLine.includes("👉")) {
              const prefix = parts[0] + ":"; // Phần tiêu đề (VD: 👉 Tích hợp NLS:)
              const body = cleanLine.substring(prefix.length); // Phần nội dung
              
              // Tạo đoạn văn: Tiêu đề in đậm màu, Nội dung bình thường
              xmlBlock += `<w:p>
                  <w:pPr><w:spacing w:before="60" w:after="60"/><w:ind w:left="720"/></w:pPr>
                  <w:r>
                      <w:rPr><w:b/><w:color w:val="${colorCode}"/><w:sz w:val="26"/></w:rPr>
                      <w:t xml:space="preserve">${prefix}</w:t>
                  </w:r>
                  <w:r>
                      <w:rPr><w:color w:val="000000"/><w:sz w:val="26"/></w:rPr>
                      <w:t xml:space="preserve">${body}</w:t>
                  </w:r>
              </w:p>`;
          } else {
              // Dòng bình thường
              xmlBlock += createParagraphXML(cleanLine, "000000", false, true);
          }
      });

      let inserted = false;
      for (const keyword of keywordArr) {
          const regex = new RegExp(`(<w:t>|<w:t [^>]*>)[^<]*${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*</w:t>`, 'i');
          const match = xml!.match(regex);
          if (match && match.index !== undefined) {
              const endOfParaIndex = xml!.indexOf("</w:p>", match.index);
              if (endOfParaIndex !== -1) {
                  const insertPosition = endOfParaIndex + 6;
                  xml = xml!.slice(0, insertPosition) + xmlBlock + xml!.slice(insertPosition);
                  inserted = true;
              }
          }
      }
      return inserted;
  };

  // 1. CHÈN MỤC TIÊU
  if (content.objectives_addition) {
    log(`🎯 Bổ sung Năng lực...`);
    let inserted = insertStyledContent(["Năng lực", "Yêu cầu cần đạt"], content.objectives_addition);
    if (!inserted) insertStyledContent(["Mục tiêu"], content.objectives_addition);
  }

  // 2. CHÈN HỌC LIỆU
  if (content.materials_addition) {
    log("💻 Bổ sung Học liệu...");
    insertStyledContent(["Thiết bị", "Học liệu", "Chuẩn bị"], content.materials_addition);
  }

  // 3. CHÈN HOẠT ĐỘNG
  if (content.activities_integration.length > 0) {
      log("⚡ Lồng ghép Hoạt động...");
      content.activities_integration.forEach(act => {
          const searchKey = act.anchor_text.trim();
          const shortKey = searchKey.length > 60 ? searchKey.substring(0, 50) : searchKey;
          insertStyledContent([shortKey], act.content);
      });
  }

  // 4. PHỤ LỤC
  if (content.appendix_table) {
      log("📊 Tạo bảng đánh giá...");
      const bodyEndIndex = xml.lastIndexOf("</w:sectPr>");
      if (bodyEndIndex !== -1) {
          let appendixXml = createParagraphXML(`--- PHỤ LỤC: TIÊU CHÍ ĐÁNH GIÁ CÔNG NGHỆ ---`, colorCode, true, false);
          const lines = content.appendix_table.split('\n');
          lines.forEach(line => { 
              if (line.trim()) appendixXml += createParagraphXML(line.trim(), "000000", false, true); 
          });
          xml = xml.slice(0, bodyEndIndex) + appendixXml + xml.slice(bodyEndIndex);
      }
  }

  zip.file("word/document.xml", xml);
  return await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
};

function createParagraphXML(text: string, colorHex: string = "000000", isBold: boolean = false, isIndent: boolean = false): string {
    const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    const indentXML = isIndent ? '<w:ind w:left="720"/>' : '';
    return `<w:p>
              <w:pPr>
                ${indentXML}
                <w:spacing w:before="60" w:after="60"/>
                <w:rPr>
                    <w:b w:val="${isBold ? '1' : '0'}"/>
                    <w:color w:val="${colorHex}"/>
                    <w:sz w:val="26"/> 
                </w:rPr>
              </w:pPr>
              <w:r>
                <w:rPr>
                    <w:b w:val="${isBold ? '1' : '0'}"/>
                    <w:color w:val="${colorHex}"/>
                    <w:sz w:val="26"/>
                </w:rPr>
                <w:t xml:space="preserve">${safeText}</w:t>
              </w:r>
            </w:p>`;
}