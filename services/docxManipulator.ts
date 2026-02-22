import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { GeneratedNLSContent } from '../types';

export const injectContentIntoDocx = async (
  originalFile: File,
  content: GeneratedNLSContent,
  type: 'NLS',
  logCallback: (msg: string) => void
): Promise<Blob> => {
  logCallback("⏳ Đang đọc file gốc...");
  const arrayBuffer = await originalFile.arrayBuffer();
  
  // Dùng PizZip để giải nén file docx
  const zip = new PizZip(arrayBuffer);
  
  // Lấy nội dung file XML chính của Word
  let xmlContent = zip.file("word/document.xml")?.asText();
  if (!xmlContent) throw new Error("Không đọc được nội dung file Word.");

  logCallback("⚙️ Đang xử lý dữ liệu XML...");

  // HÀM CHÈN NỘI DUNG VÀO WORD (MÔ PHỎNG GIỐNG MẪU)
  const insertParagraph = (xml: string, keyword: string, newText: string, color: string = "2E7D32") => {
    // Tìm vị trí từ khóa (Ví dụ: "I. MỤC TIÊU")
    const index = xml.indexOf(keyword); 
    if (index === -1) return xml; // Không thấy thì bỏ qua

    // Tạo đoạn văn bản mới chuẩn XML Word (Màu xanh, in đậm giống mẫu)
    const newParagraphXML = `
      <w:p>
        <w:pPr><w:spacing w:before="100" w:after="100"/></w:pPr>
        <w:r>
          <w:rPr><w:b/><w:color w:val="${color}"/></w:rPr>
          <w:t>${newText}</w:t>
        </w:r>
      </w:p>
    `;
    
    // Chèn vào ngay sau vị trí tìm thấy
    return xml.replace(keyword, keyword + "</w:t></w:r></w:p>" + newParagraphXML + "<w:p><w:r><w:t>");
  };

  // 1. Chèn vào Mục tiêu
  if (content.objectives_addition) {
    xmlContent = insertParagraph(xmlContent, "MỤC TIÊU", content.objectives_addition);
  }

  // 2. Chèn vào Thiết bị/Học liệu
  if (content.materials_addition) {
    xmlContent = insertParagraph(xmlContent, "THIẾT BỊ", content.materials_addition);
  }

  // 3. Chèn vào từng Hoạt động (Tìm theo tên Neo)
  if (content.activities_integration && content.activities_integration.length > 0) {
    content.activities_integration.forEach(act => {
      // Tìm tên hoạt động trong bài (ví dụ "HOẠT ĐỘNG 1") và chèn nội dung vào sau đó
      // Nếu không tìm thấy chính xác, chèn vào cuối file (tạm thời)
      if (xmlContent!.includes(act.anchor_text)) {
         xmlContent = insertParagraph(xmlContent!, act.anchor_text, "👉 " + act.content);
      } else {
         // Fallback: Nếu không tìm thấy chỗ chèn, gộp chung vào cuối
         xmlContent += `
          <w:p><w:r><w:b/><w:color w:val="C00000"/><w:t>${act.anchor_text}</w:t></w:r></w:p>
          <w:p><w:r><w:color w:val="2E7D32"/><w:t>👉 ${act.content}</w:t></w:r></w:p>
         `;
      }
    });
  }

  // 4. Chèn Phụ lục (Cuối file)
  if (content.appendix_table) {
    xmlContent += `
      <w:p><w:r><w:br w:type="page"/></w:r></w:p>
      <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:b/><w:sz w:val="28"/><w:t>PHỤ LỤC: ĐÁNH GIÁ NĂNG LỰC SỐ</w:t></w:r></w:p>
      <w:p><w:r><w:t>${content.appendix_table}</w:t></w:r></w:p>
    `;
  }

  // Đóng gói lại file Word
  zip.file("word/document.xml", xmlContent);
  
  logCallback("✅ Đã tạo file thành công!");
  
  // Xuất ra file .docx
  const out = zip.generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  return out;
};