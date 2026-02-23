import PizZip from 'pizzip';
import { GeneratedNLSContent } from '../types';

export const injectContentIntoDocx = async (
  originalFile: File,
  content: GeneratedNLSContent,
  type: 'NLS' | 'NAI', // Nhận diện chế độ
  logCallback: (msg: string) => void
): Promise<Blob> => {
  logCallback(`⏳ Đang xử lý file Word (Chế độ: ${type})...`);
  const arrayBuffer = await originalFile.arrayBuffer();
  const zip = new PizZip(arrayBuffer);
  
  const docFile = zip.file("word/document.xml");
  if (!docFile) throw new Error("File Word lỗi cấu trúc.");
  
  let xmlContent = docFile.asText();

  // 1. Cấu hình hiển thị theo chế độ (NLS: Xanh, AI: Đỏ hồng)
  const label = type === 'NAI' ? "Tích hợp AI" : "Tích hợp NLS";
  const labelColor = type === 'NAI' ? "D81B60" : "2E7D32"; 

  // Hàm xử lý ký tự đặc biệt
  const escapeXml = (str: string) => str.replace(/[<>&'"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','\'':'&apos;','"':'&quot;'}[c] || c));

  // Tạo đoạn văn chuẩn (Bỏ ngoặc vuông [] để giống file mẫu)
  const createPara = (text: string) => `
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:before="60" w:after="60"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:color w:val="C00000"/><w:sz w:val="24"/></w:rPr>
        <w:t>👉 ${label}: </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:i/><w:color w:val="${labelColor}"/><w:sz w:val="24"/></w:rPr>
        <w:t>${escapeXml(text)}</w:t>
      </w:r>
    </w:p>`;

  // Kỹ thuật chèn an toàn
  const safeInsert = (xml: string, keyRegex: RegExp, val: string) => {
    const match = xml.match(keyRegex);
    if (match) {
        // Đóng thẻ cũ, chèn đoạn mới, mở thẻ tiếp
        return xml.replace(keyRegex, `${match[0]}</w:t></w:r></w:p>${createPara(val)}<w:p><w:r><w:t>`);
    }
    return xml;
  };

  // 2. Chèn vào Năng lực
  if (content.objectives_addition) {
    if (xmlContent.match(/(2\.\s*Năng lực|II\.\s*Năng lực|Năng lực:)/i)) {
       xmlContent = safeInsert(xmlContent, /(2\.\s*Năng lực|II\.\s*Năng lực|Năng lực:)/i, content.objectives_addition);
    } else {
       xmlContent = safeInsert(xmlContent, /(MỤC TIÊU|Kiến thức)/i, content.objectives_addition);
    }
  }

  // 3. Chèn vào Thiết bị
  if (content.materials_addition) {
    xmlContent = safeInsert(xmlContent, /(THIẾT BỊ|HỌC LIỆU)/i, content.materials_addition);
  }
  
  // 4. Chèn vào Hoạt động
  if (content.activities_integration) {
    content.activities_integration.forEach(act => {
      // Tìm tương đối chính xác tên hoạt động
      const safeAnchor = act.anchor_text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
      const regex = new RegExp(safeAnchor, 'i');
      if (xmlContent.match(regex)) {
        xmlContent = safeInsert(xmlContent, regex, act.content);
      }
    });
  }

  // 5. Chèn Phụ lục (Tiêu đề thay đổi theo chế độ)
  const appendixTitle = type === 'NAI' ? "TIÊU CHÍ ĐÁNH GIÁ NĂNG LỰC AI" : "TIÊU CHÍ ĐÁNH GIÁ CÔNG NGHỆ";
  const appendix = `
    <w:p><w:r><w:br w:type="page"/></w:r></w:p>
    <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="28"/><w:u w:val="single"/></w:rPr><w:t>--- PHỤ LỤC: ${appendixTitle} ---</w:t></w:r></w:p>
    ${createPara(content.appendix_table)}
  `;
  
  if (xmlContent.includes("</w:body>")) {
      xmlContent = xmlContent.replace("</w:body>", `${appendix}</w:body>`);
  }

  zip.file("word/document.xml", xmlContent);
  return zip.generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
};