import PizZip from 'pizzip';
import { GeneratedNLSContent } from '../types';

export const injectContentIntoDocx = async (
  file: File,
  content: GeneratedNLSContent,
  mode: 'NLS' | 'NAI',
  log: (msg: string) => void
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const binaryString = e.target?.result;
        if (!binaryString) { reject(new Error("Lỗi đọc file")); return; }

        const zip = new PizZip(binaryString as ArrayBuffer);
        
        // 1. Chuẩn hóa dữ liệu thành String để tránh lỗi "replace is not a function"
        const safeObjectives = ensureString(content.objectives_addition);
        const safeMaterials = ensureString(content.materials_addition);
        
        let activitiesText = "";
        if (Array.isArray(content.activities_enhancement)) {
            activitiesText = content.activities_enhancement
                .map(item => `★ ${item.activity_name}:\n${item.enhanced_content}`)
                .join('\n\n');
        } else {
            activitiesText = String(content.activities_enhancement || "");
        }

        const title = mode === 'NLS' ? "PHIẾU TÍCH HỢP NĂNG LỰC SỐ (NLS)" : "PHIẾU TÍCH HỢP TRÍ TUỆ NHÂN TẠO (AI)";

        // 2. Tạo XML chèn vào cuối trang
        // Sử dụng màu Xanh (2E74B5) và Đỏ (C00000) giống file mẫu
        const newContentXml = `
        <w:p><w:r><w:br w:type="page"/></w:r></w:p>
        <w:p>
            <w:pPr><w:jc w:val="center"/><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="auto"/></w:pBdr></w:pPr>
            <w:r>
                <w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="2E74B5"/></w:rPr>
                <w:t>${title}</w:t>
            </w:r>
        </w:p>
        
        <w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="C00000"/></w:rPr><w:t>I. BỔ SUNG MỤC TIÊU</w:t></w:r></w:p>
        ${safeObjectives.split('\n').map(line => `
            <w:p><w:r><w:t>${escapeXml(line)}</w:t></w:r></w:p>
        `).join('')}
        
        <w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="C00000"/></w:rPr><w:t>II. BỔ SUNG HỌC LIỆU & THIẾT BỊ</w:t></w:r></w:p>
        ${safeMaterials.split('\n').map(line => `
            <w:p><w:r><w:t>${escapeXml(line)}</w:t></w:r></w:p>
        `).join('')}

        <w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="C00000"/></w:rPr><w:t>III. CHI TIẾT HOẠT ĐỘNG TÍCH HỢP</w:t></w:r></w:p>
        ${activitiesText.split('\n').map(line => `
            <w:p>
                <w:r>
                    <w:rPr>${line.startsWith('★') ? '<w:b/><w:color w:val="000000"/>' : ''}</w:rPr>
                    <w:t>${escapeXml(line)}</w:t>
                </w:r>
            </w:p>
        `).join('')}
        `;

        const originalXml = zip.file("word/document.xml")?.asText();
        if (!originalXml) throw new Error("File Word lỗi cấu trúc");

        // Chèn vào cuối file
        const newXml = originalXml.replace('</w:body>', `${newContentXml}</w:body>`);
        zip.file("word/document.xml", newXml);

        const out = zip.generate({
          type: "blob",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        resolve(out);
      } catch (error) {
        console.error(error);
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

const ensureString = (input: any): string => {
    if (!input) return "";
    if (typeof input === 'string') return input;
    if (Array.isArray(input)) return input.map(item => String(item)).join('\n');
    return String(input);
};

const escapeXml = (unsafe: any) => {
    return String(unsafe || "").replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;'; case '>': return '&gt;'; case '&': return '&amp;'; case '\'': return '&apos;'; case '"': return '&quot;'; default: return c;
        }
    });
};