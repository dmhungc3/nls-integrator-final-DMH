import JSZip from 'jszip';
import { GeneratedNLSContent } from '../types';

/**
 * Hàm chính: Chèn nội dung AI vào file Word (.docx)
 */
export const injectContentIntoDocx = async (
  file: File,
  content: GeneratedNLSContent,
  log: (msg: string) => void
): Promise<Blob> => {
  log("⚙️ Đang giải nén file Word...");
  
  // 1. Load file Word (cấu trúc thực tế là file Zip)
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);
  
  // 2. Lấy nội dung XML chính (document.xml)
  let xml = await zipContent.file("word/document.xml")?.async("string");
  if (!xml) throw new Error("File Word bị lỗi (không tìm thấy document.xml)");

  // =========================================================================
  // BƯỚC 1: CHÈN MỤC TIÊU NLS VÀO PHẦN "2. NĂNG LỰC"
  // =========================================================================
  if (content.objectives_addition) {
    log("🎯 Đang chèn vào mục '2. Năng lực'...");
    
    // Các từ khóa để nhận diện mục Năng lực trong giáo án
    const targetKeywords = [
        "2. Năng lực", 
        "II. Năng lực", 
        "Năng lực", 
        "Yêu cầu cần đạt", 
        "Mục tiêu bài học"
    ];

    // Tạo đoạn văn XML màu xanh dương, in đậm để chèn vào
    const xmlToInsert = createParagraphXML(
        `👉 Tích hợp NLS: ${content.objectives_addition}`, 
        "1D4ED8" // Màu xanh (Indigo-600)
    );

    let inserted = false;
    for (const keyword of targetKeywords) {
        // Tìm vị trí từ khóa (Case insensitive - không phân biệt hoa thường)
        // Lưu ý: Trong XML, chữ có thể bị ngắt bởi các thẻ style, nên tìm tương đối
        const regex = new RegExp(`(<w:t>|<w:t [^>]*>)[^<]*${keyword}[^<]*</w:t>`, 'i');
        const match = xml.match(regex);

        if (match && match.index !== undefined) {
            // Tìm điểm kết thúc của đoạn văn (paragraph) chứa từ khóa này (</w:p>)
            const endOfParaIndex = xml.indexOf("</w:p>", match.index);
            
            if (endOfParaIndex !== -1) {
                const insertPosition = endOfParaIndex + 6; // +6 là độ dài của chuỗi "</w:p>"
                
                // Cắt chuỗi và chèn vào giữa
                xml = xml.slice(0, insertPosition) + xmlToInsert + xml.slice(insertPosition);
                inserted = true;
                break; // Đã chèn xong thì thoát vòng lặp
            }
        }
    }

    if (!inserted) {
        log("⚠️ Không tìm thấy mục 'Năng lực'. Đã chèn vào đầu tài liệu.");
        // Nếu không tìm thấy thì chèn vào đầu body
        const bodyStart = xml.indexOf("<w:body>") + 8;
        xml = xml.slice(0, bodyStart) + xmlToInsert + xml.slice(bodyStart);
    }
  }

  // =========================================================================
  // BƯỚC 2: CHÈN HỌC LIỆU SỐ VÀO PHẦN "THIẾT BỊ/HỌC LIỆU"
  // =========================================================================
  if (content.materials_addition) {
    log("💻 Đang bổ sung Học liệu số...");
    const materialKeywords = ["Thiết bị", "Học liệu", "Chuẩn bị", "Đồ dùng"];
    const xmlToInsert = createParagraphXML(`👉 Bổ sung Học liệu số: ${content.materials_addition}`, "059669"); // Màu xanh lá

    let inserted = false;
    for (const keyword of materialKeywords) {
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
  }

  // =========================================================================
  // BƯỚC 3: CHÈN HOẠT ĐỘNG (DỰA VÀO ANCHOR TEXT)
  // =========================================================================
  if (content.activities_integration.length > 0) {
      log("⚡ Đang lồng ghép Hoạt động...");
      content.activities_integration.forEach(act => {
          // Chỉ lấy khoảng 20 ký tự đầu của Anchor để tìm cho dễ trúng (tránh lỗi do format Word)
          const searchKey = act.anchor_text.substring(0, 20).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          
          // Tạo XML hoạt động (Màu tím, có khung viền giả lập bằng thụt đầu dòng)
          const actXml = createParagraphXML(`➤ HOẠT ĐỘNG NLS: ${act.content}`, "7C3AED", true);

          // Tìm vị trí chèn
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

  // =========================================================================
  // BƯỚC 4: CHÈN BẢNG PHỤ LỤC VÀO CUỐI BÀI
  // =========================================================================
  if (content.appendix_table) {
      log("📊 Đang tạo bảng Phụ lục cuối bài...");
      const bodyEndIndex = xml.lastIndexOf("</w:sectPr>"); // Tìm vị trí trước khi kết thúc section cuối
      
      if (bodyEndIndex !== -1) {
          // Tiêu đề phụ lục
          let appendixXml = createParagraphXML("PHỤ LỤC: MA TRẬN NĂNG LỰC SỐ", "DC2626", true);
          
          // Tách các dòng trong bảng để tạo các đoạn văn (Giả lập bảng bằng các dòng text)
          // *Lưu ý: Tạo bảng Table chuẩn trong XML rất phức tạp, ở đây dùng text in đậm để an toàn*
          const lines = content.appendix_table.split('\n');
          lines.forEach(line => {
              if (line.trim()) {
                  appendixXml += createParagraphXML(line, "4B5563"); // Màu xám đậm
              }
          });

          xml = xml.slice(0, bodyEndIndex) + appendixXml + xml.slice(bodyEndIndex);
      }
  }

  // 3. Cập nhật lại file document.xml trong gói zip
  zip.file("word/document.xml", xml);

  log("📦 Đang đóng gói file hoàn chỉnh...");
  return await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
};

/**
 * Hàm phụ trợ: Tạo chuỗi XML cho một đoạn văn (Paragraph) chuẩn của Word
 * @param text Nội dung văn bản
 * @param colorHex Mã màu (không có dấu #), ví dụ: "FF0000"
 * @param isBold Có in đậm không
 */
function createParagraphXML(text: string, colorHex: string = "000000", isBold: boolean = true): string {
    // Escape các ký tự đặc biệt của XML
    const safeText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    return `
    <w:p>
        <w:pPr>
            <w:spacing w:before="120" w:after="120"/>
            <w:rPr>
                <w:b w:val="${isBold ? '1' : '0'}"/>
                <w:color w:val="${colorHex}"/>
                <w:sz w:val="24"/> 
            </w:rPr>
        </w:pPr>
        <w:r>
            <w:rPr>
                <w:b w:val="${isBold ? '1' : '0'}"/>
                <w:color w:val="${colorHex}"/>
                <w:sz w:val="24"/>
            </w:rPr>
            <w:t xml:space="preserve">${safeText}</w:t>
        </w:r>
    </w:p>
    `;
}