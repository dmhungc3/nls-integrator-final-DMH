import PizZip from 'pizzip';
import { GeneratedNLSContent } from '../types';

export const injectContentIntoDocx = async (
  originalFile: File,
  content: GeneratedNLSContent,
  type: 'NLS',
  logCallback: (msg: string) => void
): Promise<Blob> => {
  logCallback("⏳ Đang phân tích cấu trúc giáo án...");
  const arrayBuffer = await originalFile.arrayBuffer();
  const zip = new PizZip(arrayBuffer);
  let xmlContent = zip.file("word/document.xml")?.asText();
  if (!xmlContent) throw new Error("File không đúng định dạng.");

  // Hàm tạo đoạn văn bản Word XML chuẩn (Màu xanh lá, In đậm)
  const createParaXML = (text: string, isBold: boolean = false, color: string = "2E7D32") => `
    <w:p><w:pPr><w:spacing w:before="120" w:after="120"/></w:pPr>
    <w:r><w:rPr>${isBold ? '<w:b/>' : ''}<w:color w:val="${color}"/><w:sz w:val="24"/></w:rPr>
    <w:t>${text}</w:t></w:r></w:p>`;

  // 1. Chèn vào Mục tiêu
  xmlContent = xmlContent.replace("MỤC TIÊU", "MỤC TIÊU" + createParaXML(content.objectives_addition, true));
  
  // 2. Chèn vào Thiết bị
  xmlContent = xmlContent.replace("THIẾT BỊ", "THIẾT BỊ" + createParaXML(content.materials_addition, true));

  // 3. Xử lý từng Hoạt động (Dò tìm text neo)
  if (content.activities_integration) {
    content.activities_integration.forEach(act => {
      const searchKey = act.anchor_text.toUpperCase();
      if (xmlContent!.toUpperCase().includes(searchKey)) {
        xmlContent = xmlContent!.replace(new RegExp(searchKey, 'i'), searchKey + createParaXML(act.content, false, "1565C0"));
      }
    });
  }

  // 4. Chèn Phụ lục vào trước thẻ đóng </body> để đảm bảo file chạy
  const appendixXML = `
    <w:p><w:r><w:br w:type="page"/></w:r></w:p>
    <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:b/><w:sz w:val="28"/><w:t>PHỤ LỤC ĐÁNH GIÁ NĂNG LỰC SỐ</w:t></w:r></w:p>
    ${createParaXML(content.appendix_table, true)}`;
  
  xmlContent = xmlContent.replace("</w:body>", appendixXML + "</w:body>");

  zip.file("word/document.xml", xmlContent);
  return zip.generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
};