import React from 'react';
import { Clock, ExternalLink, Copy, Trash2, Mail } from 'lucide-react';
import { Card, Badge, PageSkeleton } from '../ui';
import { ROLE_LABELS } from './companySettingsData';

const InvitationsTab = ({ isLoading, invitations, copyToClipboard, revokeInvitation }) => (
        <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Clock size={20} className="text-slate-500 dark:text-slate-400" />
            Pending Invitations
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <PageSkeleton variant="table" className="w-full" />
            </div>
          ) : invitations.length > 0 ? (
            <>
            {/* Mobile: invitation cards (< md) */}
            <div className="md:hidden space-y-3">
              {invitations.map((invite) => (
                <div key={invite.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{invite.email}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 uppercase tracking-tighter">
                        <ExternalLink size={10} /> {invite.token.slice(0, 8)}…
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {ROLE_LABELS[invite.role] || invite.role.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                      <Clock size={12} /> Expire le {new Date(invite.expiresAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => copyToClipboard(`${window.location.origin}/login?invitation=${invite.token}`)}
                        className="p-2.5 text-slate-400 hover:text-amber-600 transition-colors rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        aria-label="Copy invitation link"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => revokeInvitation(invite.id)}
                        className="p-2.5 text-slate-400 hover:text-red-600 transition-colors rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
                        aria-label="Revoke invitation"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop / tablet: table (≥ md) */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
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
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{invite.email}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 uppercase tracking-tighter">
                          <ExternalLink size={10} /> TOKEN: {invite.token.slice(0, 8)}…
                        </p>
                      </td>
                      <td className="py-4 px-2">
                        <Badge variant="secondary">
                          {ROLE_LABELS[invite.role] || invite.role.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-4 px-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {new Date(invite.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() =>
                              copyToClipboard(
                                `${window.location.origin}/login?invitation=${invite.token}`
                              )
                            }
                            className="p-2 text-slate-400 hover:text-amber-600 transition-colors rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            title="Copy invitation link"
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            onClick={() => revokeInvitation(invite.id)}
                            className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Revoke invitation"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          ) : (
            <div className="text-center py-10 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <Mail className="text-slate-300 mx-auto mb-3" size={32} />
              <p className="text-slate-400 italic text-sm">No active invitations.</p>
            </div>
          )}
        </Card>
);

export default InvitationsTab;
