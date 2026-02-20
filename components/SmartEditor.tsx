import React, { useState, useEffect } from 'react';
import { GeneratedNLSContent, ActivityItem } from '../types';
import { Save, PenTool, CheckCircle, Trash2, Plus, ChevronRight } from 'lucide-react';

interface SmartEditorProps {
  initialContent: GeneratedNLSContent;
  onConfirm: (finalContent: GeneratedNLSContent) => void;
  onCancel: () => void;
}

type Tab = 'objectives' | 'materials' | 'activities' | 'appendix';

const SmartEditor: React.FC<SmartEditorProps> = ({ initialContent, onConfirm, onCancel }) => {
  const [content, setContent] = useState<GeneratedNLSContent>(initialContent);
  const [activeTab, setActiveTab] = useState<Tab>('objectives');

  // Đồng bộ state khi dữ liệu AI trả về
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const updateField = (field: keyof GeneratedNLSContent, value: any) => {
    setContent(prev => ({ ...prev, [field]: value }));
  };

  const updateActivity = (index: number, field: keyof ActivityItem, value: string) => {
    const newActivities = [...content.activities_integration];
    newActivities[index] = { ...newActivities[index], [field]: value };
    updateField('activities_integration', newActivities);
  };

  const removeActivity = (index: number) => {
    const newActivities = content.activities_integration.filter((_, i) => i !== index);
    updateField('activities_integration', newActivities);
  };

  const addActivity = () => {
    const newActivities = [
      ...content.activities_integration, 
      { anchor_text: "Câu mốc trong giáo án gốc...", content: "➤ Nội dung tích hợp mới..." }
    ];
    updateField('activities_integration', newActivities);
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[650px] animate-fade-in-up">
      
      {/* HEADER - ĐÃ SỬA LỖI MÀU CHỮ NÚT XÁC NHẬN */}
      <div className="bg-white border-b border-slate-100 px-8 py-5 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
            <div className="p-2.5 bg-indigo-50 rounded-xl">
                <PenTool className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
                <h3 className="font-bold text-xl text-slate-800">Smart Studio</h3>
                <p className="text-xs text-slate-500">Hiệu chỉnh nội dung NLS trước khi đóng gói Word</p>
            </div>
        </div>
        <div className="flex gap-4">
             <button 
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all font-bold"
             >
                Hủy bỏ
             </button>
             <button 
                onClick={() => onConfirm(content)}
                className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
             >
                <Save className="w-4 h-4" /> Xác nhận tích hợp
             </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR TABS */}
        <div className="w-72 bg-slate-50/50 border-r border-slate-100 p-5 flex flex-col gap-2 shrink-0">
            {[
                { id: 'objectives', label: '1. Mục tiêu NLS', icon: '🎯' },
                { id: 'materials', label: '2. Học liệu số', icon: '💻' },
                { id: 'activities', label: '3. Hoạt động lẻ', icon: '⚡', badge: content.activities_integration.length },
                { id: 'appendix', label: '4. Phụ lục cuối', icon: '📊' },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`text-left px-5 py-4 rounded-2xl transition-all flex items-center justify-between group ${
                        activeTab === tab.id 
                        ? 'bg-white shadow-xl text-indigo-600 font-bold ring-1 ring-black/5' 
                        : 'text-slate-500 hover:bg-white/60'
                    }`}
                >
                    <span className="flex items-center gap-3">
                        <span className="text-xl">{tab.icon}</span> 
                        <span className="text-sm">{tab.label}</span>
                    </span>
                    {tab.badge !== undefined ? (
                        <span className="bg-indigo-100 text-indigo-600 text-[10px] px-2 py-0.5 rounded-full font-black">{tab.badge}</span>
                    ) : (
                        <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === tab.id ? 'rotate-90 text-indigo-400' : 'text-slate-300'}`} />
                    )}
                </button>
            ))}
        </div>

        {/* EDIT AREA */}
        <div className="flex-1 p-8 overflow-y-auto bg-white custom-scrollbar">
            
            {activeTab === 'objectives' && (
                <div className="space-y-4 animate-fade-in-up">
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl text-sm text-indigo-700 flex gap-3 italic">
                        <CheckCircle className="w-5 h-5 shrink-0" />
                        <p>Nội dung này sẽ được chèn vào ngay sau phần <strong>"Năng lực"</strong> trong giáo án bài Địa lý.</p>
                    </div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nội dung thêm mới:</label>
                    <textarea 
                        value={content.objectives_addition}
                        onChange={(e) => updateField('objectives_addition', e.target.value)}
                        className="w-full h-80 p-6 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-mono text-sm leading-relaxed text-slate-700 bg-slate-50/30"
                        placeholder="Nhập mục tiêu phát triển năng lực số cho học sinh..."
                    />
                </div>
            )}

            {activeTab === 'materials' && (
                <div className="space-y-4 animate-fade-in-up">
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl text-sm text-indigo-700 flex gap-3 italic">
                         <CheckCircle className="w-5 h-5 shrink-0" />
                        <p>Nội dung này sẽ được chèn vào phần <strong>"Thiết bị dạy học và học liệu"</strong>.</p>
                    </div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">Danh sách công cụ số:</label>
                    <textarea 
                        value={content.materials_addition}
                        onChange={(e) => updateField('materials_addition', e.target.value)}
                        className="w-full h-40 p-6 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-medium text-slate-700 bg-slate-50/30"
                        placeholder="Ví dụ: Phần mềm mô phỏng, đường link Padlet, bảng tương tác..."
                    />
                </div>
            )}

            {activeTab === 'activities' && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="flex justify-between items-center">
                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-sm text-amber-800 flex gap-3 max-w-2xl italic">
                             <CheckCircle className="w-5 h-5 shrink-0" />
                            <p>Anh hãy copy 1 câu mốc (Anchor) trong file gốc để AI biết chính xác chỗ cần chèn hoạt động mới.</p>
                        </div>
                        <button 
                            onClick={addActivity}
                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-lg"
                        >
                            <Plus className="w-4 h-4" /> Thêm hoạt động
                        </button>
                    </div>

                    {content.activities_integration.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                            Chưa có hoạt động lẻ nào. Nhấn "Thêm hoạt động" để bắt đầu.
                        </div>
                    ) : (
                        <div className="space-y-4">
                          {content.activities_integration.map((activity, index) => (
                              <div key={index} className="bg-white rounded-2xl p-6 border border-slate-200 group hover:border-indigo-300 shadow-sm transition-all relative">
                                  <button 
                                      onClick={() => removeActivity(index)}
                                      className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors p-1"
                                      title="Xóa"
                                  >
                                      <Trash2 className="w-5 h-5" />
                                  </button>
                                  
                                  <div className="space-y-4">
                                      <div>
                                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">🔍 Câu mốc làm vị trí chèn (Anchor Text):</label>
                                          <input 
                                              type="text"
                                              value={activity.anchor_text}
                                              onChange={(e) => updateActivity(index, 'anchor_text', e.target.value)}
                                              className="w-full p-3 rounded-xl border border-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 text-sm bg-slate-50 font-bold"
                                              placeholder="Dán câu có sẵn trong file Word vào đây..."
                                          />
                                      </div>
                                      <div>
                                          <label className="block text-[10px] font-black text-indigo-400 uppercase mb-2">✨ Nội dung tích hợp NLS:</label>
                                          <textarea 
                                              value={activity.content}
                                              onChange={(e) => updateActivity(index, 'content', e.target.value)}
                                              className="w-full p-4 rounded-xl border border-indigo-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 text-sm font-medium bg-indigo-50/20 h-28"
                                              placeholder="Mô tả chi tiết hoạt động số sẽ chèn vào..."
                                          />
                                      </div>
                                  </div>
                              </div>
                          ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'appendix' && (
                <div className="space-y-4 animate-fade-in-up">
                    <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl text-sm text-purple-800 flex gap-3 italic">
                         <CheckCircle className="w-5 h-5 shrink-0" />
                        <p>Bảng ma trận Năng lực số này sẽ được chèn vào <strong>trang cuối cùng</strong> của giáo án.</p>
                    </div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ma trận NLS (Định dạng bảng):</label>
                    <textarea 
                        value={content.appendix_table}
                        onChange={(e) => updateField('appendix_table', e.target.value)}
                        className="w-full h-96 p-6 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-mono text-xs whitespace-pre text-slate-700 bg-slate-50/30"
                        placeholder="| Thành phần | Chỉ số | Mức độ | ..."
                    />
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SmartEditor;