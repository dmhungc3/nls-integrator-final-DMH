import PizZip from 'pizzip';
import { GeneratedNLSContent } from '../types';

export const injectContentIntoDocx = async (originalFile: File, content: GeneratedNLSContent, type: 'NLS', logCallback: (msg: string) => void): Promise<Blob> => {
  logCallback("⏳ Đang phân tích cấu trúc Word...");
  const arrayBuffer = await originalFile.arrayBuffer();
  const zip = new PizZip(arrayBuffer);
  let xmlContent = zip.file("word/document.xml")?.asText();
  if (!xmlContent) throw new Error("File không đúng định dạng.");

  const createParaXML = (text: string, color: string = "2E7D32") => `
    <w:p><w:pPr><w:spacing w:before="120" w:after="120"/></w:pPr>
    <w:r><w:rPr><w:b/><w:color w:val="${color}"/><w:sz w:val="24"/></w:rPr>
    <w:t>${text}</w:t></w:r></w:p>`;

  // Chèn vào Mục tiêu và Thiết bị
  xmlContent = xmlContent.replace("MỤC TIÊU", "MỤC TIÊU" + createParaXML(content.objectives_addition));
  xmlContent = xmlContent.replace("THIẾT BỊ", "THIẾT BỊ" + createParaXML(content.materials_addition));

  // Chèn Phụ lục trước thẻ đóng body để không lỗi file
  const appendixXML = `<w:p><w:r><w:br w:type="page"/></w:r></w:p>
    <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:b/><w:sz w:val="28"/><w:t>PHỤ LỤC ĐÁNH GIÁ NĂNG LỰC SỐ</w:t></w:r></w:p>
    ${createParaXML(content.appendix_table)}`;
  
  xmlContent = xmlContent.replace("</w:body>", appendixXML + "</w:body>");

  zip.file("word/document.xml", xmlContent);
  return zip.generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
};