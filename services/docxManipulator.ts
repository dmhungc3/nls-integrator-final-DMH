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
        
        // 1. Chuẩn hóa dữ liệu đầu vào
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

        // 2. Tạo nội dung XML (Đã bỏ bớt Border phức tạp để giảm thiểu lỗi hiển thị)
        // Thêm xml:space="preserve" để tránh lỗi khi chuỗi bị rỗng
        const newContentXml = `
        <w:p><w:r><w:br w:type="page"/></w:r></w:p>
        <w:p>
            <w:pPr><w:jc w:val="center"/></w:pPr>
            <w:r>
                <w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="2E74B5"/></w:rPr>
                <w:t>${title}</w:t>
            </w:r>
        </w:p>
        
        <w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="C00000"/></w:rPr><w:t>I. BỔ SUNG MỤC TIÊU</w:t></w:r></w:p>
        ${safeObjectives.split('\n').filter(line => line.trim() !== "").map(line => `
            <w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>
        `).join('')}
        
        <w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="C00000"/></w:rPr><w:t>II. BỔ SUNG HỌC LIỆU & THIẾT BỊ</w:t></w:r></w:p>
        ${safeMaterials.split('\n').filter(line => line.trim() !== "").map(line => `
            <w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>
        `).join('')}

        <w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="C00000"/></w:rPr><w:t>III. CHI TIẾT HOẠT ĐỘNG TÍCH HỢP</w:t></w:r></w:p>
        ${activitiesText.split('\n').filter(line => line.trim() !== "").map(line => `
            <w:p>
                <w:r>
                    <w:rPr>${line.startsWith('★') ? '<w:b/><w:color w:val="000000"/>' : ''}</w:rPr>
                    <w:t xml:space="preserve">${escapeXml(line)}</w:t>
                </w:r>
            </w:p>
        `).join('')}
        `;

        const originalXml = zip.file("word/document.xml")?.asText();
        if (!originalXml) throw new Error("File Word lỗi cấu trúc");

        // --- 3. THUẬT TOÁN CHÈN AN TOÀN TUYỆT ĐỐI (REGEX) ---
        // Tìm thẻ <w:sectPr> nằm ở cuối cùng của body
        // Regex giải thích: Tìm <w:sectPr (có thể có thuộc tính) /> sau đó đến </w:body>
        
        let finalXml = "";
        const sectPrRegex = /(<w:sectPr(?:[\s\S]*?)>)(?:[\s\S]*?)(<\/w:body>)/i;
        
        // Kiểm tra xem file có Section Properties ở cuối không
        // Lưu ý: Chúng ta dùng lastIndexOf để tìm vị trí thủ công cho an toàn thay vì replace regex trực tiếp
        // để tránh thay thế nhầm các sectPr ở giữa văn bản.
        
        const lastSectPrIndex = originalXml.lastIndexOf("<w:sectPr");
        const bodyEndIndex = originalXml.lastIndexOf("</w:body>");
        
        // Logic: Nếu tìm thấy sectPr và nó nằm gần cuối file (sau nó không còn nội dung gì đáng kể ngoài thẻ đóng)
        if (lastSectPrIndex !== -1 && lastSectPrIndex < bodyEndIndex) {
             const part1 = originalXml.substring(0, lastSectPrIndex);
             const part2 = originalXml.substring(lastSectPrIndex);
             // Chèn vào GIỮA nội dung và Section Properties
             finalXml = part1 + newContentXml + part2;
        } else {
            // Trường hợp file không có sectPr (hiếm) hoặc cấu trúc lạ: Chèn trước thẻ đóng body
            finalXml = originalXml.replace('</w:body>', `${newContentXml}</w:body>`);
        }

        zip.file("word/document.xml", finalXml);

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