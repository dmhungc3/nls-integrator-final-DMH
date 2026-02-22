import React, { useState, useEffect, useRef } from 'react';
import { 
  FileUp, Wand2, FileCheck, Download,
  BookOpen, GraduationCap, Sparkles,
  Smartphone, Zap, Cpu, Clock, CheckCircle2, ListChecks
} from 'lucide-react';
import { AppState, SubjectType, GradeType } from './types';
import { extractTextFromDocx, createIntegrationTextPrompt } from './utils';
import { generateCompetencyIntegration } from './services/geminiService';
import { injectContentIntoDocx } from './services/docxManipulator';

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
  const APP_VERSION = "v3.3.9-WORD-STYLE"; 
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

  const autoDetectInfo = (fileName: string) => {
    const name = removeVietnameseTones(fileName.toLowerCase());
    let s = '' as SubjectType;
    let g = '' as GradeType;
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
    setState(prev => ({ ...prev, isProcessing: true, logs: [...prev.logs.filter(l => !l.includes("❓")), `⚡ Đang thiết kế NLS giống mẫu...`] }));

    try {
      const text = await extractTextFromDocx(state.file!);
      const prompt = createIntegrationTextPrompt(text, state.subject, state.grade, 'NLS', pedagogy);
      const content = await generateCompetencyIntegration(prompt, userApiKey);
      addLog(`✨ Đã tạo nội dung chuẩn mẫu Word!`);
      setActiveTab('activities'); 
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
      setState(prev => ({ ...prev, isProcessing: false, step: 'done', result: { fileName: `NLS-Tich-Hop-${state.file?.name}`, blob: newBlob }, logs: [...prev.logs, "✅ Thành công! Đang tải xuống..."] }));
      
      // Tự động tải xuống sau 1s
      setTimeout(() => {
        const url = URL.createObjectURL(newBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `NLS-Tich-Hop-${state.file?.name}`;
        a.click();
      }, 1000);

    } catch (error) { 
      addLog("🔴 Lỗi: Không thể sửa file Word. Hãy đảm bảo file không bị hỏng."); 
      console.error(error);
      setState(prev => ({ ...prev, isProcessing: false })); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col items-center">
      {/* HEADER */}
      <div className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b py-3 px-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Sparkles className="w-6 h-6" /></div>
                  <div><h2 className="font-bold text-slate-800">NLS Integrator Pro</h2><span className="text-[10px] text-slate-500 uppercase">{APP_VERSION} | GV. ĐẶNG MẠNH HÙNG</span></div>
              </div>
              <div className="flex items-center gap-2">
                  {isKeySaved ? <div className="bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 text-emerald-700 font-bold text-xs">AI Ready</div> : 
                  <div className="flex gap-2"><input type="password" value={userApiKey} onChange={(e) => setUserApiKey(e.target.value)} placeholder="Nhập API Key..." className="text-xs border rounded px-2 w-32" /><button onClick={saveKeyToLocal} className="bg-indigo-600 text-white text-xs px-3 py-1 rounded">Lưu</button></div>}
              </div>
          </div>
      </div>

      <div className="w-full max-w-7xl px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 flex flex-col gap-6">
          {state.step === 'upload' && (
            <div className="bg-white rounded-3xl shadow-xl border p-8 space-y-8 animate-fade-in-up">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Môn học (GDPT 2018)</label>
                    <select className="w-full p-3.5 rounded-xl border bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={state.subject} onChange={(e) => setState(prev => ({...prev, subject: e.target.value as SubjectType}))}>
                      <option value="">-- Chọn môn học --</option>
                      <optgroup label="Môn học Bắt buộc"><option value="Toán">Toán học</option><option value="Ngữ văn">Ngữ văn</option><option value="Tiếng Anh">Tiếng Anh</option><option value="Lịch sử">Lịch sử</option><option value="Giáo dục thể chất">Giáo dục thể chất</option><option value="Giáo dục quốc phòng và an ninh">GD Quốc phòng & An ninh</option><option value="Hoạt động trải nghiệm, hướng nghiệp">HĐ Trải nghiệm, hướng nghiệp</option></optgroup>
                      <optgroup label="Môn học Lựa chọn"><option value="Vật lý">Vật lý</option><option value="Hóa học">Hóa học</option><option value="Sinh học">Sinh học</option><option value="Địa lý">Địa lý</option><option value="Tin học">Tin học</option><option value="Công nghệ">Công nghệ</option><option value="Giáo dục kinh tế và pháp luật">GD Kinh tế & Pháp luật</option><option value="Âm nhạc">Âm nhạc</option><option value="Mỹ thuật">Mỹ thuật</option></optgroup>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Khối lớp</label>
                    <select className="w-full p-3.5 rounded-xl border bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={state.grade} onChange={(e) => setState(prev => ({...prev, grade: e.target.value as GradeType}))}>
                      <option value="">-- Chọn khối lớp --</option>
                      <optgroup label="Cấp THPT"><option value="Lớp 10">Lớp 10</option><option value="Lớp 11">Lớp 11</option><option value="Lớp 12">Lớp 12</option></optgroup>
                      <optgroup label="Cấp THCS"><option value="Lớp 6">Lớp 6</option><option value="Lớp 7">Lớp 7</option><option value="Lớp 8">Lớp 8</option><option value="Lớp 9">Lớp 9</option></optgroup>
                    </select>
                </div>
              </div>
              <label className="flex flex-col items-center justify-center w-full h-44 rounded-2xl border-2 border-dashed border-slate-300 cursor-pointer hover:bg-slate-50">
                <FileUp className="text-slate-400 mb-2" /><span className="text-sm font-bold text-slate-600">{state.file ? state.file.name : "Nạp giáo án (.docx)"}</span>
                <input type="file" accept=".docx" className="hidden" onChange={handleFileChange} />
              </label>
              <button disabled={!state.file || !state.subject || state.isProcessing} onClick={handleAnalyze} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold flex justify-center gap-2">
                {state.isProcessing ? <Clock className="animate-spin" /> : <Wand2 />} {state.isProcessing ? "Đang xử lý..." : "Kích hoạt AI & Tích hợp ngay"}
              </button>
            </div>
          )}

          {state.step === 'review' && state.generatedContent && (
            <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
              <div className="p-4 border-b flex justify-between bg-slate-50">
                <h3 className="font-bold text-indigo-900">Kết quả (Giống mẫu Word)</h3>
                <button onClick={handleFinalizeAndDownload} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold">Tải về ngay</button>
              </div>
              <div className="grid grid-cols-4 border-b text-xs font-bold text-slate-500">
                <button onClick={() => setActiveTab('activities')} className={`py-3 ${activeTab === 'activities' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : ''}`}>⚡ 3. Hoạt động</button>
                <button onClick={() => setActiveTab('objectives')} className={`py-3 ${activeTab === 'objectives' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : ''}`}>📖 1. Mục tiêu</button>
                <button onClick={() => setActiveTab('materials')} className={`py-3 ${activeTab === 'materials' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : ''}`}>📦 2. Học liệu</button>
                <button onClick={() => setActiveTab('matrix')} className={`py-3 ${activeTab === 'matrix' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : ''}`}>📊 4. Ma trận</button>
              </div>
              <div className="p-6 max-h-[500px] overflow-y-auto bg-slate-50">
                {activeTab === 'activities' ? (
                  <div className="space-y-4">
                    {state.generatedContent.activities_integration?.map((act, i) => (
                      <div key={i} className="p-4 bg-white rounded-xl border border-indigo-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-2">
                          <span className="text-[11px] font-bold text-indigo-700 uppercase">{act.anchor_text || `Hoạt động ${i+1}`}</span>
                        </div>
                        <p className="text-sm text-slate-700 font-medium leading-relaxed">{act.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-xl border text-sm text-slate-700 whitespace-pre-wrap">
                    {activeTab === 'objectives' ? state.generatedContent.objectives_addition 
                     : activeTab === 'materials' ? state.generatedContent.materials_addition 
                     : state.generatedContent.appendix_table}
                  </div>
                )}
              </div>
            </div>
          )}

          {state.step === 'done' && (
            <div className="bg-white rounded-3xl p-10 shadow-2xl text-center border border-emerald-100">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" /><h3 className="text-2xl font-bold">Thành công!</h3>
              <p className="text-slate-500 mt-2">File Word đã được tải xuống máy.</p>
              <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-bold text-slate-600">Làm bài khác</button>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="sticky top-24">
            <div className="bg-white/80 backdrop-blur rounded-2xl p-5 shadow-sm border mb-4">
              <h4 className="font-bold text-[10px] text-slate-400 uppercase mb-3 flex items-center gap-2"><GraduationCap className="w-3" /> Tác giả</h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-black">MH</div>
                <div><p className="text-xs font-bold text-slate-800">Đặng Mạnh Hùng</p><p className="text-[10px] text-slate-500 italic">GV THPT Lý Nhân Tông</p><p className="text-[10px] font-bold text-slate-500">097 8386 357</p></div>
              </div>
            </div>
            <div className="bg-[#1e1e2e] rounded-2xl p-4 shadow-2xl h-[380px] flex flex-col border border-slate-700 font-mono text-[11px]">
              <div className="flex justify-between border-b border-slate-700 pb-2 mb-2 text-slate-400 font-bold uppercase"><span className="flex items-center gap-2"><Cpu className="w-3" /> Terminal Status</span></div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 text-indigo-100/90">
                {state.logs.map((log, i) => <div key={i} className="flex gap-2 border-l border-indigo-500/30 pl-2"><span>[{new Date().toLocaleTimeString('en-GB',{hour12:false,hour:'2-digit',minute:'2-digit'})}]</span><span>{log}</span></div>)}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full mt-auto py-4 text-center border-t bg-white/50"><p className="text-[10px] text-slate-400 font-bold uppercase">© 2026 NLS Integrator Pro — GV. Đặng Mạnh Hùng</p></div>
    </div>
  );
};
export default App;