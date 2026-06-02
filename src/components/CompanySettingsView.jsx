import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Mail, 
  Shield, 
  Copy, 
  Check, 
  Trash2, 
  Loader2, 
  Clock,
  ExternalLink,
  AlertCircle,
  ChevronDown,
  Users
} from 'lucide-react';
import useLexStore from '../store/useLexStore';
import apiClient from '../lib/api';
import { toast } from 'sonner';
import { Card, Badge } from './ui';

const CompanySettingsView = () => {
  const { currentUser } = useLexStore();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('LAWYER');
  const [isInviting, setIsInviting] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastGeneratedLink, setLastGeneratedLink] = useState('');

  const isAdmin = currentUser?.role === 'CABINET_ADMIN';

  const fetchData = React.useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const [invitesRes, membersRes] = await Promise.all([
        apiClient.get('/tenants/invitations'),
        apiClient.get('/tenants/members')
      ]);
      setInvitations(invitesRes.data || []);
      setMembers(membersRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Error loading data');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-600 dark:text-slate-300 animate-in fade-in duration-500">
        <AlertCircle size={48} className="mb-4 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Restricted Access</h2>
        <p>Only firm administrators can access these settings.</p>
      </div>
    );
  }

  const handleInvite = async (e) => {
    e.preventDefault();
    setIsInviting(true);
    setLastGeneratedLink('');

    try {
      const { data } = await apiClient.post('/tenants/invitations', { email, role });
      const inviteLink = `${window.location.origin}/login?invitation=${data.token}`;
      setLastGeneratedLink(inviteLink);
      toast.success('Invitation created successfully!');
      setEmail('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error during invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const revokeInvitation = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this invitation?')) return;
    try {
      await apiClient.delete(`/tenants/invitations/${id}`);
      toast.success('Invitation revoked');
      fetchData();
    } catch {
      toast.error('Error during revocation');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Firm Settings</h1>
        <p className="text-slate-600 dark:text-slate-300 dark:text-slate-400 font-medium mt-1">Manage your professional team and secure access.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Invitation Form */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <UserPlus size={20} className="text-amber-500" /> Invite a member
            </h3>
            
            <form onSubmit={handleInvite} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest mb-2">Professional Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" size={16} />
                  <input 
                    type="email" required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john.doe@lawfirm.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest mb-2">Role in the firm</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" size={16} />
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  >
                    <option value="LAWYER">Lawyer / Associate</option>
                    <option value="ASSISTANT">Legal Assistant</option>
                    <option value="SECRETARY">Secretary</option>
                    <option value="CABINET_ADMIN">Administrator</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300 pointer-events-none" size={14} />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isInviting}
                className="w-full py-3.5 bg-slate-900 dark:bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-amber-700 shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isInviting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                Generate invitation
              </button>
            </form>

            {lastGeneratedLink && (
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl animate-in zoom-in-95">
                <p className="text-[10px] font-bold text-amber-800 dark:text-amber-500 uppercase mb-2">Invitation link ready:</p>
                <div className="flex gap-2">
                  <input 
                    readOnly
                    value={lastGeneratedLink}
                    className="flex-1 bg-white dark:bg-slate-950 border border-amber-200 dark:border-amber-800 rounded-lg px-2 py-2 text-[10px] text-slate-600 dark:text-slate-300 outline-none"
                  />
                  <button 
                    onClick={() => copyToClipboard(lastGeneratedLink)}
                    className="p-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors shadow-sm"
                  >
                    <Copy size={16} className="text-amber-600" />
                  </button>
                </div>
                <p className="text-[9px] text-amber-700 dark:text-amber-500/70 mt-3 italic leading-relaxed">Send this link to your associate. They can create their account and automatically join your firm.</p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Members and invitations list */}
        <div className="lg:col-span-2 space-y-8">
          {/* Members list */}
          <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900/50">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Users size={20} className="text-slate-500 dark:text-slate-300" /> Current Team ({members.length})
            </h3>

            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                      {member.firstName[0]}{member.lastName[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{member.firstName} {member.lastName}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{member.email}</p>
                    </div>
                  </div>
                  <Badge variant={member.role === 'CABINET_ADMIN' ? 'info' : 'secondary'}>
                    {member.role.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Pending invitations */}
          <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Clock size={20} className="text-slate-500 dark:text-slate-300" /> Pending Invitations
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="animate-spin text-amber-500" size={24} />
              </div>
            ) : invitations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-4 px-2">Associate</th>
                      <th className="pb-4 px-2">Role</th>
                      <th className="pb-4 px-2">Expires on</th>
                      <th className="pb-4 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {invitations.map((invite) => (
                      <tr key={invite.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-2">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">{invite.email}</div>
                          <div className="text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-0.5 uppercase tracking-tighter">
                            <ExternalLink size={10} /> TOKEN: {invite.token.slice(0, 8)}...
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <Badge variant="secondary">
                            {invite.role.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-4 px-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {new Date(invite.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-2 text-right">
                          <div className="flex justify-end gap-1">
                            <button 
                              onClick={() => copyToClipboard(`${window.location.origin}/login?invitation=${invite.token}`)}
                              className="p-2 text-slate-500 dark:text-slate-300 hover:text-amber-600 transition-colors rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20"
                              title="Copy link"
                            >
                              <Copy size={18} />
                            </button>
                            <button 
                              onClick={() => revokeInvitation(invite.id)}
                              className="p-2 text-slate-500 dark:text-slate-300 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Revoke"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <Mail className="text-slate-300 mx-auto mb-3" size={32} />
                <p className="text-slate-500 dark:text-slate-300 italic text-sm">No active invitations.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CompanySettingsView;


