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

  // Màu sắc chủ đạo (Xanh/Đỏ)
  const colorCode = mode === 'NAI' ? "E11D48" : "1D4ED8"; 

  // Hàm chèn nội dung dạng danh sách (List Item)
  const insertListItem = (keywordArr: string[], textContent: string, isActivity: boolean = false) => {
      let xmlBlock = "";
      const lines = textContent.split('\n');
      
      lines.forEach(line => {
          const cleanLine = line.trim();
          if (!cleanLine) return;
          
          // Với Hoạt động, ta không tô màu cả dòng mà chỉ tô đậm từ khóa đầu dòng (xử lý sau nếu cần)
          // Ở đây ta dùng màu để làm nổi bật phần bổ sung
          xmlBlock += createParagraphXML(cleanLine, colorCode, false, true); 
      });

      let inserted = false;
      for (const keyword of keywordArr) {
          // Tìm từ khóa (Tiêu đề hoạt động, Mục tiêu...)
          // Regex này tìm đoạn text chứa keyword nằm trong thẻ <w:t>
          const regex = new RegExp(`(<w:t>|<w:t [^>]*>)[^<]*${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*</w:t>`, 'i');
          const match = xml!.match(regex);
          
          if (match && match.index !== undefined) {
              // Tìm điểm kết thúc của đoạn văn chứa từ khóa đó (</w:p>)
              const endOfParaIndex = xml!.indexOf("</w:p>", match.index);
              if (endOfParaIndex !== -1) {
                  const insertPosition = endOfParaIndex + 6;
                  // Chèn ngay bên dưới
                  xml = xml!.slice(0, insertPosition) + xmlBlock + xml!.slice(insertPosition);
                  inserted = true;
                  // Với hoạt động, chỉ chèn 1 lần cho mỗi từ khóa tìm thấy đầu tiên để tránh lặp
                  if(isActivity) break; 
              }
          }
      }
      return inserted;
  };

  // 1. CHÈN MỤC TIÊU
  if (content.objectives_addition) {
    log(`🎯 Bổ sung Mục tiêu...`);
    insertListItem(["Năng lực", "Yêu cầu cần đạt", "Mục tiêu"], content.objectives_addition);
  }

  // 2. CHÈN HỌC LIỆU
  if (content.materials_addition) {
    log("💻 Bổ sung Học liệu...");
    insertListItem(["Thiết bị", "Học liệu", "Chuẩn bị"], content.materials_addition);
  }

  // 3. CHÈN HOẠT ĐỘNG (Quan trọng)
  if (content.activities_integration.length > 0) {
      log("⚡ Lồng ghép Hoạt động vào bài...");
      content.activities_integration.forEach(act => {
          // Lấy Anchor text từ AI (thường là tên hoạt động)
          const searchKey = act.anchor_text.trim(); 
          // Nếu anchor quá dài, cắt bớt để dễ tìm
          const shortKey = searchKey.length > 50 ? searchKey.substring(0, 40) : searchKey;
          
          insertListItem([shortKey], act.content, true);
      });
  }

  // 4. PHỤ LỤC
  if (content.appendix_table) {
      log("📊 Tạo bảng Phụ lục...");
      const bodyEndIndex = xml.lastIndexOf("</w:sectPr>");
      if (bodyEndIndex !== -1) {
          let appendixXml = createParagraphXML(`PHỤ LỤC: TIÊU CHÍ ĐÁNH GIÁ (BỔ SUNG)`, colorCode, true, false);
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
    // Thụt đầu dòng (w:ind) để hòa nhập vào bài
    const indentXML = isIndent ? '<w:ind w:left="720"/>' : '';

    return `<w:p>
              <w:pPr>
                ${indentXML}
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