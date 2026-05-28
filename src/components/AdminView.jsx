import React, { useState } from 'react';
import { 
  Users, UserPlus, Shield, Mail, Trash2, Loader2, CheckCircle2 
} from 'lucide-react';
import { Card, Button, Input, Badge } from './UI';
import { toast } from 'sonner';

// SECURITY FIX #5: Import store for role-based access control
import useLexStore from '../store/useLexStore';

const AdminView = () => {
  const { currentUser } = useLexStore();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("avocat");
  const [isInviting, setIsInviting] = useState(false);

  // SECURITY FIX #5: Role-Based Access Control
  const isAdmin = currentUser?.role === 'admin';
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 animate-in fade-in duration-500">
        <Shield size={48} className="mb-4 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Restricted Access</h2>
        <p>Only administrators can access this section.</p>
      </div>
    );
  }

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsInviting(true);
    const toastId = toast.loading(`Sending invitation to ${email}...`);

    try {
      /* 
      // Note: We call an Edge Function because the frontend doesn't have 'service_role' rights
      const { error } = await supabase.functions.invoke('invite-member', {
        body: { email, role }
      });

      if (error) throw error;
      */
      
      toast.error("Supabase backend is disabled.");
      // toast.success("Invitation sent successfully!", { id: toastId });
      setEmail("");
    } catch (err) {
      console.error(err);
      toast.error("Invitation failed. Check your admin permissions.", { id: toastId });
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Firm Administration</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your team and your structure's access.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Invitation Form */}
        <Card className="p-6 h-fit">
          <div className="flex items-center gap-2 mb-6 text-amber-600">
            <UserPlus size={20} />
            <h3 className="font-bold text-slate-900 dark:text-white">Invite a member</h3>
          </div>

          <form onSubmit={handleInvite} className="space-y-4">
            <Input 
              label="Professional Email Address"
              type="email"
              placeholder="associate@firm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Assigned Role</label>
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 dark:text-white"
              >
                <option value="avocat">Partner Lawyer</option>
                <option value="collaborateur">Associate</option>
                <option value="secretaire">Secretary</option>
              </select>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              isLoading={isInviting}
              icon={UserPlus}
            >
              Send Invitation
            </Button>
          </form>
        </Card>

        {/* Members List (UI Mockup) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-slate-400" />
                <h3 className="font-bold text-slate-900 dark:text-white">Active Members</h3>
              </div>
              <Badge variant="info">3 Members</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Name / Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <div className="font-medium">Maitre Emmanuel</div>
                      <div className="text-xs text-slate-400 font-mono">admin@lexmanage.com</div>
                    </td>
                    <td className="px-6 py-4"><Badge variant="info">Admin</Badge></td>
                    <td className="px-6 py-4 text-emerald-500"><CheckCircle2 size={16} /></td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                  {/* More rows here... */}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
