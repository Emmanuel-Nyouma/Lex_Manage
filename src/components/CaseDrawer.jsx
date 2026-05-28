import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Loader2, Lightbulb, Mail, Plus, FileText, Clock 
} from 'lucide-react';
import { Badge } from './ui';

import { useDeadlines, useCreateDeadline, useMarkDeadlineDone } from '../hooks/useCases';

const CaseDrawer = ({ activeCase, onClose, onCallGemini }) => {
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [draftEmail, setDraftEmail] = useState(null);
  
  // Real Deadlines Hooks
  const { data: deadlines, isLoading: isLoadingDeadlines } = useDeadlines(activeCase?.id);
  const createDeadline = useCreateDeadline(activeCase?.id);
  const markDone = useMarkDeadlineDone(activeCase?.id);

  const [newDeadlineTitle, setNewDeadlineTitle] = useState('');
  const [newDeadlineDate, setNewDeadlineDate] = useState('');
  const [isAddingDeadline, setIsNewAddingDeadline] = useState(false);

  // Task 2: Global Navigation & Close Triggers
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!activeCase) return null;

  const handleAddDeadline = async (e) => {
    e.preventDefault();
    if (!newDeadlineTitle || !newDeadlineDate) return;
    
    await createDeadline.mutateAsync({
      title: newDeadlineTitle,
      dueAt: newDeadlineDate,
      priority: 'MEDIUM'
    });
    
    setNewDeadlineTitle('');
    setNewDeadlineDate('');
    setIsNewAddingDeadline(false);
  };

  const generateCaseStrategy = async () => {
    setIsAnalyzing(true);
    setDraftEmail(null); 
    const prompt = `Act as a senior partner at a top law firm. Provide a brief, strategic assessment for the following case:
    Case Name: ${activeCase.title}
    Client: ${activeCase.client_name}
    Status: ${activeCase.status}
    
    Format the output with bold headings for "Risk Assessment", "Key Precedent", and "Recommended Strategy". Keep it concise (under 150 words).`;
    
    const result = await onCallGemini(prompt, "You are a senior legal strategist.");
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const generateClientEmail = async () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    const prompt = `Draft a professional email to the client '${activeCase.client_name}' regarding their case '${activeCase.title}'. 
    The current status is '${activeCase.status}'.
    The tone should be professional, reassuring, and concise.`;
    
    const result = await onCallGemini(prompt, "You are an expert legal secretary.");
    setDraftEmail(result);
    setIsAnalyzing(false);
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px] z-40" onClick={onClose} />
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white dark:bg-slate-900 shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex flex-col border-l border-slate-200 dark:border-slate-800 transition-all ${activeCase ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-white dark:bg-slate-900 sticky top-0 z-10">
           <div>
              <Badge variant={activeCase.status === 'Active' || activeCase.status === 'en cours' ? 'success' : 'default'}>{activeCase.status}</Badge>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2 leading-tight">{activeCase.title}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">{activeCase.client_name} • {activeCase.courtName || 'Jurisdiction not defined'}</p>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
             <X size={20} />
           </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
           
           <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl p-5 border border-amber-100 dark:border-amber-900/30">
             <h3 className="text-sm font-bold text-amber-900 dark:text-amber-400 flex items-center gap-2 mb-4 uppercase tracking-wider">
               <Sparkles size={16} className="text-amber-600" /> AI Legal Assistant
             </h3>
             <div className="flex flex-col sm:flex-row gap-2 mb-4">
               <button 
                 onClick={generateCaseStrategy}
                 disabled={isAnalyzing}
                 className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/50 shadow-sm text-xs font-bold py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all active:scale-95 disabled:opacity-50"
               >
                 {isAnalyzing && !draftEmail ? <Loader2 size={14} className="animate-spin" /> : <Lightbulb size={14} className="text-amber-500" />}
                 Strategy
               </button>
               <button 
                 onClick={generateClientEmail}
                 disabled={isAnalyzing}
                 className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/50 shadow-sm text-xs font-bold py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all active:scale-95 disabled:opacity-50"
               >
                 {isAnalyzing && !aiAnalysis ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} className="text-amber-500" />}
                 Draft Email
               </button>
             </div>

             {aiAnalysis && (
               <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 text-sm text-slate-800 dark:text-slate-200 animate-in fade-in slide-in-from-top-2 shadow-inner">
                 <div className="whitespace-pre-line leading-relaxed font-serif text-[13px]">{aiAnalysis}</div>
               </div>
             )}
             {draftEmail && (
               <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 text-sm text-slate-800 dark:text-slate-200 animate-in fade-in slide-in-from-top-2 shadow-inner">
                 <div className="text-[10px] text-amber-600 dark:text-amber-500 mb-2 uppercase tracking-widest font-bold">Email Draft Preview</div>
                 <div className="whitespace-pre-line leading-relaxed font-mono text-xs bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border dark:border-slate-800">{draftEmail}</div>
                 <button className="mt-3 w-full py-2 bg-slate-900 dark:bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-slate-800 dark:hover:bg-amber-700 transition-colors">Copy to Clipboard</button>
               </div>
             )}
           </div>

           <div>
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-2">
                  <Clock size={18} className="text-amber-500" /> Critical Deadlines
                </h3>
                <button 
                  onClick={() => setIsNewAddingDeadline(true)}
                  className="text-[10px] flex items-center gap-1.5 bg-slate-900 dark:bg-slate-800 text-white px-2.5 py-1.5 rounded-lg transition-all font-bold uppercase tracking-wider"
                >
                  <Plus size={12} /> Add
                </button>
              </div>

              {isAddingDeadline && (
                <form onSubmit={handleAddDeadline} className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 animate-in zoom-in-95">
                  <input 
                    autoFocus
                    placeholder="Deadline title..."
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/20"
                    value={newDeadlineTitle}
                    onChange={(e) => setNewDeadlineTitle(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <input 
                      type="date"
                      className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm outline-none"
                      value={newDeadlineDate}
                      onChange={(e) => setNewDeadlineDate(e.target.value)}
                    />
                    <button type="submit" className="bg-amber-600 text-white px-4 rounded-lg font-bold text-xs">OK</button>
                    <button type="button" onClick={() => setIsNewAddingDeadline(false)} className="text-slate-400 px-2">Cancel</button>
                  </div>
                </form>
              )}

              <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-8">
                 {isLoadingDeadlines ? (
                   <div className="ml-6 py-4"><Loader2 className="animate-spin text-amber-500" size={16} /></div>
                 ) : deadlines?.length > 0 ? (
                   deadlines.map((deadline) => (
                     <div key={deadline.id} className={`ml-6 relative ${deadline.isDone ? 'opacity-50' : ''}`}>
                        <button 
                          onClick={() => !deadline.isDone && markDone.mutate(deadline.id)}
                          className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 shadow-sm transition-all ${deadline.isDone ? 'bg-emerald-500' : 'bg-amber-500 ring-4 ring-amber-500/20 hover:scale-125'}`}
                        ></button>
                        <p className={`text-sm font-bold leading-tight ${deadline.isDone ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>{deadline.title}</p>
                        <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{new Date(deadline.dueAt).toLocaleDateString()}</p>
                     </div>
                   ))
                 ) : (
                   <div className="ml-6 text-xs text-slate-400 italic">No deadlines scheduled.</div>
                 )}
              </div>
           </div>

           <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 tracking-tight flex items-center gap-2">
                <FileText size={18} className="text-blue-500" /> Related Documents
              </h3>
              <div className="space-y-3">
                {activeCase.documents?.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                        <FileText size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{doc.title}</p>
                        <p className="text-[10px] text-slate-500 uppercase">{doc.fileType}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!activeCase.documents || activeCase.documents.length === 0) && (
                  <p className="text-xs text-slate-400 italic">No documents.</p>
                )}
              </div>
           </div>
        </div>
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-3 sticky bottom-0">
           <button className="flex-1 py-3 bg-slate-900 dark:bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-amber-700 transition-all active:scale-[0.98] shadow-lg shadow-slate-200 dark:shadow-none">
             Open full case
           </button>
        </div>
      </div>
    </>
  );
}

export default CaseDrawer;


