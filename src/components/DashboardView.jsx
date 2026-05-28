import React, { useRef, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Briefcase, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  Send,
  Brain,
  FileText,
  Bot
} from 'lucide-react';
import { Badge } from './UI';
import useLexStore from '../store/useLexStore';
import { useCases } from '../hooks/useCases';
import { useNotifications } from '../hooks/useNotifications';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';

const useAiDashboardData = () => {
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
    <div className="flex flex-col h-full min-h-[200px]">
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 max-h-[200px]">
        {messages.map((m, i) => (
          <div key={i} className={`p-3 rounded-xl text-sm ${m.role === 'user' ? 'bg-slate-100 ml-auto max-w-[80%]' : 'bg-purple-50 mr-auto max-w-[80%]'}`}>
            {m.text}
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-auto">
        <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 bg-slate-50 border rounded-lg px-3 py-2 text-sm" placeholder="Ask AI..." />
        <button onClick={sendMessage} disabled={isLoading} className="bg-slate-900 text-white p-2 rounded-lg"><Send size={16} /></button>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, trend, color, subValue }) => {
  const StatIcon = icon;
  const colorMap = {
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-500",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-500",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-500",
    red: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-500",
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colorMap[color] || colorMap.amber}`}>
          <StatIcon size={24} />
        </div>
        {trend && <Badge variant="success" className="text-[10px]">{trend}</Badge>}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
        {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
      </div>
    </div>
  );
};

const data = [
  { day: 'Mon', hours: 6 },
  { day: 'Tue', hours: 9 },
  { day: 'Wed', hours: 4 },
  { day: 'Thu', hours: 10 },
  { day: 'Fri', hours: 7 },
  { day: 'Sat', hours: 2 },
  { day: 'Dim', hours: 0 },
];

const DashboardView = () => {
  const [isMounted, setIsMounted] = React.useState(false);
  const { currentUser } = useLexStore();
  const { data: cases } = useCases();
  const { notifications } = useNotifications();
  const { data: aiData } = useAiDashboardData();
  
  React.useEffect(() => { setIsMounted(true); }, []);

  const activeCasesCount = cases?.filter(c => c.status === 'OPEN' || c.status === 'en cours')?.length || 0;
  
  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Executive Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Welcome back, {currentUser?.firstName}. Here's your firm's overview.</p>
      </div>

      {/* KPI Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard icon={Briefcase} label="Active Cases" value={activeCasesCount} color="amber" />
        <StatCard icon={Clock} label="Upcoming Deadlines" value={notifications.filter(n => n.type === 'DEADLINE').length} color="blue" />
        <StatCard icon={Brain} label="AI Summaries" value={aiData?.metrics.summariesGenerated || 0} color="purple" subValue="Generated this week" />
        <StatCard icon={AlertTriangle} label="At-risk Cases" value={aiData?.metrics.urgentCases || 0} color="red" subValue="Hearings < 7 days" />
        <StatCard icon={FileText} label="Documents Analyzed" value={aiData?.metrics.docsAnalyzed || 0} color="amber" subValue="Processed today" />
      </section>

      {/* Main Content */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Weekly Workload Chart */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" /> Weekly Workload
          </h3>
          <div className="h-[300px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Bar dataKey="hours" radius={[6, 6, 0, 0]} barSize={40}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.hours > 8 ? '#f59e0b' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="xl:col-span-1 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <FileText size={20} className="text-purple-500" /> AI Summaries <Badge variant="neutral">AI</Badge>
            </h3>
            <div className="space-y-4">
              {aiData?.casesWithSummary.map(c => (
                <div key={c.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{c.title}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-slate-950 p-8 rounded-3xl text-white shadow-xl">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
              <Bot size={20} className="text-purple-400" /> AI Assistant
            </h3>
            <DashboardChat firmId={currentUser?.tenantId} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardView;
