import React, { useState } from 'react';
import { 
  Database, 
  CheckCircle2, 
  Link as LinkIcon, 
  ShieldCheck, 
  X, 
  UserPlus, 
  ChevronDown, 
  Check 
} from 'lucide-react';
import { Card, Badge } from './UI';

const AdminView = ({ adminUsers, onAddUser, t }) => {
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'Associate',
    rate: ''
  });

  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email || !newUserForm.rate) return;

    const newUser = {
      id: Date.now(),
      name: newUserForm.name,
      role: newUserForm.role,
      email: newUserForm.email,
      rate: newUserForm.rate.includes('$') ? newUserForm.rate : `$${newUserForm.rate}/hr`,
      status: 'Active'
    };

    onAddUser(newUser);
    setIsAddingUser(false);
    setNewUserForm({ name: '', email: '', role: 'Associate', rate: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.admin}</h1>
         <Badge variant="navy">Super Admin Access</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 p-6 border-l-4 border-l-amber-500 dark:bg-slate-800 dark:border-slate-700">
           <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
             <Database size={18} /> System Status
           </h3>
           <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                 <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <div>
                      <p className="text-sm font-medium text-emerald-900 dark:text-emerald-400">n8n RAG Workflow</p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-500">Connected & Syncing</p>
                    </div>
                 </div>
                 <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400"/>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                 <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-300">SharePoint Integration</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">Idle - Last sync 2h ago</p>
                    </div>
                 </div>
                 <LinkIcon size={16} className="text-slate-400"/>
              </div>
           </div>
        </Card>

        <Card className="col-span-1 md:col-span-2 p-0 dark:bg-slate-800 dark:border-slate-700">
           <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
             <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
               <ShieldCheck size={18} /> Security Audit Log
             </h3>
             <button className="text-xs text-amber-600 hover:underline">Export CSV</button>
           </div>
           <div className="p-0">
             <table className="w-full text-xs">
               <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-2 text-left">Time</th>
                    <th className="px-4 py-2 text-left">User</th>
                    <th className="px-4 py-2 text-left">Action</th>
                    <th className="px-4 py-2 text-left">IP Address</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                 {[1,2,3,4].map(i => (
                    <tr key={i}>
                      <td className="px-4 py-2 text-slate-500 dark:text-slate-400">Oct 24, 14:0{i}</td>
                      <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-200">User A</td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-400">Accessed Case #10{i}</td>
                      <td className="px-4 py-2 text-slate-400 dark:text-slate-500 font-mono">192.168.1.{i+10}</td>
                    </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </Card>
      </div>

      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800 dark:text-white">User Management</h3>
          <button 
            onClick={() => setIsAddingUser(!isAddingUser)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-2 ${isAddingUser ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' : 'bg-slate-900 dark:bg-amber-600 text-white hover:bg-slate-800 dark:hover:bg-amber-700'}`}
          >
             {isAddingUser ? <X size={14}/> : <UserPlus size={14} />}
             {isAddingUser ? 'Cancel' : 'Add Lawyer'}
          </button>
        </div>

        {isAddingUser && (
          <div className="p-6 bg-slate-50 border-b border-slate-100 animate-in slide-in-from-top-2 duration-300">
            <h4 className="text-sm font-semibold text-slate-900 mb-4">Register New Personnel</h4>
            <form onSubmit={handleAddUserSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label>
                <input 
                  type="text" required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({...newUserForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  placeholder="e.g. Jessica Pearson"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email Address</label>
                <input 
                  type="email" required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  placeholder="lawyer@lexmanage.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Role</label>
                <div className="relative">
                  <select 
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({...newUserForm, role: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 appearance-none bg-white"
                  >
                    <option value="Partner">Partner</option>
                    <option value="Associate">Associate</option>
                    <option value="Paralegal">Paralegal</option>
                    <option value="Admin">Administrator</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Hourly Billing Rate</label>
                <input 
                  type="number" required
                  value={newUserForm.rate}
                  onChange={(e) => setNewUserForm({...newUserForm, rate: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  placeholder="e.g. 450"
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                <button 
                  type="button" onClick={() => setIsAddingUser(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-sm text-slate-600 hover:bg-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white rounded text-sm font-medium hover:bg-amber-700 shadow-sm transition-colors flex items-center gap-2"
                >
                  <Check size={14} /> Create Account
                </button>
              </div>
            </form>
          </div>
        )}

        <table className="w-full text-sm text-left">
           <thead className="bg-slate-50 text-slate-500">
             <tr>
               <th className="px-6 py-3 font-medium">Name</th>
               <th className="px-6 py-3 font-medium">Role</th>
               <th className="px-6 py-3 font-medium">Billing Rate</th>
               <th className="px-6 py-3 font-medium">Status</th>
               <th className="px-6 py-3 font-medium text-right">Action</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
             {adminUsers.map(u => (
               <tr key={u.id} className="hover:bg-slate-50">
                 <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{u.name}</div>
                    {u.email && <div className="text-xs text-slate-400">{u.email}</div>}
                 </td>
                 <td className="px-6 py-4">{u.role}</td>
                 <td className="px-6 py-4 text-slate-600">{u.rate}</td>
                 <td className="px-6 py-4">
                   <Badge variant="success">Active</Badge>
                 </td>
                 <td className="px-6 py-4 text-right">
                   <button className="text-slate-400 hover:text-amber-600 transition-colors">Edit</button>
                 </td>
               </tr>
             ))}
           </tbody>
        </table>
      </Card>
    </div>
  );
};

export default AdminView;
