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
        if (!docFile) throw new Error("File Word không hợp lệ (thiếu document.xml)");
        
        let docXml = docFile.asText();
        const label = mode === 'NLS' ? "Tích hợp NLS" : "Tích hợp AI";

        // --- HÀM 1: PHÁT HIỆN STYLE (CẢI TIẾN: KHÔNG ÉP CỠ CHỮ) ---
        const detectStyle = (xml: string, index: number) => {
            // Quét ngược 10.000 ký tự để tìm định dạng chuẩn nhất
            const chunk = xml.substring(Math.max(0, index - 10000), index); 
            
            // Tìm cỡ chữ (w:sz)
            // QUAN TRỌNG: Không đặt default là "28" nữa. Nếu không thấy thì để null.
            // Để Word tự quyết định dựa trên Style của đoạn văn đó.
            let fontSize = null;
            const szMatch = chunk.match(/<w:sz\s+w:val=["'](\d+)["'][^>]*\/>/g);
            if (szMatch && szMatch.length > 0) {
                 const last = szMatch[szMatch.length - 1];
                 const m = last.match(/val=["'](\d+)["']/);
                 if (m) fontSize = m[1];
            }

            // Tìm Font chữ (w:rFonts)
            // Tương tự, nếu không thấy thì để null để thừa kế
            let fontTag = ""; 
            const fontMatch = chunk.match(/<w:rFonts\s+[^>]*\/>/g);
            if (fontMatch && fontMatch.length > 0) {
                fontTag = fontMatch[fontMatch.length - 1];
            }

            return { fontSize, fontTag };
        };

        // --- HÀM 2: TẠO KHỐI XML (HEADER + LIST) ---
        const createXmlBlock = (text: string, style: { fontSize: string | null, fontTag: string }) => {
          if (!text) return "";
          
          const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          if (lines.length === 0) return "";

          // Style cơ bản: Màu xanh dương đậm (2E74B5)
          let rPrHeader = `<w:b/><w:color w:val="2E74B5"/>`; 
          let rPrBody = `<w:color w:val="2E74B5"/>`;

          // Chỉ áp dụng Font/Size nếu thực sự tìm thấy trong văn bản gốc
          if (style.fontSize) {
              const szTag = `<w:sz w:val="${style.fontSize}"/><w:szCs w:val="${style.fontSize}"/>`;
              rPrHeader += szTag;
              rPrBody += szTag;
          }
          
          if (style.fontTag) {
              rPrHeader += style.fontTag;
              rPrBody += style.fontTag;
          }

          // 1. Tạo dòng Tiêu đề
          let xmlBlock = `<w:p>
                            <w:pPr><w:ind w:left="360"/></w:pPr>
                            <w:r>
                                <w:rPr>${rPrHeader}</w:rPr>
                                <w:t>👉 ${escapeXml(label)}:</w:t>
                            </w:r>
                          </w:p>`;

          // 2. Tạo các dòng Liệt kê
          lines.forEach(line => {
              // Lọc rác
              let cleanLine = line
                  .replace(/\*\*/g, "") 
                  .replace(/__/, "")
                  .replace(/^\s*[-•+]\s*/, "") 
                  .replace(/^(👉|NLS:|Tiết \d+:|Tích hợp NLS:)\s*/gi, "")
                  .trim();

              if (cleanLine) {
                  xmlBlock += `<w:p>
                                 <w:pPr><w:ind w:left="720"/></w:pPr> 
                                 <w:r>
                                    <w:rPr>${rPrBody}</w:rPr>
                                    <w:t xml:space="preserve">- ${escapeXml(cleanLine)}</w:t>
                                 </w:r>
                               </w:p>`;
              }
          });

          return xmlBlock;
        };

        // --- HÀM 3: TÌM KIẾM XUYÊN THẤU (FUZZY XML SEARCH) ---
        const findFuzzyIndex = (xml: string, keyword: string) => {
            let idx = xml.indexOf(keyword);
            if (idx !== -1) return idx;

            // Xử lý dấu cách đặc biệt và thẻ XML xen giữa
            const words = keyword.split(/[\s\u00A0]+/).map(w => escapeRegex(w));
            if (words.length === 0) return -1;

            const patternStr = words.join('(?:<[^>]+>|[\\s\\u00A0])+');
            const regex = new RegExp(patternStr, 'gi'); 
            
            const match = regex.exec(xml);
            return match ? match.index : -1;
        };

        // --- 4. CHÈN NĂNG LỰC ---
        const objectiveLines = content.objectives_addition.split('\n').filter(l => l.trim());
        const keywords = ["Phẩm chất năng lực", "2. Phát triển năng lực", "2. Năng lực", "2. năng lực", "II. MỤC TIÊU", "II. Mục tiêu", "Năng lực cần đạt", "3. Năng lực"];
        
        let targetIndices: number[] = [];
        for (const key of keywords) {
            const words = key.split(/\s+/).map(w => escapeRegex(w));
            const patternStr = words.join('(?:<[^>]+>|[\\s\\u00A0])+');
            const regex = new RegExp(patternStr, 'gi');
            let match;
            while ((match = regex.exec(docXml)) !== null) targetIndices.push(match.index);
            if (targetIndices.length > 0) break; 
        }
        targetIndices.sort((a, b) => a - b);

        let newXml = docXml;
        const reverseIndices = [...targetIndices].reverse(); 
        
        if (targetIndices.length > 0) {
             reverseIndices.forEach((index, reverseI) => {
                 let contentToInsert = content.objectives_addition;
                 if (contentToInsert) {
                     const currentStyle = detectStyle(newXml, index);
                     const xmlBlock = createXmlBlock(contentToInsert, currentStyle);
                     
                     if (xmlBlock) {
                         const closingTag = "</w:p>";
                         const insertPos = newXml.indexOf(closingTag, index);
                         if (insertPos !== -1) {
                             const splitPos = insertPos + closingTag.length;
                             newXml = newXml.substring(0, splitPos) + xmlBlock + newXml.substring(splitPos);
                         }
                     }
                 }
             });
        } else {
            // Fallback: Không ép size, để tự nhiên
            const xmlBlock = createXmlBlock(content.objectives_addition, { fontSize: null, fontTag: "" });
            if (xmlBlock) {
                const bodyTag = "<w:body>";
                const bodyIndex = newXml.indexOf(bodyTag);
                if (bodyIndex !== -1) newXml = newXml.substring(0, bodyIndex + bodyTag.length) + xmlBlock + newXml.substring(bodyIndex + bodyTag.length);
            }
        }
        docXml = newXml;

        // --- 5. CHÈN HOẠT ĐỘNG ---
        if (Array.isArray(content.activities_enhancement)) {
            content.activities_enhancement.forEach(item => {
                let safeName = escapeXml(item.activity_name);
                let actIndex = -1;

                actIndex = findFuzzyIndex(docXml, safeName);

                if (actIndex === -1) {
                    const coreKeywords = ["Khởi động", "Hình thành kiến thức", "Luyện tập", "Vận dụng", "Mở đầu", "Kết nối"];
                    for (const key of coreKeywords) {
                        if (safeName.includes(key)) {
                            const variants = [
                                `HOẠT ĐỘNG ${key.toUpperCase()}`, 
                                `HOẠT ĐỘNG ${key}`,             
                                `${key.toUpperCase()}`
                            ];
                            for (const v of variants) {
                                actIndex = findFuzzyIndex(docXml, v);
                                if (actIndex !== -1) break;
                            }
                            if (actIndex === -1) actIndex = findFuzzyIndex(docXml, key);
                            if (actIndex !== -1) break;
                        }
                    }
                }

                if (actIndex === -1) {
                     const matchNum = safeName.match(/\d+/);
                     if (matchNum) {
                         const num = matchNum[0];
                         const variants = [`Hoạt động ${num}`, `HĐ ${num}`, `HĐ${num}`, `Nhiệm vụ ${num}`];
                         for (const v of variants) {
                             actIndex = findFuzzyIndex(docXml, v);
                             if (actIndex !== -1) break;
                         }
                     }
                }

                if (actIndex !== -1) {
                     const currentStyle = detectStyle(docXml, actIndex);
                     const closingTag = "</w:p>";
                     const insertPos = docXml.indexOf(closingTag, actIndex);
                     
                     if (insertPos !== -1) {
                         const splitPos = insertPos + closingTag.length;
                         const xmlBlock = createXmlBlock(item.enhanced_content, currentStyle);
                         
                         if (xmlBlock) {
                             docXml = docXml.substring(0, splitPos) + xmlBlock + docXml.substring(splitPos);
                         }
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

const escapeRegex = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const escapeXml = (unsafe: string): string => {
  if (!unsafe) return "";
  const map: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' };
  return unsafe.replace(/[<>&'"]/g, (c) => map[c] || c);
};