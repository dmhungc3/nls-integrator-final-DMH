import PizZip from 'pizzip';
import { GeneratedNLSContent } from '../types';

export const injectContentIntoDocx = async (originalFile: File, content: GeneratedNLSContent, type: 'NLS', logCallback: (msg: string) => void): Promise<Blob> => {
  logCallback("⏳ Đang xử lý file Word (Safe Mode)...");
  const arrayBuffer = await originalFile.arrayBuffer();
  const zip = new PizZip(arrayBuffer);
  const docFile = zip.file("word/document.xml");
  if (!docFile) throw new Error("File Word lỗi cấu trúc.");
  
  let xmlContent = docFile.asText();
  const escapeXml = (str: string) => str.replace(/[<>&'"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','\'':'&apos;','"':'&quot;'}[c] || c));
  const createPara = (text: string, color: string = "2E7D32") => `<w:p><w:pPr><w:jc w:val="left"/><w:spacing w:before="60" w:after="60"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="C00000"/><w:sz w:val="24"/></w:rPr><w:t>👉 [TÍCH HỢP NLS]: </w:t></w:r><w:r><w:rPr><w:i/><w:color w:val="${color}"/><w:sz w:val="24"/></w:rPr><w:t>${escapeXml(text)}</w:t></w:r></w:p>`;
  const safeInsert = (xml: string, key: string, val: string) => {
    const regex = new RegExp(key, 'i');
    const match = xml.match(regex);
    if (match) return xml.replace(regex, `${match[0]}</w:t></w:r></w:p>${createPara(val)}<w:p><w:r><w:t>`);
    return xml;
  };

  if (xmlContent.includes("Năng lực")) xmlContent = safeInsert(xmlContent, "Năng lực", content.objectives_addition);
  else xmlContent = safeInsert(xmlContent, "MỤC TIÊU|Kiến thức", content.objectives_addition);
  xmlContent = safeInsert(xmlContent, "THIẾT BỊ|HỌC LIỆU", content.materials_addition);
  if (content.activities_integration) content.activities_integration.forEach(act => { xmlContent = safeInsert(xmlContent, act.anchor_text, act.content); });
  
  const appendix = `<w:p><w:r><w:br w:type="page"/></w:r></w:p><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>PHỤ LỤC ĐÁNH GIÁ NLS</w:t></w:r></w:p>${createPara(content.appendix_table)}`;
  if(xmlContent.includes("</w:body>")) xmlContent = xmlContent.replace("</w:body>", `${appendix}</w:body>`);

  zip.file("word/document.xml", xmlContent);
  return zip.generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
};