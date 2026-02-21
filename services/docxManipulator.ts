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

  const colorCode = mode === 'NAI' ? "E11D48" : "1D4ED8"; // Màu Đỏ hoặc Xanh

  // Hàm chèn nội dung có định dạng (In đậm tiêu đề và xử lý ký tự đặc biệt)
  const insertStyledContent = (keywordArr: string[], textContent: string) => {
      let xmlBlock = "";
      const lines = textContent.split('\n');
      
      lines.forEach(line => {
          const cleanLine = line.trim();
          if (!cleanLine) return;

          // Xử lý tiền tố (Prefix) chuyên nghiệp
          let prefix = "👉 Bổ sung:";
          let body = cleanLine;

          if (cleanLine.includes(":")) {
              const parts = cleanLine.split(':');
              prefix = parts[0] + ":";
              body = cleanLine.substring(prefix.length).trim();
          }

          // Gắn icon theo nội dung (AI hoặc Số)
          const icon = body.toLowerCase().includes("ai") ? "🤖 " : "🌐 ";
          
          xmlBlock += `<w:p>
                  <w:pPr><w:spacing w:before="60" w:after="60"/><w:ind w:left="720"/></w:pPr>
                  <w:r>
                      <w:rPr><w:b/><w:color w:val="${colorCode}"/><w:sz w:val="26"/></w:rPr>
                      <w:t xml:space="preserve">${icon}${prefix} </w:t>
                  </w:r>
                  <w:r>
                      <w:rPr><w:color w:val="000000"/><w:sz w:val="26"/></w:rPr>
                      <w:t xml:space="preserve">${body.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</w:t>
                  </w:r>
              </w:p>`;
      });

      let inserted = false;
      for (const keyword of keywordArr) {
          // Tìm vị trí thẻ text chứa từ khóa
          const regex = new RegExp(`(<w:t>|<w:t [^>]*>)[^<]*${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*</w:t>`, 'i');
          const match = xml!.match(regex);
          
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

  // 1. CHÈN MỤC TIÊU (Vào mục I)
  if (content.objectives_addition) {
    log(`🎯 Tích hợp NLS & AI vào Mục tiêu...`);
    let inserted = insertStyledContent(["Năng lực", "Yêu cầu cần đạt", "Mục tiêu"], content.objectives_addition);
    if (!inserted) log("⚠️ Lưu ý: Không tìm thấy đề mục Năng lực để chèn.");
  }

  // 2. CHÈN HỌC LIỆU (Vào mục II)
  if (content.materials_addition) {
    log("💻 Tích hợp Học liệu số...");
    insertStyledContent(["Thiết bị", "Học liệu", "Chuẩn bị"], content.materials_addition);
  }

  // 3. CHÈN HOẠT ĐỘNG (Lồng ghép vào tiến trình)
  if (content.activities_integration.length > 0) {
      log("⚡ Lồng ghép Hoạt động công nghệ...");
      content.activities_integration.forEach(act => {
          const searchKey = act.anchor_text.trim();
          // Rút gọn từ khóa tìm kiếm để tăng độ chính xác
          const shortKey = searchKey.length > 30 ? searchKey.substring(0, 30) : searchKey;
          insertStyledContent([shortKey], act.content);
      });
  }

  // 4. PHỤ LỤC (Cuối giáo án)
  if (content.appendix_table) {
      log("📊 Tạo bảng ma trận đánh giá...");
      const bodyEndIndex = xml.lastIndexOf("</w:sectPr>");
      if (bodyEndIndex !== -1) {
          let appendixXml = createParagraphXML(`--- PHỤ LỤC: TIÊU CHÍ ĐÁNH GIÁ NĂNG LỰC SỐ & AI ---`, colorCode, true, false);
          const lines = content.appendix_table.split('\n');
          lines.forEach(line => { 
              if (line.trim()) appendixXml += createParagraphXML("✔️ " + line.trim(), "000000", false, true); 
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