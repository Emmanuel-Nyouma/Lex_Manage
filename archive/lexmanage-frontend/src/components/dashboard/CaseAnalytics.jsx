// src/components/dashboard/CaseAnalytics.jsx - Interactive charts
import React, { useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const CaseAnalytics = ({ cases, onChartClick }) => {
  const [chartType, setChartType] = useState('status');
  const [selectedDataPoint, setSelectedDataPoint] = useState(null);

  // Prepare data
  const statusData = cases.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusData).map(([name, value]) => ({ name, value }));

  const monthlyData = cases.reduce((acc, c) => {
    const month = new Date(c.created_at).toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const handleChartClick = (data) => {
    setSelectedDataPoint(data);
    if (chartType === 'status') {
      onChartClick('cases', { status: data.name });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-white">Case Analytics</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('status')}
            className={`px-3 py-1 text-sm rounded-lg ${
              chartType === 'status' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            By Status
          </button>
          <button
            onClick={() => setChartType('timeline')}
            className={`px-3 py-1 text-sm rounded-lg ${
              chartType === 'timeline' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Timeline
          </button>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'status' ? (
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                onClick={handleChartClick}
                cursor="pointer"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
            </PieChart>
          ) : (
            <BarChart data={Object.entries(monthlyData).map(([month, count]) => ({ month, count }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
              <Bar dataKey="count" fill="#3B82F6" onClick={handleChartClick} cursor="pointer" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      
      {selectedDataPoint && (
        <div className="mt-4 p-3 bg-blue-900/20 rounded-lg text-sm text-blue-200">
          <p>Showing cases with: {selectedDataPoint.name}</p>
          <button 
            onClick={() => setSelectedDataPoint(null)}
            className="text-xs text-blue-400 mt-1 hover:underline"
          >
            Clear filter
          </button>
        </div>
      )}
    </div>
  );
};

export default CaseAnalytics;
