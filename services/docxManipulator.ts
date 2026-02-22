import PizZip from 'pizzip';
import { GeneratedNLSContent } from '../types';

export const injectContentIntoDocx = async (
  originalFile: File,
  content: GeneratedNLSContent,
  type: 'NLS',
  logCallback: (msg: string) => void
): Promise<Blob> => {
  logCallback("⏳ Đang xử lý cấu trúc file Word an toàn...");
  const arrayBuffer = await originalFile.arrayBuffer();
  const zip = new PizZip(arrayBuffer);
  
  // KIỂM TRA CHẶT CHẼ ĐỂ TRÁNH LỖI 'UNDEFINED'
  const file = zip.file("word/document.xml");
  if (!file) throw new Error("Không thể đọc cấu trúc file Word.");
  
  let xmlContent = file.asText();

  // Hàm tạo XML an toàn (Xử lý các ký tự đặc biệt như &, <, >)
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

  // Nối vào Mục tiêu & Thiết bị (Sử dụng regex linh hoạt)
  xmlContent = xmlContent.replace(/(MỤC TIÊU|1\. Kiến thức)/i, `$1${createParaXML(content.objectives_addition, true)}`);
  xmlContent = xmlContent.replace(/(THIẾT BỊ|HỌC LIỆU)/i, `$1${createParaXML(content.materials_addition, true)}`);

  // Nối vào từng hoạt động cụ thể
  if (content.activities_integration) {
    content.activities_integration.forEach(act => {
      const searchPattern = new RegExp(act.anchor_text, 'gi');
      xmlContent = xmlContent.replace(searchPattern, `${act.anchor_text}${createParaXML(act.content, false, "1565C0")}`);
    });
  }

  // Chèn phụ lục cuối file (trước thẻ đóng </body>)
  const appendix = `<w:p><w:r><w:br w:type="page"/></w:r></w:p>
    <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>PHỤ LỤC ĐÁNH GIÁ NĂNG LỰC SỐ</w:t></w:r></w:p>
    ${createParaXML(content.appendix_table, true)}`;
  
  xmlContent = xmlContent.replace("</w:body>", `${appendix}</w:body>`);

  zip.file("word/document.xml", xmlContent);
  return zip.generate({ 
    type: "blob", 
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE" 
  });
};