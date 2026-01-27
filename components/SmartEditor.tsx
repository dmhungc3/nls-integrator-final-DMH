import React, { useState, useEffect } from 'react';
import { GeneratedNLSContent, ActivityItem } from '../types';
import { Save, RefreshCw, PenTool, CheckCircle, Trash2, Plus } from 'lucide-react';

interface SmartEditorProps {
  initialContent: GeneratedNLSContent;
  onConfirm: (finalContent: GeneratedNLSContent) => void;
  onCancel: () => void;
}

type Tab = 'objectives' | 'materials' | 'activities' | 'appendix';

const SmartEditor: React.FC<SmartEditorProps> = ({ initialContent, onConfirm, onCancel }) => {
  const [content, setContent] = useState<GeneratedNLSContent>(initialContent);
  const [activeTab, setActiveTab] = useState<Tab>('objectives');

  // Sync state when props change
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
      { anchor_text: "Văn bản trong giáo án gốc...", content: "➤ Tích hợp NLS: ..." }
    ];
    updateField('activities_integration', newActivities);
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-primary-100 overflow-hidden flex flex-col h-[600px] animate-fade-in">
      {/* Header - Changed to Light Theme */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
                <PenTool className="w-5 h-5 text-primary-600" />
            </div>
            <div>
                <h3 className="font-bold text-lg text-slate-800">Smart Studio</h3>
                <p className="text-xs text-slate-500">Hiệu chỉnh nội dung trước khi tích hợp</p>
            </div>
        </div>
        <div className="flex gap-3">
             <button 
                onClick={onCancel}
                className="px-4 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors font-medium"
             >
                Hủy bỏ
             </button>
             <button 
                onClick={() => onConfirm(content)}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary-200 transition-all transform hover:-translate-y-0.5"
             >
                <Save className="w-4 h-4" /> Xuất file Word
             </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-64 bg-slate-50 border-r border-slate-200 p-4 flex flex-col gap-2 shrink-0">
            {[
                { id: 'objectives', label: '1. Mục tiêu NLS', icon: '🎯' },
                { id: 'materials', label: '2. Học liệu số', icon: '💻' },
                { id: 'activities', label: '3. Hoạt động', icon: '⚡', badge: content.activities_integration.length },
                { id: 'appendix', label: '4. Phụ lục', icon: '📊' },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${
                        activeTab === tab.id 
                        ? 'bg-white shadow-md text-primary-700 font-bold border border-primary-100' 
                        : 'text-slate-600 hover:bg-white hover:shadow-sm'
                    }`}
                >
                    <span className="flex items-center gap-2">
                        <span className="text-lg">{tab.icon}</span> {tab.label}
                    </span>
                    {tab.badge !== undefined && (
                        <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full font-bold">{tab.badge}</span>
                    )}
                </button>
            ))}
        </div>

        {/* Edit Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-white custom-scrollbar">
            
            {/* Objectives Tab */}
            {activeTab === 'objectives' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="bg-primary-50 border border-primary-100 p-4 rounded-xl text-sm text-primary-800 flex gap-2">
                        <CheckCircle className="w-5 h-5 shrink-0" />
                        <p>Nội dung này sẽ được chèn vào phần <strong>"Năng lực"</strong> trong giáo án.</p>
                    </div>
                    <label className="block text-sm font-bold text-slate-700 uppercase">Nội dung thêm mới:</label>
                    <textarea 
                        value={content.objectives_addition}
                        onChange={(e) => updateField('objectives_addition', e.target.value)}
                        className="w-full h-64 p-4 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all font-mono text-sm leading-relaxed text-slate-700 bg-white"
                        placeholder="Nhập mục tiêu năng lực số..."
                    />
                </div>
            )}

            {/* Materials Tab */}
            {activeTab === 'materials' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="bg-primary-50 border border-primary-100 p-4 rounded-xl text-sm text-primary-800 flex gap-2">
                         <CheckCircle className="w-5 h-5 shrink-0" />
                        <p>Nội dung này sẽ được chèn vào phần <strong>"Thiết bị dạy học/Học liệu"</strong>.</p>
                    </div>
                    <label className="block text-sm font-bold text-slate-700 uppercase">Danh sách thiết bị/Phần mềm:</label>
                    <textarea 
                        value={content.materials_addition}
                        onChange={(e) => updateField('materials_addition', e.target.value)}
                        className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all text-sm font-medium text-slate-700 bg-white"
                    />
                </div>
            )}

            {/* Activities Tab */}
            {activeTab === 'activities' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-xl text-sm text-yellow-800 flex gap-2 max-w-2xl">
                             <CheckCircle className="w-5 h-5 shrink-0" />
                            <p>Hệ thống sẽ tìm <strong>"Vị trí chèn (Anchor)"</strong> trong file gốc và chèn <strong>"Nội dung tích hợp"</strong> ngay phía sau đó.</p>
                        </div>
                        <button 
                            onClick={addActivity}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Thêm hoạt động
                        </button>
                    </div>

                    {content.activities_integration.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50">
                            Chưa có hoạt động nào được đề xuất.
                        </div>
                    ) : (
                        content.activities_integration.map((activity, index) => (
                            <div key={index} className="bg-white rounded-xl p-5 border border-slate-200 group hover:border-primary-300 shadow-sm transition-all relative">
                                <button 
                                    onClick={() => removeActivity(index)}
                                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors p-1"
                                    title="Xóa hoạt động này"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                
                                <div className="grid gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">🔍 Vị trí chèn (Anchor Text trong file gốc)</label>
                                        <input 
                                            type="text"
                                            value={activity.anchor_text}
                                            onChange={(e) => updateActivity(index, 'anchor_text', e.target.value)}
                                            className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-50 text-sm bg-slate-50 focus:bg-white transition-colors"
                                            placeholder="Copy một câu ngắn trong giáo án gốc để làm mốc..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-primary-600 uppercase mb-1">✨ Nội dung tích hợp NLS</label>
                                        <textarea 
                                            value={activity.content}
                                            onChange={(e) => updateActivity(index, 'content', e.target.value)}
                                            className="w-full p-2.5 rounded-lg border border-primary-100 focus:border-primary-500 focus:ring-2 focus:ring-primary-50 text-sm font-medium bg-slate-50 focus:bg-white h-24 transition-colors"
                                            placeholder="Mô tả hoạt động..."
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Appendix Tab */}
            {activeTab === 'appendix' && (
                <div className="space-y-4 animate-fade-in">
                     <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl text-sm text-purple-800 flex gap-2">
                         <CheckCircle className="w-5 h-5 shrink-0" />
                        <p>Bảng này sẽ được thêm vào <strong>cuối cùng</strong> của giáo án.</p>
                    </div>
                    <label className="block text-sm font-bold text-slate-700 uppercase">Bảng ma trận NLS:</label>
                    <textarea 
                        value={content.appendix_table}
                        onChange={(e) => updateField('appendix_table', e.target.value)}
                        className="w-full h-80 p-4 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all font-mono text-sm whitespace-pre text-slate-700 bg-white"
                        placeholder="| Mã NLS | Yêu cầu | ..."
                    />
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SmartEditor;