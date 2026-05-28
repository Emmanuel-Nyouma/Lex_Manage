import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { Badge } from './UI';
import { Send } from 'lucide-react';

const useAiDashboard = () => {
  return useQuery({
    queryKey: ['ai-dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/v1/stats/ai-dashboard');
      return data;
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
};

const StatCard = ({ label, value, delta, color }) => {
  const colorMap = {
    amber: "text-amber-600 dark:text-amber-500",
    blue: "text-blue-600 dark:text-blue-500",
    red: "text-red-600 dark:text-red-500",
  };
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <div className={`text-3xl font-black mt-2 ${colorMap[color]}`}>{value}</div>
      <p className="text-xs text-slate-400 mt-1">{delta}</p>
    </div>
  );
};

const DashboardChat = ({ firmId }) => {
  const [messages, setMessages] = useState([{ role: 'ai', text: 'How can I assist you with your cases today?' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const sessionId = useRef(`dashboard-${firmId}-${crypto.randomUUID()}`).current;

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    try {
      const { data } = await apiClient.post('/api/v1/ai/dashboard-chat', { message: input, sessionId });
      setMessages(prev => [...prev, { role: 'ai', text: data.text }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Error calling AI.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2" style={{ maxHeight: '200px' }}>
        {messages.map((m, i) => (
          <div key={i} className={`p-3 rounded-xl text-sm ${m.role === 'user' ? 'bg-slate-100 ml-auto max-w-[80%]' : 'bg-purple-50 mr-auto max-w-[80%]'}`}>
            {m.text}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 bg-slate-50 border rounded-lg px-3 py-2 text-sm" placeholder="Ask AI..." />
        <button onClick={sendMessage} disabled={isLoading} className="bg-slate-900 text-white p-2 rounded-lg"><Send size={16} /></button>
      </div>
    </div>
  );
};

const AiDashboardView = () => {
  const { data, isLoading, error } = useAiDashboard();

  if (isLoading) return <div className="p-10 animate-pulse bg-slate-100 h-64 rounded-2xl" />;
  if (error) return <div className="p-10 text-red-500">Error loading dashboard: {error.message}</div>;
  if (!data) return <div className="p-10">No data available.</div>;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">AI Dashboard</h2>
        <div className="flex gap-2">
          <Badge variant="success">n8n connected</Badge>
          <Badge variant="info">Gemini Pro</Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Summaries generated" value={data.metrics.summariesGenerated} delta="this week" color="blue" />
        <StatCard label="At-risk cases" value={data.metrics.urgentCases} delta="Hearing < 7d" color="red" />
        <StatCard label="Docs analyzed" value={data.metrics.docsAnalyzed} delta="today" color="amber" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2">Automatic Summaries <Badge variant="neutral">AI</Badge></h3>
          {data.casesWithSummary.map(c => (
            <div key={c.id} className="py-3 border-b last:border-0">
              <p className="font-semibold text-sm">{c.title}</p>
              <p className="text-xs text-slate-500 truncate">{c.description}</p>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2">AI Assistant <Badge variant="neutral">Chat</Badge></h3>
          <DashboardChat />
        </div>
      </div>
    </div>
  );
};

export default AiDashboardView;
