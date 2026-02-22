import React, { useState, useEffect } from 'react';
import { 
  FileUp, Download, Sparkles, GraduationCap, Cpu, 
  BookOpen, Smartphone, Zap, ListChecks, RefreshCw, Layers, Info, Settings2
} from 'lucide-react';
import { AppState, SubjectType, GradeType } from './types';
import { extractTextFromDocx, createIntegrationTextPrompt } from './utils';
import { generateCompetencyIntegration } from './services/geminiService';
import { injectContentIntoDocx } from './services/docxManipulator';

const App: React.FC = () => {
  const APP_VERSION = "v4.7.0-PRO"; 
  const [state, setState] = useState<AppState>({
    file: null, subject: '' as SubjectType, grade: '' as GradeType, isProcessing: false, step: 'upload', logs: [],
    config: { insertObjectives: true, insertMaterials: true, insertActivities: true, appendTable: true },
    generatedContent: null, result: null
  });
  
  // Quản lý Tab: 'config' là tab chọn môn/lớp, 'preview' là tab xem kết quả
  const [activeTab, setActiveTab] = useState<'config' | 'objectives' | 'materials' | 'activities' | 'matrix'>('config');
  const [userApiKey, setUserApiKey] = useState('');

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setUserApiKey(savedKey);
  }, []);

  const addLog = (msg: string) => setState(prev => ({ ...prev, logs: [...prev.logs, msg] }));

  const handleAnalyze = async () => {
    if (!userApiKey || !state.file || !state.subject || !state.grade) {
        addLog("🔴 Lỗi: Thầy chưa chọn đủ Môn, Lớp hoặc File giáo án.");
        return;
    }
    setState(prev => ({ ...prev, isProcessing: true, logs: ["🚀 AI đang phân tích sâu giáo án môn " + state.subject + "..."] }));
    try {
      const text = await extractTextFromDocx(state.file);
      const content = await generateCompetencyIntegration(createIntegrationTextPrompt(text, state.subject, state.grade, 'NLS', 'DEFAULT'), userApiKey);
      setState(prev => ({ ...prev, isProcessing: false, generatedContent: content, step: 'review' }));
      setActiveTab('activities'); // Tự động chuyển sang xem kết quả sau khi xong
      addLog("✨ Tích hợp Năng lực số hoàn tất!");
    } catch { 
      addLog("🔴 Lỗi kết nối AI. Thầy kiểm tra lại API Key nhé."); 
      setState(prev => ({ ...prev, isProcessing: false })); 
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900">
      {/* HEADER */}
      <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b p-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg"><Sparkles size={24}/></div>
            <div><h1 className="font-black text-xl tracking-tight text-slate-800">NLS Integrator Pro</h1><span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold uppercase">{APP_VERSION}</span></div>
          </div>
          <div className="flex gap-2">
            <input type="password" value={userApiKey} onChange={e => setUserApiKey(e.target.value)} placeholder="Gemini Key..." className="text-xs border rounded-xl px-4 py-2 w-48 md:w-64 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"/>
            <button onClick={() => {localStorage.setItem('gemini_api_key', userApiKey); addLog("✅ Đã lưu Key.");}} className="bg-slate-800 hover:bg-black text-white px-6 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-md">Lưu</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
            
            {/* NAVIGATION TABS */}
            <div className="flex border-b bg-slate-50/50 overflow-x-auto no-scrollbar">
              <button onClick={() => setActiveTab('config')} className={`flex-1 min-w-[140px] py-5 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'config' ? 'text-indigo-600 border-b-4 border-indigo-600 bg-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                <Settings2 size={16}/> 1. Cấu hình bài dạy
              </button>
              <button disabled={!state.generatedContent} onClick={() => setActiveTab('activities')} className={`flex-1 min-w-[140px] py-5 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'activities' ? 'text-indigo-600 border-b-4 border-indigo-600 bg-white' : state.generatedContent ? 'text-slate-400 hover:bg-slate-50' : 'opacity-30 cursor-not-allowed'}`}>
                <Zap size={16}/> 2. Xem kết quả NLS
              </button>
            </div>

            <div className="p-8 min-h-[550px]">
              {/* TAB 1: CONFIGURATION */}
              {activeTab === 'config' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Danh mục môn học GDPT 2018 */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2 ml-1"><BookOpen size={14}/> Môn học (Chuẩn GDPT 2018)</label>
                      <select className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold text-slate-700 focus:border-indigo-500 focus:bg-white transition-all outline-none shadow-inner" value={state.subject} onChange={e => setState(prev => ({...prev, subject: e.target.value as SubjectType}))}>
                        <option value="">-- Chọn môn học --</option>
                        <optgroup label="CÁC MÔN BẮT BUỘC">
                          <option value="Toán">Toán học</option>
                          <option value="Ngữ văn">Ngữ văn</option>
                          <option value="Tiếng Anh">Tiếng Anh</option>
                          <option value="Lịch sử">Lịch sử</option>
                          <option value="Địa lý">Địa lý</option>
                          <option value="Giáo dục kinh tế và pháp luật">GD Kinh tế & Pháp luật</option>
                          <option value="Vật lý">Vật lý</option>
                          <option value="Hóa học">Hóa học</option>
                          <option value="Sinh học">Sinh học</option>
                          <option value="Tin học">Tin học</option>
                          <option value="Công nghệ">Công nghệ</option>
                        </optgroup>
                        <optgroup label="MÔN LỰA CHỌN & CHUYÊN ĐỀ">
                          <option value="Âm nhạc">Âm nhạc</option>
                          <option value="Mỹ thuật">Mỹ thuật</option>
                          <option value="Hoạt động trải nghiệm">HĐ Trải nghiệm, hướng nghiệp</option>
                          <option value="STEM">Chuyên đề STEM/Robotics</option>
                        </optgroup>
                      </select>
                    </div>
                    {/* Khối lớp */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2 ml-1"><Layers size={14}/> Khối lớp</label>
                      <select className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold text-slate-700 focus:border-indigo-500 focus:bg-white transition-all outline-none shadow-inner" value={state.grade} onChange={e => setState(prev => ({...prev, grade: e.target.value as GradeType}))}>
                        <option value="">-- Chọn khối lớp --</option>
                        <optgroup label="CẤP THPT">
                          <option value="Lớp 10">Lớp 10</option><option value="Lớp 11">Lớp 11</option><option value="Lớp 12">Lớp 12</option>
                        </optgroup>
                        <optgroup label="CẤP THCS">
                          <option value="Lớp 6">Lớp 6</option><option value="Lớp 7">Lớp 7</option><option value="Lớp 8">Lớp 8</option><option value="Lớp 9">Lớp 9</option>
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  <label className="flex flex-col items-center justify-center w-full h-64 border-4 border-dashed border-indigo-50 bg-indigo-50/5 rounded-[2rem] cursor-pointer hover:bg-indigo-50/20 transition-all group">
                    <FileUp size={60} className="text-indigo-400 mb-4 group-hover:-translate-y-2 transition-transform"/>
                    <p className="text-lg font-black text-slate-700">{state.file ? state.file.name : "Nạp giáo án gốc của thầy (.docx)"}</p>
                    <input type="file" accept=".docx" className="hidden" onChange={e => e.target.files && setState(prev => ({...prev, file: e.target.files![0]}))}/>
                  </label>

                  <button disabled={!state.file || !state.subject || state.isProcessing} onClick={handleAnalyze} className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-black shadow-xl hover:shadow-indigo-200 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-wider">
                    {state.isProcessing ? <RefreshCw className="animate-spin"/> : <Zap/>} Kích hoạt AI & Tích hợp năng lực số
                  </button>
                </div>
              )}

              {/* TAB 2: PREVIEW RESULTS */}
              {activeTab !== 'config' && state.generatedContent && (
                <div className="space-y-6 animate-in zoom-in-95 duration-500">
                  <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl text-white shadow-lg">
                    <div className="flex items-center gap-3 ml-2"><Info size={20} className="text-indigo-400"/><span className="font-black uppercase text-xs tracking-tighter">Bản xem trước: NLS chèn vào Word</span></div>
                    <button onClick={async () => {
                       const blob = await injectContentIntoDocx(state.file!, state.generatedContent!, 'NLS', addLog);
                       const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `NLS-${state.file!.name}`; a.click();
                    }} className="bg-indigo-500 hover:bg-indigo-600 px-6 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all"><Download size={16}/> Tải file Word chuẩn</button>
                  </div>

                  {/* NLS Definition Box */}
                  <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-3xl text-indigo-900 text-[11px] leading-relaxed italic font-medium shadow-inner">
                    🚀 <span className="font-black underline">NLS (Năng lực số):</span> Là phần AI đề xuất để học sinh dùng công nghệ hiện đại học tập. Khi tải file, nội dung có chữ <span className="text-red-600 font-black">"👉 [TÍCH HỢP NLS]"</span> sẽ được hệ thống "nối" tự động vào đúng vị trí trong giáo án của thầy.
                  </div>

                  {/* Sub-tabs for content preview */}
                  <div className="flex bg-slate-100/50 p-1 rounded-2xl">
                    {['activities', 'objectives', 'materials', 'matrix'].map(t => (
                      <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t === 'activities' ? '3. Hoạt động' : t === 'objectives' ? '1. Mục tiêu' : t === 'materials' ? '2. Thiết bị' : '4. Phụ lục'}</button>
                    ))}
                  </div>

                  <div className="h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {activeTab === 'activities' ? (
                      <div className="space-y-4">
                        {state.generatedContent.activities_integration.map((act, i) => (
                          <div key={i} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 shadow-sm"><div className="text-slate-500 font-black text-[10px] uppercase mb-2 border-b pb-2 tracking-widest">Nối vào: {act.anchor_text}</div><p className="text-sm text-indigo-700 font-bold italic leading-relaxed">👉 {act.content}</p></div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-emerald-800 font-bold whitespace-pre-wrap leading-relaxed bg-emerald-50/30 p-8 rounded-[2rem] border border-emerald-100 italic shadow-inner">{activeTab === 'objectives' ? state.generatedContent.objectives_addition : activeTab === 'materials' ? state.generatedContent.materials_addition : state.generatedContent.appendix_table}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INFO & LOGS */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100"><h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 flex items-center gap-2 tracking-[0.2em]"><GraduationCap size={16} className="text-indigo-500"/> Tác giả phần mềm</h4><div className="flex items-center gap-4"><div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-600/20">MH</div><div><p className="font-black text-slate-800 text-lg leading-tight">Đặng Mạnh Hùng</p><p className="text-[11px] text-slate-500 font-bold italic uppercase">Lý Nhân Tông - Bắc Ninh</p></div></div></div>
          <div className="bg-[#0f172a] p-6 rounded-[2.5rem] shadow-2xl h-[400px] flex flex-col font-mono text-[10px] border border-slate-800"><div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-4 text-indigo-400 font-bold uppercase tracking-widest"><Cpu size={14} className="animate-pulse"/> System Logs</div><div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">{state.logs.map((l, i) => <div key={i} className="leading-relaxed border-l-2 border-indigo-500/20 pl-3 text-slate-400">[{new Date().toLocaleTimeString('en-GB',{hour12:false,minute:'2-digit'})}] {l}</div>)}</div></div>
        </div>
      </main>
    </div>
  );
};
export default App;