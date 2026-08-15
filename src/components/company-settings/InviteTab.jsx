import React from 'react';
import { UserPlus, Mail, Shield, ChevronDown, Loader2, Check, Copy } from 'lucide-react';
import { Card } from '../ui';

const InviteTab = ({
  email,
  setEmail,
  role,
  setRole,
  isInviting,
  handleInvite,
  lastGeneratedLink,
  copyToClipboard,
  setActiveTab,
}) => (
        <div className="max-w-md">
          <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <UserPlus size={20} className="text-amber-500" /> Invite a member
            </h3>

            <form onSubmit={handleInvite} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                  Professional Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john.doe@lawfirm.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                  Role in the firm
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all dark:text-white"
                  >
                    <option value="LAWYER">Lawyer / Associate</option>
                    <option value="ASSISTANT">Legal Assistant</option>
                    <option value="SECRETARY">Secretary</option>
                    <option value="CABINET_ADMIN">Administrator</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
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
                <p className="text-[10px] font-bold text-amber-800 dark:text-amber-500 uppercase mb-2">
                  Invitation link ready:
                </p>
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
                <p className="text-[9px] text-amber-700 dark:text-amber-500/70 mt-3 italic leading-relaxed">
                  Send this link to your associate. They can create their account and automatically join your firm.
                </p>
                <button
                  onClick={() => setActiveTab('invitations')}
                  className="mt-3 text-[10px] font-bold text-amber-600 dark:text-amber-400 underline underline-offset-2 hover:no-underline"
                >
                  View all pending invitations →
                </button>
              </div>
            )}
          </Card>
        </div>
);

export default InviteTab;
