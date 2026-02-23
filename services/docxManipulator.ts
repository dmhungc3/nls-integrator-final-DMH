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
        
        // 1. Chuẩn bị dữ liệu để đưa vào Word
        // Chuyển đổi mảng activities_enhancement thành chuỗi văn bản có xuống dòng
        let activitiesText = "";
        if (Array.isArray(content.activities_enhancement)) {
            activitiesText = content.activities_enhancement
                .map(item => `★ ${item.activity_name}:\n${item.enhanced_content}`)
                .join('\n\n');
        } else {
            // Fallback nếu AI lỡ trả về string thay vì array
            activitiesText = String(content.activities_enhancement || "");
        }

        // Tạo nội dung append (Phụ lục)
        const title = mode === 'NLS' ? "HỒ SƠ TÍCH HỢP NĂNG LỰC SỐ" : "HỒ SƠ TÍCH HỢP AI";
        
        // Xử lý file Word thủ công (XML Manipulation) để đảm bảo không lỗi format
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // Lấy nội dung XML hiện tại
        const originalXml = zip.file("word/document.xml")?.asText();
        if (!originalXml) throw new Error("File Word bị lỗi cấu trúc");

        // --- CHIẾN THUẬT CHÈN: APPEND VÀO CUỐI FILE (AN TOÀN NHẤT) ---
        // Chúng ta sẽ chèn một trang mới vào cuối file chứa nội dung AI
        
        const newContentXml = `
        <w:p><w:r><w:br w:type="page"/></w:r></w:p>
        <w:p>
            <w:pPr><w:jc w:val="center"/></w:pPr>
            <w:r>
                <w:rPr><w:b/><w:sz w:val="32"/></w:rPr>
                <w:t>${title}</w:t>
            </w:r>
        </w:p>
        
        <w:p><w:r><w:rPr><w:b/><w:color w:val="2E74B5"/></w:rPr><w:t>I. BỔ SUNG MỤC TIÊU/NĂNG LỰC</w:t></w:r></w:p>
        <w:p><w:r><w:t>${escapeXml(content.objectives_addition)}</w:t></w:r></w:p>
        
        <w:p><w:r><w:rPr><w:b/><w:color w:val="2E74B5"/></w:rPr><w:t>II. BỔ SUNG HỌC LIỆU SỐ</w:t></w:r></w:p>
        <w:p><w:r><w:t>${escapeXml(content.materials_addition)}</w:t></w:r></w:p>

        <w:p><w:r><w:rPr><w:b/><w:color w:val="2E74B5"/></w:rPr><w:t>III. THIẾT KẾ LẠI HOẠT ĐỘNG (TÍCH HỢP)</w:t></w:r></w:p>
        ${activitiesText.split('\n').map(line => `
            <w:p>
                <w:r>
                    <w:rPr>${line.startsWith('★') ? '<w:b/><w:color w:val="C00000"/>' : ''}</w:rPr>
                    <w:t>${escapeXml(line)}</w:t>
                </w:r>
            </w:p>
        `).join('')}
        `;

        // Tìm thẻ đóng body </w:body> và chèn nội dung vào trước nó
        const newXml = originalXml.replace('</w:body>', `${newContentXml}</w:body>`);
        
        // Ghi đè file XML
        zip.file("word/document.xml", newXml);

        // Render file cuối cùng
        const out = zip.generate({
          type: "blob",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        resolve(out);

      } catch (error) {
        // Log chi tiết lỗi để debug
        console.error("Lỗi chi tiết:", error);
        reject(error);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

// Hàm phụ trợ để xử lý ký tự đặc biệt trong XML
const escapeXml = (unsafe: string) => {
    if (!unsafe) return "";
    return unsafe.replace(/[<>&'"]/g, (c) => {
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