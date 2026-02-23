import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
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
        if (!binaryString) {
          reject(new Error("Không thể đọc file gốc"));
          return;
        }

        const zip = new PizZip(binaryString as ArrayBuffer);
        
        // --- 1. CHUẨN HÓA DỮ LIỆU ĐẦU VÀO (QUAN TRỌNG) ---
        // Đảm bảo mọi trường đều là String, dù AI trả về Array hay null
        
        const safeObjectives = ensureString(content.objectives_addition);
        const safeMaterials = ensureString(content.materials_addition);
        
        let activitiesText = "";
        // Kiểm tra kỹ phần hoạt động
        if (Array.isArray(content.activities_enhancement)) {
            activitiesText = content.activities_enhancement
                .map(item => {
                    const name = item.activity_name || "Hoạt động";
                    const detail = typeof item.enhanced_content === 'string' 
                        ? item.enhanced_content 
                        : JSON.stringify(item.enhanced_content); // Phòng hờ enhanced_content là object
                    return `★ ${name}:\n${detail}`;
                })
                .join('\n\n');
        } else {
            activitiesText = String(content.activities_enhancement || "");
        }

        // --- 2. XỬ LÝ WORD ---
        const title = mode === 'NLS' ? "HỒ SƠ TÍCH HỢP NĂNG LỰC SỐ" : "HỒ SƠ TÍCH HỢP AI";
        
        // Tạo cấu trúc XML mới để chèn vào cuối file
        // Sử dụng escapeXml cho mọi biến đưa vào để tránh lỗi file không mở được
        const newContentXml = `
        <w:p><w:r><w:br w:type="page"/></w:r></w:p>
        <w:p>
            <w:pPr><w:jc w:val="center"/></w:pPr>
            <w:r>
                <w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="2E74B5"/></w:rPr>
                <w:t>${title}</w:t>
            </w:r>
        </w:p>
        
        <w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:u w:val="single"/></w:rPr><w:t>I. BỔ SUNG MỤC TIÊU/NĂNG LỰC</w:t></w:r></w:p>
        ${safeObjectives.split('\n').map(line => `
            <w:p>
                <w:r><w:t>${escapeXml(line)}</w:t></w:r>
            </w:p>
        `).join('')}
        
        <w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:u w:val="single"/></w:rPr><w:t>II. BỔ SUNG HỌC LIỆU SỐ</w:t></w:r></w:p>
        ${safeMaterials.split('\n').map(line => `
            <w:p>
                <w:r><w:t>${escapeXml(line)}</w:t></w:r>
            </w:p>
        `).join('')}

        <w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:u w:val="single"/></w:rPr><w:t>III. THIẾT KẾ LẠI HOẠT ĐỘNG</w:t></w:r></w:p>
        ${activitiesText.split('\n').map(line => `
            <w:p>
                <w:r>
                    <w:rPr>${line.startsWith('★') ? '<w:b/><w:color w:val="C00000"/>' : ''}</w:rPr>
                    <w:t>${escapeXml(line)}</w:t>
                </w:r>
            </w:p>
        `).join('')}
        `;

        // Lấy nội dung XML gốc
        const originalXml = zip.file("word/document.xml")?.asText();
        if (!originalXml) throw new Error("File Word bị lỗi cấu trúc XML");

        // Chèn vào trước thẻ đóng body
        const newXml = originalXml.replace('</w:body>', `${newContentXml}</w:body>`);
        
        // Ghi đè file
        zip.file("word/document.xml", newXml);

        const out = zip.generate({
          type: "blob",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        resolve(out);

      } catch (error) {
        console.error("Lỗi đóng gói file:", error);
        reject(error);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

// --- HÀM TIỆN ÍCH AN TOÀN ---

// Hàm đảm bảo đầu vào luôn là String (Xử lý Array, null, undefined)
const ensureString = (input: any): string => {
    if (!input) return "";
    if (typeof input === 'string') return input;
    if (Array.isArray(input)) {
        // Nếu là mảng, nối các phần tử bằng xuống dòng
        return input.map(item => String(item)).join('\n');
    }
    if (typeof input === 'object') {
        return JSON.stringify(input);
    }
    return String(input);
};

// Hàm xử lý ký tự đặc biệt cho XML (Chống lỗi file corrupt)
const escapeXml = (unsafe: any) => {
    // Ép kiểu sang string trước khi replace để tránh lỗi "replace is not a function"
    const str = String(unsafe || ""); 
    return str.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
};