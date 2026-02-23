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
        const originalXml = zip.file("word/document.xml")?.asText();
        if (!originalXml) throw new Error("Cấu trúc file không hợp lệ");

        // 1. CHUẨN HÓA DỮ LIỆU (Tránh lỗi undefined/null gây hỏng XML)
        const safeObjectives = ensureString(content.objectives_addition);
        const safeMaterials = ensureString(content.materials_addition);
        let activitiesText = "";
        
        if (Array.isArray(content.activities_enhancement)) {
            activitiesText = content.activities_enhancement
                .map(item => `★ ${item.activity_name}\n${item.enhanced_content}`)
                .join('\n\n');
        } else {
            activitiesText = String(content.activities_enhancement || "");
        }

        const title = mode === 'NLS' ? "TÍCH HỢP NĂNG LỰC SỐ (NLS)" : "TÍCH HỢP AI";

        // 2. XÂY DỰNG CHUỖI XML AN TOÀN (Viết trên 1 dòng để tránh khoảng trắng thừa)
        // Dùng mã màu HEX chuẩn của Word: 2E74B5 (Xanh), C00000 (Đỏ)
        let nlsXml = `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`; // Ngắt trang mới
        
        // Tiêu đề
        nlsXml += `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="2E74B5"/></w:rPr><w:t>${title}</w:t></w:r></w:p>`;
        
        // Mục I
        nlsXml += `<w:p><w:r><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="C00000"/></w:rPr><w:t>I. BỔ SUNG MỤC TIÊU</w:t></w:r></w:p>`;
        safeObjectives.split('\n').filter(l => l.trim()).forEach(line => {
             nlsXml += `<w:p><w:pPr><w:ind w:left="360"/></w:pPr><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`;
        });

        // Mục II
        nlsXml += `<w:p><w:r><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="C00000"/></w:rPr><w:t>II. BỔ SUNG HỌC LIỆU</w:t></w:r></w:p>`;
        safeMaterials.split('\n').filter(l => l.trim()).forEach(line => {
             nlsXml += `<w:p><w:pPr><w:ind w:left="360"/></w:pPr><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`;
        });

        // Mục III
        nlsXml += `<w:p><w:r><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="C00000"/></w:rPr><w:t>III. CHI TIẾT HOẠT ĐỘNG</w:t></w:r></w:p>`;
        activitiesText.split('\n').filter(l => l.trim()).forEach(line => {
             const isBold = line.startsWith('★');
             nlsXml += `<w:p><w:pPr><w:ind w:left="${isBold ? '0' : '360'}"/></w:pPr><w:r><w:rPr>${isBold ? '<w:b/>' : ''}</w:rPr><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`;
        });

        // 3. THUẬT TOÁN CHÈN "HỘ CHIẾU" (Sửa dứt điểm lỗi corrupt)
        // Tìm vị trí thẻ Section Properties cuối cùng. Đây là nơi an toàn nhất.
        const sectPrIndex = originalXml.lastIndexOf("<w:sectPr");
        const bodyEndIndex = originalXml.lastIndexOf("</w:body>");
        
        let finalXml = "";
        if (sectPrIndex !== -1 && sectPrIndex < bodyEndIndex) {
            // Chèn vào trước sectPr
            finalXml = originalXml.substring(0, sectPrIndex) + nlsXml + originalXml.substring(sectPrIndex);
        } else {
            // Nếu không thấy (file cực đơn giản), chèn trước body end
            finalXml = originalXml.replace("</w:body>", nlsXml + "</w:body>");
        }

        // Ghi đè XML vào Zip
        zip.file("word/document.xml", finalXml);

        const out = zip.generate({
          type: "blob",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          compression: "DEFLATE"
        });

        resolve(out);
      } catch (error) {
        console.error("Lỗi đóng gói:", error);
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
    if (Array.isArray(input)) return input.join('\n');
    return String(input);
};

const escapeXml = (unsafe: string) => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;'; case '>': return '&gt;'; case '&': return '&amp;'; case '\'': return '&apos;'; case '"': return '&quot;'; default: return c;
        }
    });
};