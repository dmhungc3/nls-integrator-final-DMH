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
        
        // 1. Kiểm tra file document.xml
        const docFile = zip.file("word/document.xml");
        if (!docFile) throw new Error("File Word không hợp lệ (thiếu document.xml)");
        
        let docXml = docFile.asText();
        const label = mode === 'NLS' ? "Tích hợp NLS" : "Tích hợp AI";

        // 2. Hàm tạo khối XML chuẩn (Xử lý prefix thông minh)
        const createXmlBlock = (text: string) => {
          if (!text) return "";
          return text.split('\n').filter(l => l.trim()).map(line => {
            const cleanLine = line.replace(/👉.*?:/g, '').trim();
            
            // Lấy prefix từ dòng text (nếu AI sinh ra) hoặc dùng mặc định
            const prefixMatch = line.match(/^(👉.*?):/);
            const prefix = prefixMatch ? prefixMatch[1] : `👉 ${label}`;

            return `<w:p>
                      <w:pPr><w:ind w:left="360"/></w:pPr>
                      <w:r><w:rPr><w:b/><w:color w:val="2E74B5"/></w:rPr><w:t>${escapeXml(prefix)}: </w:t></w:r>
                      <w:r><w:t xml:space="preserve">${escapeXml(cleanLine)}</w:t></w:r>
                    </w:p>`;
          }).join('');
        };

        // --- 3. THUẬT TOÁN CHÈN NĂNG LỰC TỔNG HỢP (DISTRIBUTED INSERT) ---
        
        // Bước A: Tách nội dung năng lực thành mảng (Mỗi dòng là 1 tiết)
        const objectiveLines = content.objectives_addition.split('\n').filter(line => line.trim().length > 0);

        // Bước B: Tìm tất cả vị trí các từ khóa Mục tiêu/Năng lực
        // Danh sách từ khóa ưu tiên (Đã thêm "Phẩm chất năng lực")
        const keywords = [
            "2. Phát triển năng lực", 
            "Phẩm chất năng lực", 
            "2. Năng lực", 
            "2. năng lực", 
            "II. MỤC TIÊU", 
            "II. Mục tiêu", 
            "Năng lực cần đạt"
        ];
        
        // Hàm tìm tất cả chỉ số (index) của một từ khóa trong văn bản XML
        const findAllIndices = (xml: string, keyword: string) => {
            const regex = new RegExp(keyword.replace(/\./g, "\\."), "gi");
            let match;
            const indices = [];
            while ((match = regex.exec(xml)) !== null) {
                indices.push(match.index);
            }
            return indices;
        };

        let targetIndices: number[] = [];
        
        // Quét từng từ khóa
        for (const key of keywords) {
            const found = findAllIndices(docXml, key);
            if (found.length > 0) {
                // Ưu tiên trường hợp khớp số lượng (Ví dụ: AI có 2 dòng, Word có 2 mục Năng lực)
                if (found.length >= objectiveLines.length) {
                    targetIndices = found;
                    break; 
                }
                if (targetIndices.length === 0) targetIndices = found; 
            }
        }

        // Bước C: Tiến hành chèn (Chèn từ dưới lên trên)
        let newXml = docXml;
        const reverseIndices = [...targetIndices].reverse(); 
        
        if (targetIndices.length > 0) {
             reverseIndices.forEach((index, reverseI) => {
                 const realIndex = targetIndices.length - 1 - reverseI;
                 
                 if (realIndex < objectiveLines.length) {
                     const contentToInsert = objectiveLines[realIndex];
                     
                     // Tìm thẻ đóng </w:p> gần nhất SAU vị trí từ khóa
                     const closingTag = "</w:p>";
                     const insertPos = newXml.indexOf(closingTag, index);
                     
                     if (insertPos !== -1) {
                         const splitPos = insertPos + closingTag.length;
                         const xmlBlock = createXmlBlock(contentToInsert);
                         newXml = newXml.substring(0, splitPos) + xmlBlock + newXml.substring(splitPos);
                     }
                 }
             });
        } else {
            // Fallback: Chèn vào đầu body nếu không tìm thấy từ khóa
            const xmlBlock = createXmlBlock(content.objectives_addition);
            const bodyTag = "<w:body>";
            const bodyIndex = newXml.indexOf(bodyTag);
            if (bodyIndex !== -1) {
                newXml = newXml.substring(0, bodyIndex + bodyTag.length) + xmlBlock + newXml.substring(bodyIndex + bodyTag.length);
            }
        }
        
        docXml = newXml;

        // --- 4. THUẬT TOÁN CHÈN HOẠT ĐỘNG (DEEP TABLE SCAN) ---
        if (Array.isArray(content.activities_enhancement)) {
            content.activities_enhancement.forEach(item => {
                // Làm sạch tên hoạt động
                let safeName = escapeXml(item.activity_name);
                
                // Tìm vị trí tên hoạt động trong XML
                let actIndex = docXml.indexOf(safeName); 
                
                // Nếu không tìm thấy chính xác, thử tìm phiên bản ngắn gọn hơn (bỏ dấu : phía sau)
                if (actIndex === -1 && safeName.includes(":")) {
                    safeName = safeName.split(":")[0]; // Ví dụ: "Hoạt động 1: Mở đầu" -> "Hoạt động 1"
                    actIndex = docXml.indexOf(safeName);
                }

                if (actIndex !== -1) {
                     // Tìm thẻ đóng đoạn văn </w:p> gần nhất
                     // Trong bảng, </w:p> là kết thúc dòng trong ô đó -> Chèn vào sau nó là OK
                     const closingTag = "</w:p>";
                     const insertPos = docXml.indexOf(closingTag, actIndex);
                     
                     if (insertPos !== -1) {
                         const splitPos = insertPos + closingTag.length;
                         const xmlBlock = createXmlBlock(item.enhanced_content);
                         docXml = docXml.substring(0, splitPos) + xmlBlock + docXml.substring(splitPos);
                     }
                }
            });
        }

        // 5. Đóng gói và trả về Blob
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

// Hàm mã hóa ký tự đặc biệt XML
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