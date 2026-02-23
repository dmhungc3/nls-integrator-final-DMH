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
        
        // 1. Sửa lỗi TypeScript: Kiểm tra file tồn tại trước khi đọc
        const docFile = zip.file("word/document.xml");
        if (!docFile) {
            throw new Error("File Word không hợp lệ (thiếu document.xml)");
        }
        let docXml = docFile.asText();

        const label = mode === 'NLS' ? "Tích hợp NLS" : "Tích hợp AI";

        // Hàm tạo khối XML an toàn
        const createXmlBlock = (text: string) => {
          if (!text) return "";
          return text.split('\n').filter(l => l.trim()).map(line => {
            const cleanLine = line.replace(/👉.*?:/g, '').trim();
            // Sử dụng xml:space="preserve" để giữ khoảng trắng
            return `<w:p>
                      <w:pPr><w:ind w:left="360"/></w:pPr>
                      <w:r><w:rPr><w:b/><w:color w:val="2E74B5"/></w:rPr><w:t>👉 ${label}: </w:t></w:r>
                      <w:r><w:t xml:space="preserve">${escapeXml(cleanLine)}</w:t></w:r>
                    </w:p>`;
          }).join('');
        };

        // --- 2. THUẬT TOÁN CHÈN AN TOÀN TUYỆT ĐỐI ---
        const insertSafe = (fullXml: string, keyword: string, newContent: string): string => {
            if (!newContent) return fullXml;
            
            // Tìm vị trí từ khóa (ví dụ: "2. Năng lực")
            // Lưu ý: Trong XML, text có thể bị ngắt bởi thẻ, nhưng ta tìm tương đối
            // Nếu không tìm thấy chính xác, ta tìm các từ khóa thay thế phổ biến
            let keywordPos = fullXml.indexOf(keyword);
            
            // Nếu không tìm thấy, thử tìm phiên bản viết thường hoặc viết hoa
            if (keywordPos === -1) keywordPos = fullXml.indexOf(keyword.toUpperCase());
            if (keywordPos === -1) return fullXml; // Không tìm thấy thì không chèn, tránh lỗi file

            // Từ vị trí từ khóa, quét tới thẻ đóng đoạn văn </w:p> gần nhất
            const closingTag = "</w:p>";
            const insertIndex = fullXml.indexOf(closingTag, keywordPos);

            if (insertIndex === -1) return fullXml;

            // Vị trí chèn là ngay SAU thẻ đóng </w:p>
            const splitPoint = insertIndex + closingTag.length;
            
            // Cắt và ghép chuỗi
            return fullXml.substring(0, splitPoint) + newContent + fullXml.substring(splitPoint);
        };

        // Thực hiện chèn lần lượt
        // Tìm "2. Năng lực" hoặc "2. Năng lực" (chấp nhận biến thể trong file xml)
        // Mẹo: Word có thể lưu là "2. Năng lực" hoặc "2. <w:r>...</w:r>Năng lực"
        // Để an toàn nhất, nếu không tìm thấy chuỗi liền mạch, ta chèn vào cuối file (trước thẻ body đóng) 
        // Tuy nhiên, thuật toán insertSafe sẽ chỉ chèn nếu tìm thấy, đảm bảo không làm hỏng file.
        
        docXml = insertSafe(docXml, "2. Năng lực", createXmlBlock(content.objectives_addition));
        docXml = insertSafe(docXml, "II. THIẾT BỊ", createXmlBlock(content.materials_addition));

        if (Array.isArray(content.activities_enhancement)) {
            content.activities_enhancement.forEach(item => {
                const safeName = escapeXml(item.activity_name);
                // Chỉ chèn nếu tìm thấy tên hoạt động
                if (item.activity_name) {
                     docXml = insertSafe(docXml, item.activity_name, createXmlBlock(item.enhanced_content));
                }
            });
        }

        // Ghi lại vào file zip
        zip.file("word/document.xml", docXml);
        
        const out = zip.generate({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            compression: "DEFLATE"
        });
        
        resolve(out);

      } catch (err) {
        console.error(err);
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

// 3. Sửa lỗi TypeScript: Định nghĩa kiểu rõ ràng cho map thay thế
const escapeXml = (unsafe: string): string => {
  if (!unsafe) return "";
  const map: Record<string, string> = {
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;'
  };
  return unsafe.replace(/[<>&'"]/g, (c) => map[c] || c);
};