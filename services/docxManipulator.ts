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
        const docFile = zip.file("word/document.xml");
        if (!docFile) throw new Error("File Word không hợp lệ");
        
        let docXml = docFile.asText();
        const label = mode === 'NLS' ? "Tích hợp NLS" : "Tích hợp AI";

        // Hàm tạo khối XML
        const createXmlBlock = (text: string) => {
          if (!text) return "";
          return text.split('\n').filter(l => l.trim()).map(line => {
            const cleanLine = line.replace(/👉.*?:/g, '').trim();
            // Lấy prefix (ví dụ: 👉 Tích hợp NLS (Tiết 1): )
            const prefixMatch = line.match(/^(👉.*?):/);
            const prefix = prefixMatch ? prefixMatch[1] : `👉 ${label}`;

            return `<w:p>
                      <w:pPr><w:ind w:left="360"/></w:pPr>
                      <w:r><w:rPr><w:b/><w:color w:val="2E74B5"/></w:rPr><w:t>${escapeXml(prefix)}: </w:t></w:r>
                      <w:r><w:t xml:space="preserve">${escapeXml(cleanLine)}</w:t></w:r>
                    </w:p>`;
          }).join('');
        };

        // --- THUẬT TOÁN CHÈN PHÂN PHỐI (DISTRIBUTED INSERT) ---
        
        // 1. Tách nội dung mục tiêu thành mảng các dòng (tương ứng các tiết)
        const objectiveLines = content.objectives_addition.split('\n').filter(line => line.trim().length > 0);

        // 2. Tìm tất cả vị trí của các từ khóa Mục tiêu/Năng lực trong file Word
        // Ưu tiên tìm "Phát triển năng lực" trước, nếu không có thì tìm "2. Năng lực", "Mục tiêu"
        const keywords = ["Phát triển năng lực", "2. Năng lực", "2. năng lực", "II. MỤC TIÊU", "II. Mục tiêu"];
        
        // Hàm tìm tất cả vị trí của một từ khóa
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
        
        // Thử từng từ khóa, cái nào ra nhiều kết quả nhất (>= số tiết) thì chọn
        for (const key of keywords) {
            const found = findAllIndices(docXml, key);
            if (found.length > 0) {
                // Nếu tìm thấy số lượng vị trí khớp với số lượng dòng nội dung AI đưa ra
                if (found.length >= objectiveLines.length) {
                    targetIndices = found;
                    break; 
                }
                // Nếu chưa tìm thấy đủ, cứ tạm lưu lại, ưu tiên từ khóa dài ("Phát triển năng lực")
                if (targetIndices.length === 0) targetIndices = found; 
            }
        }

        // 3. Tiến hành chèn (Chèn từ dưới lên trên để không làm lệch chỉ số index)
        // Logic: Dòng nội dung thứ i chèn vào vị trí tìm thấy thứ i
        // Nếu AI trả về 2 dòng (Tiết 1, Tiết 2) mà Word có 2 mục Năng lực -> Khớp hoàn hảo.
        
        // Copy chuỗi XML để thao tác
        let newXml = docXml;
        
        // Đảo ngược mảng để chèn từ cuối file lên đầu file
        const reverseIndices = [...targetIndices].reverse(); 
        
        if (targetIndices.length > 0) {
             // Duyệt qua các vị trí tìm thấy
             reverseIndices.forEach((index, reverseI) => {
                 // Tính chỉ số thực trong mảng xuôi: i = (length - 1) - reverseI
                 const realIndex = targetIndices.length - 1 - reverseI;
                 
                 // Nếu có nội dung tương ứng cho tiết này (ưu tiên map theo thứ tự)
                 // Ví dụ: file có 2 mục năng lực. AI có 2 dòng.
                 // realIndex 0 -> Dòng 0. realIndex 1 -> Dòng 1.
                 if (realIndex < objectiveLines.length) {
                     const contentToInsert = objectiveLines[realIndex];
                     
                     // Tìm thẻ đóng </w:p> gần nhất sau vị trí index
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
            // Fallback: Nếu không tìm thấy từ khóa nào, chèn tất cả vào đầu
            const xmlBlock = createXmlBlock(content.objectives_addition);
            newXml = newXml.replace("<w:body>", "<w:body>" + xmlBlock); 
        }
        
        docXml = newXml;

        // 4. Chèn vào các hoạt động (Như cũ)
        if (Array.isArray(content.activities_enhancement)) {
            content.activities_enhancement.forEach(item => {
                // Thuật toán chèn sau tên hoạt động
                const safeName = escapeXml(item.activity_name);
                // Tìm vị trí tên hoạt động
                const actIndex = docXml.indexOf(safeName); // Tìm đơn giản để nhanh
                if (actIndex !== -1) {
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

        zip.file("word/document.xml", docXml);
        resolve(zip.generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", compression: "DEFLATE" }));

      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
};

const escapeXml = (unsafe: string): string => {
  if (!unsafe) return "";
  const map: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' };
  return unsafe.replace(/[<>&'"]/g, (c) => map[c] || c);
};