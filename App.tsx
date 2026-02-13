import React, { useState, useEffect } from 'react';
import { 
  FileUp, Wand2, FileCheck, Download,
  BookOpen, GraduationCap, Sparkles, ChevronRight, Key,
  User, School, Phone, Activity, Terminal, Smartphone, Zap
} from 'lucide-react';
import { AppState, SubjectType, GradeType, GeneratedNLSContent } from './types';
import { extractTextFromDocx, createIntegrationTextPrompt } from './utils';
import { generateCompetencyIntegration } from './services/geminiService';
import { injectContentIntoDocx } from './services/docxManipulator';
import SmartEditor from './components/SmartEditor';

type IntegrationMode = 'NLS' | 'NAI';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    file: null, subject: '', grade: '', isProcessing: false, step: 'upload', logs: [],
    config: { insertObjectives: true, insertMaterials: true, insertActivities: true, appendTable: true },
    generatedContent: null, result: null
  });

  const [mode, setMode] = useState<IntegrationMode>('NLS');
  const [userApiKey, setUserApiKey] = useState('');
  const [isKeySaved, setIsKeySaved] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) { setUserApiKey(savedKey); setIsKeySaved(true); }
  }, []);

  const saveKeyToLocal = () => {
    if (userApiKey.trim()) { localStorage.setItem('gemini_api_key', userApiKey); setIsKeySaved(true); addLog("✓ Đã lưu API Key."); } 
    else { alert("Vui lòng nhập Key!"); }
  };

  const handleEditKey = () => setIsKeySaved(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.docx')) {
      setState(prev => ({ ...prev, file, result: null, generatedContent: null, step: 'upload', logs: [`✓ Đã tải lên: ${file.name}`] }));
    } else { alert("Chọn file Word (.docx)!"); }
  };

  const addLog = (msg: string) => { setState(prev => ({ ...prev, logs: [...prev.logs, msg] })); };

  const handleAnalyze = async () => {
    if (!userApiKey.trim()) { alert("Nhập API Key!"); return; }
    if (!state.file || !state.subject || !state.grade) { alert("Thiếu thông tin!"); return; }

    setState(prev => ({ ...prev, isProcessing: true, logs: [`🚀 Kích hoạt AI Mode: ${mode === 'NAI' ? 'AI Competency' : 'Digital Competency'}...`] }));

    try {
      addLog("Đang đọc file Word...");
      const textContext = await extractTextFromDocx(state.file);
      const prompt = createIntegrationTextPrompt(textContext, state.subject, state.grade, mode);
      const generatedContent = await generateCompetencyIntegration(prompt, userApiKey);
      addLog(`✓ Đã tạo nội dung ${mode}.`);
      setState(prev => ({ ...prev, isProcessing: false, generatedContent, step: 'review' }));
    } catch (error) {
      addLog(`❌ Lỗi: ${error instanceof Error ? error.message : "Unknown"}`);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleFinalizeAndDownload = async (finalContent: GeneratedNLSContent) => {
    if (!state.file) return;
    setState(prev => ({ ...prev, isProcessing: true, logs: [...prev.logs, "Đang ghi file Word..."] }));
    try {
      const newBlob = await injectContentIntoDocx(state.file, finalContent, mode, addLog);
      setState(prev => ({ ...prev, isProcessing: false, step: 'done', result: { fileName: `${mode}_${state.file?.name}`, blob: newBlob }, logs: [...prev.logs, "✨ Thành công!"] }));
    } catch (error) {
       addLog(`❌ Lỗi tạo file: ${error instanceof Error ? error.message : "Unknown"}`);
       setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col items-center">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
          white-space: nowrap;
        }
      `}</style>

      {/* --- STICKY HEADER --- */}
      <div className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
              
              {/* TÁC GIẢ */}
              <div className="flex items-center gap-3 shrink-0">
                  <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
                      <User className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                      <h2 className="font-bold text-slate-800 text-sm">Đặng Mạnh Hùng</h2>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">THPT Lý Nhân Tông</span>
                  </div>
              </div>

              {/* CHỮ CHẠY */}
              <div className="flex-1 overflow-hidden relative h-9 flex items-center bg-slate-100/50 rounded-md border border-slate-200/50 mx-4 hidden md:flex">
                 <div className="animate-marquee flex items-center gap-6 text-indigo-700 font-bold text-xs tracking-wide">
                    <span>🚀 NLS Integrator Pro — Tích hợp Năng lực Số & AI vào Giáo án 2018</span>
                    <span className="text-slate-400">|</span>
                    <span>Sáng kiến kinh nghiệm - Đặng Mạnh Hùng</span>
                    <span className="text-slate-400">|</span>
                    <span>Nhanh chóng • Chính xác • Hiện đại</span>
                    <span className="text-slate-400">|</span>
                    <span>Hỗ trợ ChatGPT & Gemini Pro</span>
                 </div>
                 <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-slate-100 to-transparent z-10"></div>
                 <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-slate-100 to-transparent z-10"></div>
              </div>

              {/* API KEY */}
              <div className="flex items-center justify-end shrink-0">
                  {isKeySaved ? (
                      <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                          <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                          <span className="text-emerald-700 font-bold text-xs">API Ready</span>
                          <button onClick={handleEditKey} className="ml-2 text-[10px] text-slate-400 hover:text-indigo-600 underline">Đổi</button>
                      </div>
                  ) : (
                      <div className="flex gap-1"><input type="password" value={userApiKey} onChange={(e) => setUserApiKey(e.target.value)} placeholder="Nhập API Key..." className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs w-32 focus:border-indigo-500 outline-none" /><button onClick={saveKeyToLocal} className="px-3 py-1 bg-indigo-600 text-white rounded-md text-xs font-bold hover:bg-indigo-700">Lưu</button></div>
                  )}
              </div>
          </div>
      </div>

      {/* --- MAIN DASHBOARD --- */}
      <div className="w-full max-w-7xl px-4 py-6 flex flex-col gap-6">
        
        {/* STEPPER COMPACT */}
        <div className="flex items-center justify-center">
             <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
                <span className={`text-xs font-bold ${state.step === 'upload' ? 'text-indigo-600' : 'text-slate-400'}`}>1. Tải lên</span>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className={`text-xs font-bold ${state.step === 'review' ? 'text-indigo-600' : 'text-slate-400'}`}>2. Xử lý AI</span>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className={`text-xs font-bold ${state.step === 'done' ? 'text-indigo-600' : 'text-slate-400'}`}>3. Hoàn tất</span>
             </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full">
          
          {/* CỘT TRÁI: THAO TÁC */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {state.step === 'upload' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div className="flex items-center gap-2 text-slate-700 font-bold">
                          <BookOpen className="w-5 h-5 text-indigo-600" />
                          <span>Thiết lập Giáo án</span>
                      </div>
                      <div className="flex bg-slate-200/50 p-1 rounded-lg">
                          <button onClick={() => setMode('NLS')} className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${mode === 'NLS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Smartphone className="w-3.5 h-3.5" /> Năng lực Số</button>
                          <button onClick={() => setMode('NAI')} className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${mode === 'NAI' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Zap className="w-3.5 h-3.5" /> Năng lực AI</button>
                      </div>
                  </div>

                  <div className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                          
                          {/* --- SELECT MÔN HỌC (ĐẦY ĐỦ GDPT 2018) --- */}
                          <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Môn học (GDPT 2018)</label>
                              <select className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all" value={state.subject} onChange={(e) => setState(prev => ({...prev, subject: e.target.value as SubjectType}))}>
                                  <option value="">-- Chọn môn học --</option>
                                  <optgroup label="Môn Bắt buộc (Chung)">
                                      <option value="Toán">Toán học</option>
                                      <option value="Ngữ văn">Ngữ văn</option>
                                      <option value="Tiếng Anh">Tiếng Anh</option>
                                      <option value="Giáo dục thể chất">Giáo dục thể chất</option>
                                  </optgroup>

                                  <optgroup label="Cấp 3 (THPT): Tự chọn & Chuyên sâu">
                                      <option value="Vật lí">Vật lí</option>
                                      <option value="Hóa học">Hóa học</option>
                                      <option value="Sinh học">Sinh học</option>
                                      <option value="Lịch sử">Lịch sử</option>
                                      <option value="Địa lí">Địa lí</option>
                                      <option value="GDKT & PL">Giáo dục KT & PL</option>
                                      <option value="Tin học">Tin học</option>
                                      <option value="Công nghệ (Công nghiệp)">Công nghệ (Công nghiệp)</option>
                                      <option value="Công nghệ (Nông nghiệp)">Công nghệ (Nông nghiệp)</option>
                                      <option value="GDQP & AN">Giáo dục QP & AN</option>
                                  </optgroup>

                                  <optgroup label="Cấp 2 (THCS): Tích hợp & Cơ bản">
                                      <option value="Khoa học tự nhiên">Khoa học tự nhiên (Lý-Hóa-Sinh)</option>
                                      <option value="Lịch sử và Địa lí">Lịch sử và Địa lí</option>
                                      <option value="GDCD">Giáo dục công dân (GDCD)</option>
                                      <option value="Công nghệ">Công nghệ (THCS)</option>
                                  </optgroup>

                                  <optgroup label="Nghệ thuật & HĐ Giáo dục">
                                      <option value="Âm nhạc">Âm nhạc</option>
                                      <option value="Mỹ thuật">Mỹ thuật</option>
                                      <option value="HĐ Trải nghiệm, HN">HĐ Trải nghiệm, Hướng nghiệp</option>
                                      <option value="Nội dung GD địa phương">Nội dung GD địa phương</option>
                                  </optgroup>
                              </select>
                          </div>
                          
                          {/* --- SELECT KHỐI LỚP (CHIA NHÓM) --- */}
                          <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Khối lớp</label>
                              <select className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all" value={state.grade} onChange={(e) => setState(prev => ({...prev, grade: e.target.value as GradeType}))}>
                                  <option value="">-- Chọn khối --</option>
                                  <optgroup label="THPT (Cấp 3)">
                                      <option value="Lớp 10">Lớp 10</option>
                                      <option value="Lớp 11">Lớp 11</option>
                                      <option value="Lớp 12">Lớp 12</option>
                                  </optgroup>
                                  <optgroup label="THCS (Cấp 2)">
                                      <option value="Lớp 6">Lớp 6</option>
                                      <option value="Lớp 7">Lớp 7</option>
                                      <option value="Lớp 8">Lớp 8</option>
                                      <option value="Lớp 9">Lớp 9</option>
                                  </optgroup>
                              </select>
                          </div>
                      </div>

                      <label className={`flex items-center justify-center w-full h-32 rounded-xl border-2 border-dashed transition-all cursor-pointer hover:bg-slate-50 group ${state.file ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-300'}`}>
                          <div className="flex flex-col items-center justify-center text-center p-4">
                              {state.file ? (
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center"><FileCheck className="w-5 h-5" /></div>
                                      <div className="text-left"><p className="font-bold text-indigo-900 text-sm">{state.file.name}</p><p className="text-xs text-indigo-500">Đã sẵn sàng xử lý</p></div>
                                  </div>
                              ) : (
                                  <><FileUp className="w-8 h-8 text-slate-300 mb-2 group-hover:text-indigo-500 transition-colors" /><p className="font-bold text-slate-600 text-sm">Nhấn để tải file giáo án (.docx)</p><p className="text-[10px] text-slate-400 mt-1">Hỗ trợ MathType & Hình ảnh</p></>
                              )}
                          </div>
                          <input type="file" accept=".docx" className="hidden" onChange={handleFileChange} />
                      </label>

                      <button disabled={!state.file || state.isProcessing} onClick={handleAnalyze} className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] ${!state.file || state.isProcessing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:shadow-indigo-500/25'}`}>
                        {state.isProcessing ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Hệ thống đang phân tích...</>) : (<><Wand2 className="w-4 h-4" /> Bắt đầu tích hợp ngay</>)}
                      </button>
                  </div>
              </div>
            )}

            {state.step === 'review' && state.generatedContent && (
               <SmartEditor initialContent={state.generatedContent} onConfirm={handleFinalizeAndDownload} onCancel={() => setState(prev => ({ ...prev, step: 'upload', generatedContent: null }))} />
            )}
            
            {state.step === 'done' && state.result && (
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 flex flex-col items-center text-center animate-fade-in">
                 <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4"><Sparkles className="w-8 h-8" /></div>
                 <h3 className="text-xl font-bold text-slate-800">Xử lý thành công!</h3>
                 <p className="text-sm text-slate-500 mt-1 mb-6">File giáo án đã được tích hợp năng lực {mode === 'NAI' ? 'AI' : 'Số'} hoàn chỉnh.</p>
                 <div className="flex gap-3">
                     <button onClick={() => setState(prev => ({ ...prev, step: 'upload', result: null, generatedContent: null }))} className="px-5 py-2.5 rounded-lg font-bold text-sm text-slate-600 hover:bg-slate-50 border border-slate-200">Làm bài khác</button>
                     <button onClick={() => { if (state.result) { const url = URL.createObjectURL(state.result.blob); const a = document.createElement('a'); a.href = url; a.download = state.result.fileName; a.click(); } }} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200"><Download className="w-4 h-4" /> Tải về máy</button>
                 </div>
              </div>
            )}
          </div>
          
          {/* CỘT PHẢI: THÔNG TIN */}
          <div className="lg:col-span-4 flex flex-col gap-4 h-full">
             <div className="bg-slate-900 rounded-2xl p-4 shadow-lg flex flex-col h-[280px] border border-slate-800">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider"><Terminal className="w-3 h-3" /> System Logs</div>
                    <div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div><div className="w-2 h-2 rounded-full bg-amber-500"></div><div className="w-2 h-2 rounded-full bg-emerald-500"></div></div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 font-mono text-[11px]">
                   {state.logs.length === 0 && <span className="text-slate-600 italic">Ready to start...</span>}
                   {state.logs.map((log, i) => (<div key={i} className="flex gap-2"><span className="text-slate-500 shrink-0">{new Date().toLocaleTimeString([], {hour12: false, hour:'2-digit', minute:'2-digit'})}</span><span className={`${log.includes("❌") ? "text-rose-400" : log.includes("✓") ? "text-emerald-400" : "text-slate-300"}`}>{log.replace("✓ ", "").replace("🚀 ", "")}</span></div>))}
                   {state.isProcessing && <div className="text-indigo-400 animate-pulse">_ Processing data...</div>}
                </div>
             </div>
             
             <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex-1">
                <h4 className="font-bold text-sm text-indigo-900 mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-indigo-500" /> Góc Sư phạm</h4>
                <div className="space-y-3">
                    <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100"><p className="text-xs font-bold text-indigo-700 mb-1">📱 Chế độ Năng lực Số</p><p className="text-[11px] text-slate-600 leading-relaxed">Tích hợp các kỹ năng CNTT cơ bản: Soạn thảo văn bản, Làm bài trình chiếu, Tra cứu Web, Sử dụng phần mềm dạy học (GeoGebra, Azota...).</p></div>
                    <div className="p-3 bg-rose-50 rounded-lg border border-rose-100"><p className="text-xs font-bold text-rose-700 mb-1">⚡ Chế độ Năng lực AI</p><p className="text-[11px] text-slate-600 leading-relaxed">Tích hợp GenAI (ChatGPT, Gemini) làm trợ lý ảo. Chú trọng kỹ năng Prompting (Ra lệnh), Tư duy phản biện & Kiểm chứng thông tin.</p></div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="w-full mt-auto py-6 text-center text-slate-400 text-[10px]">
          <p>© 2024 NLS Integrator Pro • Design by Dang Manh Hung</p>
      </div>
    </div>
  );
};

export default App;