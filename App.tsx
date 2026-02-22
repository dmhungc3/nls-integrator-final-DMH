import React, { useState, useEffect, useRef } from 'react';
import { 
  FileUp, Wand2, FileCheck, Download,
  BookOpen, GraduationCap, Sparkles, ChevronRight,
  Smartphone, Zap, Layers, Cpu, Phone, Info, Clock, CheckCircle2, ListChecks,
  MonitorPlay, FileText, RefreshCw
} from 'lucide-react';
import { AppState, SubjectType, GradeType } from './types';
import { extractTextFromDocx, createIntegrationTextPrompt } from './utils';
import { generateCompetencyIntegration } from './services/geminiService';
import { injectContentIntoDocx } from './services/docxManipulator';

// --- HÀM TIỆN ÍCH ---
const removeVietnameseTones = (str: string) => {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
  str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
  str = str.replace(/đ/g,"d");
  return str;
}

const App: React.FC = () => {
  const APP_VERSION = "v3.6.5-AUTO-DOWNLOAD"; 
  const [pedagogy, setPedagogy] = useState<string>('DEFAULT');
  const [state, setState] = useState<AppState>({
    file: null, subject: '' as SubjectType, grade: '' as GradeType, isProcessing: false, step: 'upload', logs: [],
    config: { insertObjectives: true, insertMaterials: true, insertActivities: true, appendTable: true },
    generatedContent: null, result: null
  });
  
  const [activeTab, setActiveTab] = useState<'objectives' | 'materials' | 'activities' | 'matrix'>('objectives');
  const [userApiKey, setUserApiKey] = useState('');
  const [isKeySaved, setIsKeySaved] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) { setUserApiKey(savedKey); setIsKeySaved(true); }
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [state.logs]);

  // TỰ ĐỘNG NHẬN DIỆN THÔNG MINH
  const autoDetectInfo = (fileName: string) => {
    const name = removeVietnameseTones(fileName.toLowerCase());
    let s = '' as SubjectType;
    let g = '' as GradeType;

    // Nhận diện môn học
    if (/toan|hinh|dai|giai tich|vecto/.test(name)) s = 'Toán' as SubjectType;
    else if (/van|ngu van|doc hieu/.test(name)) s = 'Ngữ văn' as SubjectType;
    else if (/anh|english/.test(name)) s = 'Tiếng Anh' as SubjectType;
    else if (/dia|dan so|khi hau/.test(name)) s = 'Địa lý' as SubjectType;
    else if (/su|lich su/.test(name)) s = 'Lịch sử' as SubjectType;
    else if (/ly|vat ly/.test(name)) s = 'Vật lý' as SubjectType;
    else if (/hoa|chat/.test(name)) s = 'Hóa học' as SubjectType;
    else if (/sinh|te bao/.test(name)) s = 'Sinh học' as SubjectType;
    else if (/tin|lap trinh/.test(name)) s = 'Tin học' as SubjectType;
    else if (/cn|cong nghe/.test(name)) s = 'Công nghệ' as SubjectType;
    else if (/gdkt|phap luat|kinh te/.test(name)) s = 'Giáo dục kinh tế và pháp luật' as SubjectType;
    else if (/am nhac|hat/.test(name)) s = 'Âm nhạc' as SubjectType;
    else if (/my thuat|ve/.test(name)) s = 'Mỹ thuật' as SubjectType;

    // Nhận diện khối lớp
    const cleanName = name.replace(/(tiet|bai)\s*\d+/g, '');
    const gradeMatch = cleanName.match(/\d+/);
    if (gradeMatch) {
      const num = parseInt(gradeMatch[0]);
      if (num >= 6 && num <= 12) g = `Lớp ${num}` as GradeType;
    }
    return { s, g };
  };

  const saveKeyToLocal = () => {
    if (userApiKey.trim()) { 
      localStorage.setItem('gemini_api_key', userApiKey); setIsKeySaved(true); addLog("✅ Đã lưu API Key."); 
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.name.endsWith('.docx')) {
      const { s, g } = autoDetectInfo(file.name);
      const finalSubject = s || state.subject;
      const finalGrade = g || state.grade;
      setState(prev => ({ 
        ...prev, file, subject: finalSubject, grade: finalGrade, step: 'upload',
        logs: [`✅ Đã nhận: ${file.name}`, finalSubject ? `✅ Môn: ${finalSubject}` : "❓ Thầy hãy chọn môn", finalGrade ? `✅ Lớp: ${finalGrade}` : "❓ Thầy hãy chọn lớp"].filter(Boolean)
      }));
    }
  };

  const addLog = (msg: string) => setState(prev => ({ ...prev, logs: [...prev.logs, msg] }));

  const handleAnalyze = async () => {
    if (!userApiKey || !state.subject || !state.grade) return;
    setState(prev => ({ ...prev, isProcessing: true, logs: [...prev.logs.filter(l => !l.includes("❓")), `✅ Cấu hình: ${state.subject} - ${state.grade}`, `⚡ Khởi động Core ${APP_VERSION}...`, `🤖 Đang thiết kế NLS chi tiết...`] }));

    try {
      const text = await extractTextFromDocx(state.file!);
      const prompt = createIntegrationTextPrompt(text, state.subject, state.grade, 'NLS', pedagogy);
      const content = await generateCompetencyIntegration(prompt, userApiKey);
      
      addLog(`✨ Hoàn tất! Đang hiển thị kết quả.`);
      
      // MẶC ĐỊNH MỞ TAB MỤC TIÊU
      setActiveTab('objectives'); 
      
      setState(prev => ({ ...prev, isProcessing: false, generatedContent: content, step: 'review' }));
    } catch (e) { 
      addLog(`🔴 Lỗi: ${e instanceof Error ? e.message : "Xung đột"}`); 
      setState(prev => ({ ...prev, isProcessing: false })); 
    }
  };

  const handleFinalizeAndDownload = async () => {
    if (!state.file || !state.generatedContent) return;
    setState(prev => ({ ...prev, isProcessing: true, logs: [...prev.logs, "⚡ Đang xử lý file Word..."] }));
    try {
      const newBlob = await injectContentIntoDocx(state.file, state.generatedContent, 'NLS', (m) => addLog(`→ ${m}`));
      
      // --- TỰ ĐỘNG TẢI XUỐNG ---
      const fileName = `NLS-${state.file.name}`;
      const url = URL.createObjectURL(newBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cập nhật trạng thái
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        step: 'done', 
        result: { fileName, blob: newBlob }, // Lưu blob để tải lại nếu cần
        logs: [...prev.logs, "✅ Đã tải xuống thành công!"] 
      }));

    } catch (error) { 
      addLog("🔴 Lỗi đóng gói file."); setState(prev => ({ ...prev, isProcessing: false })); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col items-center">
      {/* --- HEADER --- */}
      <div className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm py-3 px-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Sparkles className="w-6 h-6" /></div>
                  <div>
                    <h2 className="font-bold text-slate-800 text-lg leading-tight">NLS Integrator Pro</h2>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{APP_VERSION}</span>
                  </div>
              </div>
              <div className="flex items-center gap-2">
                  {isKeySaved ? 
                    <div className="flex items-center gap-2 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 shadow-sm">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-emerald-700 font-bold text-xs">AI Connected</span>
                    </div> : 
                    <div className="flex gap-2">
                      <input type="password" value={userApiKey} onChange={(e) => setUserApiKey(e.target.value)} placeholder="Nhập Gemini API Key..." className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 w-40 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                      <button onClick={saveKeyToLocal} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors">Lưu</button>
                    </div>
                  }
              </div>
          </div>
      </div>

      <div className="w-full max-w-7xl px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- CỘT TRÁI: ĐIỀU KHIỂN & KẾT QUẢ --- */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {state.step === 'upload' && (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-8 animate-fade-in-up">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><FileText className="text-indigo-600"/> Cấu hình Giáo án</h3>
                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">GDPT 2018</span>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Môn học</label>
                    <div className="relative">
                      <select className="w-full p-3.5 pl-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none transition-all" value={state.subject} onChange={(e) => setState(prev => ({...prev, subject: e.target.value as SubjectType}))}>
                        <option value="">-- Chọn môn học --</option>
                        <optgroup label="Môn Bắt buộc"><option value="Toán">Toán học</option><option value="Ngữ văn">Ngữ văn</option><option value="Tiếng Anh">Tiếng Anh</option><option value="Lịch sử">Lịch sử</option><option value="Giáo dục thể chất">Giáo dục thể chất</option><option value="Giáo dục quốc phòng và an ninh">GD Quốc phòng & An ninh</option><option value="Hoạt động trải nghiệm, hướng nghiệp">HĐ Trải nghiệm, hướng nghiệp</option></optgroup>
                        <optgroup label="Môn Lựa chọn"><option value="Vật lý">Vật lý</option><option value="Hóa học">Hóa học</option><option value="Sinh học">Sinh học</option><option value="Địa lý">Địa lý</option><option value="Tin học">Tin học</option><option value="Công nghệ">Công nghệ</option><option value="Giáo dục kinh tế và pháp luật">GD Kinh tế & Pháp luật</option><option value="Âm nhạc">Âm nhạc</option><option value="Mỹ thuật">Mỹ thuật</option></optgroup>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Khối lớp</label>
                    <div className="relative">
                      <select className="w-full p-3.5 pl-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none transition-all" value={state.grade} onChange={(e) => setState(prev => ({...prev, grade: e.target.value as GradeType}))}>
                        <option value="">-- Chọn khối lớp --</option>
                        <optgroup label="Cấp THPT"><option value="Lớp 10">Lớp 10</option><option value="Lớp 11">Lớp 11</option><option value="Lớp 12">Lớp 12</option></optgroup>
                        <optgroup label="Cấp THCS"><option value="Lớp 6">Lớp 6</option><option value="Lớp 7">Lớp 7</option><option value="Lớp 8">Lớp 8</option><option value="Lớp 9">Lớp 9</option></optgroup>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                    </div>
                </div>
              </div>

              <label className={`relative flex flex-col items-center justify-center w-full h-48 rounded-2xl border-2 border-dashed transition-all cursor-pointer group overflow-hidden ${state.file ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <FileUp className={`w-12 h-12 mb-3 transition-transform duration-300 group-hover:-translate-y-2 ${state.file ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-sm font-bold text-slate-600 relative z-10">{state.file ? state.file.name : "Kéo thả hoặc Click để chọn giáo án (.docx)"}</span>
                <span className="text-[10px] text-slate-400 mt-1 relative z-10">Hỗ trợ định dạng Word 2010 trở lên</span>
                <input type="file" accept=".docx" className="hidden" onChange={handleFileChange} />
              </label>

              <button disabled={!state.file || !state.subject || state.isProcessing} onClick={handleAnalyze} className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-3 text-sm transform active:scale-[0.99]">
                {state.isProcessing ? <Clock className="animate-spin w-5 h-5" /> : <Wand2 className="w-5 h-5" />} 
                {state.isProcessing ? "AI Đang Phân Tích & Tích Hợp..." : "KÍCH HOẠT AI PRO-MAX"}
              </button>
            </div>
          )}

          {state.step === 'review' && state.generatedContent && (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in-up">
              <div className="p-5 border-b bg-slate-50/50 flex justify-between items-center backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600"><CheckCircle2 size={18} /></div>
                  <h3 className="font-bold text-slate-800">Kết quả Tích hợp</h3>
                </div>
                <button onClick={handleFinalizeAndDownload} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-2">
                  <Download size={14} /> Tải file Word
                </button>
              </div>
              
              {/* THANH MENU */}
              <div className="grid grid-cols-4 border-b text-xs font-bold text-slate-500 bg-white sticky top-0 z-10">
                {[
                  {id: 'objectives', icon: BookOpen, label: '1. Mục tiêu'},
                  {id: 'materials', icon: Smartphone, label: '2. Học liệu'},
                  {id: 'activities', icon: Zap, label: '3. Hoạt động'},
                  {id: 'matrix', icon: ListChecks, label: '4. Ma trận'}
                ].map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`py-4 flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === tab.id ? 'text-indigo-600 border-indigo-600 bg-indigo-50/50' : 'border-transparent hover:bg-slate-50 hover:text-slate-700'}`}>
                    <tab.icon size={14} /> {tab.label}
                  </button>
                ))}
              </div>

              {/* NỘI DUNG HIỂN THỊ */}
              <div className="p-6 h-[500px] overflow-y-auto bg-slate-50 custom-scrollbar">
                {activeTab === 'activities' ? (
                  <div className="space-y-4">
                    {(state.generatedContent.activities_integration && state.generatedContent.activities_integration.length > 0) ? (
                      state.generatedContent.activities_integration.map((act, i) => {
                        const hasPrompt = act.content && act.content.includes('[Câu lệnh mẫu]:');
                        const contentParts = hasPrompt ? act.content.split('[Câu lệnh mẫu]:') : [act.content, ""];
                        return (
                          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                              <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-md"><MonitorPlay size={14}/></div>
                              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">{act.anchor_text || `Hoạt động ${i+1}`}</span>
                            </div>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed mb-3">👉 {contentParts[0]?.trim()}</p>
                            {hasPrompt && (
                              <div className="bg-slate-50 p-3 rounded-lg border-l-4 border-indigo-500">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Gợi ý Prompt cho AI:</span>
                                <p className="text-xs italic text-indigo-900 font-semibold font-mono">"{contentParts[1]?.trim()}"</p>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <Info size={32} className="mb-2 opacity-50"/>
                        <p>Không tìm thấy hoạt động cụ thể nào.</p>
                        <p className="text-xs">Tuy nhiên, Mục tiêu & Học liệu NLS đã được tích hợp vào file Word.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-full">
                    <pre className="whitespace-pre-wrap text-sm font-sans text-slate-700 leading-7">
                      {activeTab === 'objectives' ? state.generatedContent.objectives_addition 
                       : activeTab === 'materials' ? state.generatedContent.materials_addition 
                       : state.generatedContent.appendix_table}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {state.step === 'done' && state.result && (
            <div className="bg-white rounded-3xl p-10 shadow-2xl text-center border border-emerald-100 animate-fade-in-up">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">Thành công!</h3>
              <p className="text-slate-500 mt-2 mb-8">File đã được tải xuống máy (Kiểm tra thư mục Downloads).</p>
              
              {/* NÚT TẢI LẠI THỦ CÔNG */}
              <button 
                onClick={() => {
                  const url = URL.createObjectURL(state.result!.blob);
                  const a = document.createElement('a'); a.href = url; a.download = state.result!.fileName; a.click();
                }} 
                className="mx-auto mb-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
              >
                <Download size={14} /> Tải lại file (Nếu chưa thấy)
              </button>

              <button onClick={() => window.location.reload()} className="px-8 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-600 transition-colors">
                Làm bài khác
              </button>
            </div>
          )}
        </div>

        {/* --- CỘT PHẢI: THÔNG TIN & TERMINAL --- */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="sticky top-24 space-y-6">
            
            {/* THẺ TÁC GIẢ */}
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-white/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <h4 className="font-bold text-[10px] text-slate-400 uppercase mb-4 flex items-center gap-2 tracking-widest"><GraduationCap size={14} /> Tác giả & Bản quyền</h4>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black shadow-md border-2 border-white ring-2 ring-indigo-100">MH</div>
                <div>
                  <p className="text-sm font-bold text-slate-800">GV. Đặng Mạnh Hùng</p>
                  <p className="text-[11px] text-slate-500 font-medium italic">THPT Lý Nhân Tông - Bắc Ninh</p>
                  <p className="text-[11px] text-indigo-600 font-bold mt-1 bg-indigo-50 inline-block px-2 py-0.5 rounded">📞 097 8386 357</p>
                </div>
              </div>
            </div>

            {/* TERMINAL AI */}
            <div className="bg-[#1e1e2e] rounded-2xl p-5 shadow-2xl h-[400px] flex flex-col border border-slate-700 font-mono text-[11px] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500"></div>
              <div className="flex justify-between border-b border-slate-700 pb-3 mb-3 text-slate-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-2"><Cpu size={14} className="text-emerald-400 animate-pulse" /> System Logs</span>
                <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div><div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></div></div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 text-emerald-100/90 custom-scrollbar pr-2">
                {state.logs.length === 0 && <span className="text-slate-600 italic opacity-50">Waiting for command...</span>}
                {state.logs.map((log, i) => (
                  <div key={i} className="flex gap-3 border-l-2 border-slate-700 pl-3 hover:border-emerald-500 transition-colors py-0.5">
                    <span className="text-slate-500 shrink-0 select-none opacity-70">[{new Date().toLocaleTimeString('en-GB',{hour12:false,minute:'2-digit',second:'2-digit'})}]</span>
                    <span className="break-words">{log.replace("✓ ", "✅ ").replace("🚀 ", "⚡ ")}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
      
      {/* FOOTER */}
      <div className="w-full mt-auto py-6 text-center border-t border-slate-200 bg-white/50 backdrop-blur-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] px-4">© 2026 NLS Integrator Pro — Developed by GV. Đặng Mạnh Hùng</p>
      </div>
    </div>
  );
};
export default App;