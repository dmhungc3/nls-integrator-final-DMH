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
  const zip = new PizZip(arrayBuffer);
  let xmlContent = zip.file("word/document.xml")?.asText();
  if (!xmlContent) throw new Error("Không đọc được nội dung file Word.");

  const createParaXML = (text: string, color: string = "2E7D32") => `
    <w:p><w:pPr><w:spacing w:before="100"/></w:pPr><w:r><w:rPr><w:color w:val="${color}"/><w:b/></w:rPr><w:t>${text}</w:t></w:r></w:p>
  `;

  // Chèn nội dung vào đúng chỗ
  if (content.objectives_addition) 
    xmlContent = xmlContent.replace("MỤC TIÊU", "MỤC TIÊU</w:t></w:r></w:p>" + createParaXML(content.objectives_addition) + "<w:p><w:r><w:t>");
  
  // Chèn Phụ lục vào TRƯỚC thẻ đóng body (Sửa lỗi file không chạy)
  if (content.appendix_table) {
    const appendixXML = `
      <w:p><w:r><w:br w:type="page"/></w:r></w:p>
      <w:p><w:r><w:b/><w:t>PHỤ LỤC ĐÁNH GIÁ</w:t></w:r></w:p>
      ${createParaXML(content.appendix_table)}
    `;
    xmlContent = xmlContent.replace("</w:body>", appendixXML + "</w:body>");
  }

  zip.file("word/document.xml", xmlContent);
  const out = zip.generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  return out;
};