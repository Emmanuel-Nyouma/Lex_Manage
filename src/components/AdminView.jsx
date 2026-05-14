import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  ChevronDown, 
  Check,
  Mail,
  User,
  DollarSign
} from 'lucide-react';
import { Card, Badge, Button, Input } from './UI';

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

      <Card className="dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
          <h3 className="font-semibold text-slate-800 dark:text-white">User Management</h3>
          <Button 
            variant={isAddingUser ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => setIsAddingUser(!isAddingUser)}
            icon={isAddingUser ? X : UserPlus}
          >
             {isAddingUser ? 'Cancel' : 'Add Lawyer'}
          </Button>
        </div>

        {isAddingUser && (
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-300">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Register New Personnel</h4>
            <form onSubmit={handleAddUserSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Full Name</label>
                <Input 
                  type="text" required
                  value={newUserForm.name}
                  icon={User}
                  onChange={(e) => setNewUserForm({...newUserForm, name: e.target.value})}
                  placeholder="e.g. Jessica Pearson"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Email Address</label>
                <Input 
                  type="email" required
                  value={newUserForm.email}
                  icon={Mail}
                  onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                  placeholder="lawyer@lexmanage.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Role</label>
                <div className="relative">
                  <select 
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({...newUserForm, role: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all dark:text-white appearance-none text-sm"
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
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Hourly Billing Rate</label>
                <Input 
                  type="number" required
                  value={newUserForm.rate}
                  icon={DollarSign}
                  onChange={(e) => setNewUserForm({...newUserForm, rate: e.target.value})}
                  placeholder="e.g. 450"
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                <Button 
                  variant="secondary"
                  onClick={() => setIsAddingUser(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  icon={Check}
                >
                  Create Account
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
             <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b dark:border-slate-800">
               <tr>
                 <th className="px-6 py-3 font-medium">Name</th>
                 <th className="px-6 py-3 font-medium">Role</th>
                 <th className="px-6 py-3 font-medium">Billing Rate</th>
                 <th className="px-6 py-3 font-medium">Status</th>
                 <th className="px-6 py-3 font-medium text-right">Action</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
               {adminUsers.map(u => (
                 <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                   <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">{u.name}</div>
                      {u.email && <div className="text-xs text-slate-400 dark:text-slate-500">{u.email}</div>}
                   </td>
                   <td className="px-6 py-4 dark:text-slate-300">{u.role}</td>
                   <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">{u.rate}</td>
                   <td className="px-6 py-4">
                     <Badge variant="success">Active</Badge>
                   </td>
                   <td className="px-6 py-4 text-right">
                     <button className="text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors font-medium">Edit</button>
                   </td>
                 </tr>
               ))}
             </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminView;
