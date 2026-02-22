import PizZip from 'pizzip';
import { GeneratedNLSContent } from '../types';

export const injectContentIntoDocx = async (
  originalFile: File,
  content: GeneratedNLSContent,
  type: 'NLS',
  logCallback: (msg: string) => void
): Promise<Blob> => {
  logCallback("⏳ Đang chuẩn bị cấu trúc file Word an toàn...");
  const arrayBuffer = await originalFile.arrayBuffer();
  const zip = new PizZip(arrayBuffer);
  let xmlContent = zip.file("word/document.xml")?.asText();
  
  // KIỂM TRA CHẶT CHẼ ĐỂ TRÁNH LỖI 'UNDEFINED'
  if (!xmlContent) {
    throw new Error("Không thể đọc cấu trúc file document.xml");
  }

  const createParaXML = (text: string, isBold: boolean = false, color: string = "2E7D32") => {
    const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `
    <w:p>
      <w:pPr><w:jc w:val="left"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:color w:val="FF0000"/><w:sz w:val="24"/></w:rPr>
        <w:t>👉 [TÍCH HỢP NLS]: </w:t>
      </w:r>
      <w:r>
        <w:rPr>${isBold ? '<w:b/>' : ''}<w:color w:val="${color}"/><w:sz w:val="24"/></w:rPr>
        <w:t>${safeText}</w:t>
      </w:r>
    </w:p>`;
  };

  // Sử dụng biến tạm để TypeScript biết chắc chắn nó không undefined
  let updatedXml = xmlContent;

  updatedXml = updatedXml.replace(/(MỤC TIÊU|1\. Kiến thức)/i, `$1${createParaXML(content.objectives_addition, true)}`);
  updatedXml = updatedXml.replace(/(THIẾT BỊ|HỌC LIỆU)/i, `$1${createParaXML(content.materials_addition, true)}`);

  if (content.activities_integration) {
    content.activities_integration.forEach(act => {
      const searchPattern = new RegExp(act.anchor_text, 'gi');
      updatedXml = updatedXml.replace(searchPattern, `${act.anchor_text}${createParaXML(act.content, false, "1565C0")}`);
    });
  }

  const appendix = `<w:p><w:r><w:br w:type="page"/></w:r></w:p>
    <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>PHỤ LỤC ĐÁNH GIÁ NĂNG LỰC SỐ</w:t></w:r></w:p>
    ${createParaXML(content.appendix_table, true)}`;
  
  updatedXml = updatedXml.replace("</w:body>", `${appendix}</w:body>`);

  zip.file("word/document.xml", updatedXml);
  return zip.generate({ 
    type: "blob", 
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE" 
  });
};