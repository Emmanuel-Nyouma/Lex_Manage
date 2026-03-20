import React, { useState } from 'react';
import { 
  X, Sparkles, Loader2, Lightbulb, Mail, Plus, FileText 
} from 'lucide-react';
import { Badge } from './UI';

const CaseDrawer = ({ activeCase, onClose, onCallGemini }) => {
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [draftEmail, setDraftEmail] = useState(null);
  const [timelineEvents, setTimelineEvents] = useState([
    { id: 1, date: '2023-10-30', event: 'Motion to Dismiss', description: 'Scheduled hearing in federal court.', status: 'upcoming' },
    { id: 2, date: '2023-09-15', event: 'Discovery Phase', description: 'All relevant documents exchanged.', status: 'completed' },
  ]);

  if (!activeCase) return null;

  const generateTimeline = async () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    setDraftEmail(null);
    
    const prompt = `Based on this case: ${activeCase.name} (${activeCase.type}), create a realistic, professional chronological timeline of 4 key events (past and future). 
    Return ONLY a JSON array of objects with fields: date (YYYY-MM-DD), event (short title), description (one sentence), status (either 'completed' or 'upcoming').
    The dates should be around late 2023 and early 2024.`;
    
    try {
      const result = await onCallGemini(prompt, "You are a legal operations expert. Output ONLY valid JSON.");
      // Clean result in case of markdown blocks
      const jsonStr = result.replace(/```json|```/g, '').trim();
      const events = JSON.parse(jsonStr);
      setTimelineEvents(events);
    } catch (e) {
      console.error("Failed to parse timeline JSON", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateCaseStrategy = async () => {
    setIsAnalyzing(true);
    setDraftEmail(null); 
    const prompt = `Act as a senior partner at a top law firm. Provide a brief, strategic assessment for the following case:
    Case Name: ${activeCase.name}
    Type: ${activeCase.type}
    Client: ${activeCase.client}
    Status: ${activeCase.status}
    Amount: ${activeCase.amount}
    
    Format the output with bold headings for "Risk Assessment", "Key Precedent", and "Recommended Strategy". Keep it concise (under 150 words).`;
    
    const result = await onCallGemini(prompt, "You are a senior legal strategist.");
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const generateClientEmail = async () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    const prompt = `Draft a professional email to the client '${activeCase.client}' regarding their case '${activeCase.name}'. 
    The current status is '${activeCase.status}' and the next deadline is '${activeCase.deadline}'.
    The tone should be professional, reassuring, and concise.`;
    
    const result = await onCallGemini(prompt, "You are an expert legal secretary.");
    setDraftEmail(result);
    setIsAnalyzing(false);
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px] z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-start">
           <div>
              <Badge variant={activeCase.status === 'Active' ? 'success' : 'default'}>{activeCase.status}</Badge>
              <h2 className="text-xl font-bold text-slate-900 mt-2">{activeCase.name}</h2>
              <p className="text-slate-500 text-sm mt-1">{activeCase.client} • {activeCase.type}</p>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
             <X size={20} />
           </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           
           <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
             <h3 className="text-sm font-semibold text-amber-900 flex items-center gap-2 mb-3">
               <Sparkles size={14} className="text-amber-600" /> AI Legal Assistant
             </h3>
             <div className="flex gap-2 mb-4">
               <button 
                 onClick={generateCaseStrategy}
                 disabled={isAnalyzing}
                 className="flex-1 flex items-center justify-center gap-2 bg-white border border-amber-200 shadow-sm text-xs font-medium py-2 rounded text-slate-700 hover:bg-amber-100 transition-colors"
               >
                 {isAnalyzing && !draftEmail ? <Loader2 size={12} className="animate-spin" /> : <Lightbulb size={12} />}
                 ✨ Strategy
               </button>
               <button 
                 onClick={generateClientEmail}
                 disabled={isAnalyzing}
                 className="flex-1 flex items-center justify-center gap-2 bg-white border border-amber-200 shadow-sm text-xs font-medium py-2 rounded text-slate-700 hover:bg-amber-100 transition-colors"
               >
                 {isAnalyzing && !aiAnalysis ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
                 ✨ Draft Email
               </button>
             </div>

             {aiAnalysis && (
               <div className="bg-white p-3 rounded border border-amber-100 text-sm text-slate-800 animate-in fade-in slide-in-from-top-2">
                 <div className="whitespace-pre-line leading-relaxed font-serif">{aiAnalysis}</div>
               </div>
             )}
             {draftEmail && (
               <div className="bg-white p-3 rounded border border-amber-100 text-sm text-slate-800 animate-in fade-in slide-in-from-top-2">
                 <div className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-sans">Draft Preview:</div>
                 <div className="whitespace-pre-line leading-relaxed font-mono text-xs bg-slate-50 p-2 rounded">{draftEmail}</div>
                 <button className="mt-2 w-full py-1.5 bg-slate-900 text-white text-xs rounded hover:bg-slate-800">Copy to Clipboard</button>
               </div>
             )}
           </div>

           <div className="grid grid-cols-2 gap-4">
             <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <div className="text-xs text-slate-500 uppercase">Value</div>
                <div className="font-semibold text-slate-900">{activeCase.amount}</div>
             </div>
             <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <div className="text-xs text-slate-500 uppercase">Deadline</div>
                <div className="font-semibold text-red-600">{activeCase.deadline}</div>
             </div>
           </div>

           <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-800">Case Timeline</h3>
                <button 
                  onClick={generateTimeline}
                  disabled={isAnalyzing}
                  className="text-[10px] flex items-center gap-1 bg-slate-100 hover:bg-amber-100 text-slate-600 px-2 py-1 rounded transition-colors"
                >
                  {isAnalyzing ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} className="text-amber-500" />}
                  Smart Scan
                </button>
              </div>
              <div className="relative border-l-2 border-slate-200 ml-2 space-y-6">
                 {timelineEvents.map((event, idx) => (
                   <div key={idx} className={`ml-4 relative ${event.status === 'completed' ? 'opacity-60' : ''}`}>
                      <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ${event.status === 'completed' ? 'bg-slate-300' : 'bg-amber-500 animate-pulse'}`}></div>
                      <p className="text-sm font-medium text-slate-900">{event.event}</p>
                      <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{event.date}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{event.description}</p>
                   </div>
                 ))}
              </div>
           </div>

           <div>
              <h3 className="font-semibold text-slate-800 mb-3">Legal Team</h3>
              <div className="flex gap-2">
                 {activeCase.members.map((m,i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-full shadow-sm">
                       <div className="w-5 h-5 bg-slate-800 rounded-full text-white flex items-center justify-center text-[10px]">{m}</div>
                       <span className="text-xs font-medium text-slate-700">Attorney</span>
                    </div>
                 ))}
                 <button className="w-8 h-8 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-amber-500 hover:text-amber-500">
                    <Plus size={14} />
                 </button>
              </div>
           </div>
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
           <button className="flex-1 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800">
             Open Full File
           </button>
           <button className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50">
             Log Hours
           </button>
        </div>
      </div>
    </>
  );
}

export default CaseDrawer;
