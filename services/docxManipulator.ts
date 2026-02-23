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
        const zip = new PizZip(e.target?.result as ArrayBuffer);
        let docXml = zip.file("word/document.xml")?.asText();
        if (!docXml) throw new Error("Không thể đọc cấu trúc Word");

        const label = mode === 'NLS' ? "Tích hợp NLS" : "Tích hợp AI";

        const formatLine = (text: string) => {
          return text.split('\n').filter(l => l.trim()).map(line => {
            const cleanLine = line.replace(/👉.*?:/g, '').trim();
            return `<w:p><w:r><w:rPr><w:b/><w:color w:val="2E74B5"/></w:rPr><w:t>👉 ${label}: </w:t></w:r><w:r><w:t>${escapeXml(cleanLine)}</w:t></w:r></w:p>`;
          }).join('');
        };

        // Chèn an toàn vào các mục tiêu
        docXml = docXml.replace(/(2\.\s*Năng\s*lực)/g, `$1${formatLine(content.objectives_addition)}`);
        docXml = docXml.replace(/(II\.\s*THIẾT\s*BỊ)/g, `$1${formatLine(content.materials_addition)}`);

        content.activities_enhancement.forEach(item => {
          if (docXml && docXml.includes(item.activity_name)) {
            docXml = docXml.replace(item.activity_name, `${item.activity_name}${formatLine(item.enhanced_content)}`);
          }
        });

        zip.file("word/document.xml", docXml);
        resolve(zip.generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));
      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
};

const escapeXml = (unsafe: string) => unsafe.replace(/[<>&'"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;',"'":"&apos;",'"':'&quot;'}[c as any] || c));