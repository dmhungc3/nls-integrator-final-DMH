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
        
        // 1. Chuẩn hóa dữ liệu
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

        const title = mode === 'NLS' ? "PHIẾU TÍCH HỢP NĂNG LỰC SỐ (NLS)" : "PHIẾU TÍCH HỢP AI";

        // --- 2. TẠO XML ĐÃ NÉN (MINIFIED) ---
        // QUAN TRỌNG: Viết liền mạch, KHÔNG xuống dòng, KHÔNG khoảng trắng thừa giữa các thẻ
        
        let xmlBuilder = `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`; // Ngắt trang
        
        // Tiêu đề
        xmlBuilder += `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="2E74B5"/></w:rPr><w:t>${title}</w:t></w:r></w:p>`;
        
        // Mục I
        xmlBuilder += `<w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="C00000"/></w:rPr><w:t>I. BỔ SUNG MỤC TIÊU</w:t></w:r></w:p>`;
        safeObjectives.split('\n').filter(l => l.trim()).forEach(line => {
             xmlBuilder += `<w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`;
        });

        // Mục II
        xmlBuilder += `<w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="C00000"/></w:rPr><w:t>II. BỔ SUNG HỌC LIỆU & THIẾT BỊ</w:t></w:r></w:p>`;
        safeMaterials.split('\n').filter(l => l.trim()).forEach(line => {
             xmlBuilder += `<w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`;
        });

        // Mục III
        xmlBuilder += `<w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="C00000"/></w:rPr><w:t>III. HOẠT ĐỘNG TÍCH HỢP</w:t></w:r></w:p>`;
        activitiesText.split('\n').filter(l => l.trim()).forEach(line => {
             // Kiểm tra in đậm nếu là tên hoạt động (bắt đầu bằng ★)
             const isHeader = line.startsWith('★');
             const formatting = isHeader ? `<w:b/><w:color w:val="000000"/>` : ``;
             xmlBuilder += `<w:p><w:r><w:rPr>${formatting}</w:rPr><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`;
        });

        // 3. ĐỌC FILE GỐC VÀ CHÈN AN TOÀN
        const originalXml = zip.file("word/document.xml")?.asText();
        if (!originalXml) throw new Error("File Word lỗi cấu trúc");

        // Tìm thẻ đóng body
        const bodyEndTag = "</w:body>";
        const bodyEndIndex = originalXml.lastIndexOf(bodyEndTag);
        
        if (bodyEndIndex === -1) throw new Error("Không tìm thấy thẻ body trong file Word");

        // Tìm thẻ sectPr cuối cùng (Section Properties)
        // Đây là thẻ định dạng trang, nếu chèn sau nó thì file sẽ lỗi.
        const lastSectPrIndex = originalXml.lastIndexOf("<w:sectPr");
        
        let finalXml = "";

        // Logic chèn:
        // Nếu tìm thấy sectPr và nó nằm trước thẻ đóng body -> Chèn trước sectPr
        if (lastSectPrIndex !== -1 && lastSectPrIndex < bodyEndIndex) {
            finalXml = originalXml.substring(0, lastSectPrIndex) + xmlBuilder + originalXml.substring(lastSectPrIndex);
        } else {
            // Nếu không thấy sectPr (file Word đơn giản), chèn ngay trước thẻ đóng body
            finalXml = originalXml.replace(bodyEndTag, xmlBuilder + bodyEndTag);
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