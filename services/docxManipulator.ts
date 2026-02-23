import PizZip from 'pizzip';
import { GeneratedNLSContent } from '../types';

export const injectContentIntoDocx = async (
  file: File,
  content: GeneratedNLSContent,
  mode: 'NLS' | 'NAI',
  _log: (msg: string) => void
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const binaryString = e.target?.result;
        if (!binaryString) throw new Error("Lỗi đọc file");

        const zip = new PizZip(binaryString as ArrayBuffer);
        let docXml = zip.file("word/document.xml")?.asText();
        if (!docXml) throw new Error("Cấu trúc Word không hợp lệ");

        const label = mode === 'NLS' ? "Tích hợp NLS" : "Tích hợp AI";

        const formatXml = (text: string) => {
          return (text || "").split('\n').filter(l => l.trim()).map(line => {
            const clean = line.replace(/👉.*?:/g, '').trim();
            // Màu xanh 2E74B5 đúng như anh yêu cầu
            return `<w:p><w:r><w:rPr><w:b/><w:color w:val="2E74B5"/></w:rPr><w:t>👉 ${label}: </w:t></w:r><w:r><w:t>${escapeXml(clean)}</w:t></w:r></w:p>`;
          }).join('');
        };

        // Tìm và chèn vào các vị trí Năng lực, Thiết bị và Hoạt động
        docXml = docXml.replace(/(2\.\s*Năng\s*lực)/g, `$1${formatXml(content.objectives_addition)}`);
        docXml = docXml.replace(/(II\.\s*THIẾT\s*BỊ)/g, `$1${formatXml(content.materials_addition)}`);
        
        content.activities_enhancement.forEach(item => {
          if (docXml && docXml.includes(item.activity_name)) {
            docXml = docXml.replace(item.activity_name, `${item.activity_name}${formatXml(item.enhanced_content)}`);
          }
        });

        zip.file("word/document.xml", docXml);
        const out = zip.generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        resolve(out);
      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
};

const escapeXml = (unsafe: string): string => {
  const map: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' };
  return unsafe.replace(/[<>&'"]/g, c => map[c] || c);
};