// src/components/dashboard/MetricsCards.jsx - Click-through analytics
import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Clock, Briefcase, FileText } from 'lucide-react';

const MetricCard = ({ title, value, change, icon: Icon, color, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all cursor-pointer group"
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm text-slate-400">{title}</p>
        <p className="text-2xl font-bold mt-1 text-white">{value}</p>
        {change && (
          <div className={`flex items-center mt-2 text-xs ${
            change > 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span className="ml-1">{Math.abs(change)}% from last month</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color} bg-opacity-20 group-hover:bg-opacity-30 transition-all`}>
        <Icon size={20} className={color.replace('bg-', 'text-')} />
      </div>
    </div>
  </div>
);

const MetricsCards = ({ cases, onMetricClick }) => {
  const metrics = {
    activeCases: cases.filter(c => c.status === 'IN_PROGRESS' || c.status === 'OPEN').length,
    totalValue: cases.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0),
    upcomingDeadlines: cases.filter(c => {
      const deadline = new Date(c.deadline);
      const today = new Date();
      const diffTime = deadline - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays > 0;
    }).length,
    pendingDocs: cases.filter(c => c.pending_documents > 0).length
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard
        title="Active Cases"
        value={metrics.activeCases}
        icon={Briefcase}
        color="bg-blue-400"
        onClick={() => onMetricClick('active', 'cases')}
      />
      <MetricCard
        title="Total Portfolio Value"
        value={`$${(metrics.totalValue / 1000000).toFixed(1)}M`}
        change={12.5}
        icon={DollarSign}
        color="bg-green-400"
        onClick={() => onMetricClick('value', 'financial')}
      />
      <MetricCard
        title="Upcoming Deadlines"
        value={metrics.upcomingDeadlines}
        icon={Clock}
        color="bg-amber-400"
        onClick={() => onMetricClick('deadlines', 'calendar')}
      />
      <MetricCard
        title="Pending Documents"
        value={metrics.pendingDocs}
        icon={FileText}
        color="bg-purple-400"
        onClick={() => onMetricClick('documents', 'pending')}
      />
    </div>
  );
};

export default MetricsCards;
