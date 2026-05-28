import React from 'react';
import { Card, Badge } from './ui';
import { History, Filter } from 'lucide-react';

export const AuditLogsTable = ({ logs = [] }) => {
  return (
    <Card className="overflow-hidden p-0">
      <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
        <div className="flex items-center gap-2">
          <History size={20} className="text-slate-400" />
          <h3 className="font-bold text-slate-900 dark:text-white">Recent Activity Logs</h3>
        </div>
        <button className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-amber-600">
          <Filter size={14} /> Filter
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase font-bold text-slate-500">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">Target</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-800">
            {logs.length > 0 ? logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm font-medium">{log.user.name}</td>
                <td className="px-6 py-4">
                  <Badge variant={log.actionType === 'DELETE' ? 'error' : 'neutral'}>
                    {log.action}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                  {log.targetType} <span className="font-mono text-slate-400">#{log.targetId.slice(0, 8)}</span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-slate-400 text-sm italic">
                  No activity logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
