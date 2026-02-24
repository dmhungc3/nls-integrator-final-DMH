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

        // --- HÀM SAO CHÉP PHONG CÁCH (FONT & SIZE) ---
        const detectStyle = (xml: string, index: number) => {
            // Lấy 2000 ký tự trước vị trí chèn để tìm định dạng
            const chunk = xml.substring(Math.max(0, index - 2000), index);
            
            // 1. Tìm cỡ chữ (w:sz)
            // Regex tìm thẻ w:sz gần nhất
            const szMatch = chunk.match(/<w:sz\s+w:val=["'](\d+)["'][^>]*\/>/g);
            let fontSize = null;
            if (szMatch && szMatch.length > 0) {
                 const last = szMatch[szMatch.length - 1];
                 const m = last.match(/val=["'](\d+)["']/);
                 if (m) fontSize = m[1];
            }

            // 2. Tìm Font chữ (w:rFonts)
            // Regex tìm thẻ w:rFonts gần nhất (để đồng bộ Times New Roman, Arial...)
            const fontMatch = chunk.match(/<w:rFonts\s+[^>]*\/>/g);
            let fontTag = ""; 
            if (fontMatch && fontMatch.length > 0) {
                fontTag = fontMatch[fontMatch.length - 1]; // Lấy thẻ font cuối cùng
            }

            return { fontSize, fontTag };
        };

        // --- HÀM TẠO KHỐI XML (ĐỒNG BỘ & SẠCH) ---
        const createXmlBlock = (text: string, style: { fontSize: string | null, fontTag: string }) => {
          if (!text) return "";
          
          const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          if (lines.length === 0) return "";

          // Xây dựng thuộc tính định dạng (Run Properties)
          // Nếu tìm thấy cỡ chữ/font thì dùng, không thì để Word tự quyết (kế thừa)
          let rPrContent = `<w:b/><w:color w:val="2E74B5"/>`; // Mặc định: Đậm + Xanh cho tiêu đề
          let rPrContentNormal = `<w:color w:val="2E74B5"/>`; // Mặc định: Xanh cho nội dung

          if (style.fontSize) {
              const szTag = `<w:sz w:val="${style.fontSize}"/><w:szCs w:val="${style.fontSize}"/>`;
              rPrContent += szTag;
              rPrContentNormal += szTag;
          }
          if (style.fontTag) {
              rPrContent += style.fontTag;
              rPrContentNormal += style.fontTag;
          }

          // 1. Tiêu đề chung
          let xmlBlock = `<w:p>
                            <w:pPr><w:ind w:left="360"/></w:pPr>
                            <w:r>
                                <w:rPr>${rPrContent}</w:rPr>
                                <w:t>👉 ${escapeXml(label)}:</w:t>
                            </w:r>
                          </w:p>`;

          // 2. Nội dung chi tiết
          lines.forEach(line => {
              // LỌC RÁC: Xóa các dấu ** (nếu AI lỡ sinh ra) và các tiền tố thừa
              let cleanLine = line
                  .replace(/\*\*/g, "") // Xóa dấu **
                  .replace(/^\s*[-•]\s*/, "") // Xóa gạch đầu dòng cũ để mình tự thêm chuẩn
                  .replace(/^(👉|NLS:|Tiết \d+:)\s*/gi, "")
                  .trim();

              if (cleanLine) {
                  xmlBlock += `<w:p>
                                 <w:pPr><w:ind w:left="720"/></w:pPr> 
                                 <w:r>
                                    <w:rPr>${rPrContentNormal}</w:rPr>
                                    <w:t xml:space="preserve">- ${escapeXml(cleanLine)}</w:t>
                                 </w:r>
                               </w:p>`;
              }
          });

          return xmlBlock;
        };

        // --- 1. CHÈN NĂNG LỰC TỔNG HỢP ---
        const objectiveLines = content.objectives_addition.split('\n').filter(l => l.trim());
        const keywords = ["Phẩm chất năng lực", "2. Phát triển năng lực", "2. Năng lực", "2. năng lực", "II. MỤC TIÊU", "II. Mục tiêu", "Năng lực cần đạt"];
        
        const findAllIndices = (xml: string, keyword: string) => {
            const regex = new RegExp(keyword.replace(/\./g, "\\."), "gi");
            let match;
            const indices = [];
            while ((match = regex.exec(xml)) !== null) indices.push(match.index);
            return indices;
        };

        let targetIndices: number[] = [];
        for (const key of keywords) {
            const found = findAllIndices(docXml, key);
            if (found.length > 0) {
                if (found.length >= objectiveLines.length) { targetIndices = found; break; }
                if (targetIndices.length === 0) targetIndices = found; 
            }
        }

        let newXml = docXml;
        const reverseIndices = [...targetIndices].reverse(); 
        
        if (targetIndices.length > 0) {
             reverseIndices.forEach((index, reverseI) => {
                 const realIndex = targetIndices.length - 1 - reverseI;
                 if (realIndex < objectiveLines.length) {
                     const contentToInsert = objectiveLines[realIndex];
                     
                     // PHÁT HIỆN STYLE TẠI CHỖ CHÈN
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
            // Fallback (Mặc định không style, để Word tự kế thừa)
            const xmlBlock = createXmlBlock(content.objectives_addition, { fontSize: null, fontTag: "" });
            if (xmlBlock) {
                const bodyTag = "<w:body>";
                const bodyIndex = newXml.indexOf(bodyTag);
                if (bodyIndex !== -1) {
                    newXml = newXml.substring(0, bodyIndex + bodyTag.length) + xmlBlock + newXml.substring(bodyIndex + bodyTag.length);
                }
            }
        }
        docXml = newXml;

        // --- 2. CHÈN HOẠT ĐỘNG (DEEP SCAN) ---
        if (Array.isArray(content.activities_enhancement)) {
            content.activities_enhancement.forEach(item => {
                let safeName = escapeXml(item.activity_name);
                let actIndex = docXml.indexOf(safeName); 
                
                if (actIndex === -1 && safeName.includes(":")) {
                    safeName = safeName.split(":")[0];
                    actIndex = docXml.indexOf(safeName);
                }

                if (actIndex !== -1) {
                     // PHÁT HIỆN STYLE TẠI CHỖ CHÈN HOẠT ĐỘNG
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

const escapeXml = (unsafe: string): string => {
  if (!unsafe) return "";
  const map: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' };
  return unsafe.replace(/[<>&'"]/g, (c) => map[c] || c);
};