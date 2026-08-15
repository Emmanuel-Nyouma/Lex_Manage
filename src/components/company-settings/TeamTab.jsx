import React from 'react';
import { Users, Power, Mail, Phone, CheckCircle2, UserX, Edit2 } from 'lucide-react';
import { Card, Badge, PageSkeleton } from '../ui';
import { ROLE_VARIANT, ROLE_LABELS } from './companySettingsData';

const TeamTab = ({
  inactiveCount,
  showInactive,
  setShowInactive,
  activeCount,
  isLoading,
  members,
  currentUser,
  setEditingMember,
  setConfirmAction,
}) => (
        <Card className="p-0 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900/50">
          <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users size={18} className="text-slate-500 dark:text-slate-400" />
              Current Team
            </h3>
            <div className="flex items-center gap-3">
              {/* Show/hide inactive toggle */}
              {inactiveCount > 0 && (
                <button
                  onClick={() => setShowInactive(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                    showInactive
                      ? 'border-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <Power size={12} />
                  {showInactive ? 'Hide' : 'Show'} inactive ({inactiveCount})
                </button>
              )}
              <Badge variant="info">{activeCount} active</Badge>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <PageSkeleton variant="table" className="w-full" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-16 text-slate-400">No members yet.</div>
          ) : (
            <>
            {/* Mobile: member cards (< md) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {members
                .filter(m => showInactive || m.isActive !== false)
                .map((member) => {
                  const isCurrentUser = member.id === currentUser?.id;
                  const isActive = member.isActive !== false;
                  return (
                    <div key={member.id} className={`p-4 ${!isActive ? 'opacity-60' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-sm shrink-0">
                            {member.firstName?.[0]}{member.lastName?.[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                              {member.firstName} {member.lastName}
                              {isCurrentUser && (
                                <span className="ml-1.5 text-[9px] font-black text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded uppercase tracking-wider">You</span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                              <Mail size={10} className="shrink-0" /> {member.email}
                            </p>
                            {member.phone && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                                <Phone size={10} className="shrink-0" /> {member.phone}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant={ROLE_VARIANT[member.role] || 'secondary'} className="text-[9px] font-black tracking-widest shrink-0">
                          {ROLE_LABELS[member.role] || member.role.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          {isActive ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px] uppercase tracking-tighter">
                              <CheckCircle2 size={13} /> Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-400 font-bold text-[11px] uppercase tracking-tighter">
                              <UserX size={13} /> Disabled
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingMember(member)}
                            disabled={isCurrentUser}
                            className="p-2.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-all disabled:opacity-30"
                            aria-label="Edit role"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setConfirmAction({ type: isActive ? 'deactivate' : 'reactivate', member })}
                            disabled={isCurrentUser}
                            className={`p-2.5 rounded-xl transition-all disabled:opacity-30 ${
                              isActive
                                ? 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                                : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                            }`}
                            aria-label={isActive ? 'Deactivate member' : 'Reactivate member'}
                          >
                            {isActive ? <UserX size={16} /> : <CheckCircle2 size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Desktop / tablet: table (≥ md) */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4 tracking-wider">Member</th>
                    <th className="px-6 py-4 tracking-wider">Role</th>
                    <th className="px-6 py-4 tracking-wider">Status</th>
                    <th className="px-6 py-4 tracking-wider">Joined</th>
                    <th className="px-6 py-4 text-right tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {members
                    .filter(m => showInactive || m.isActive !== false)
                    .map((member) => {
                    const isCurrentUser = member.id === currentUser?.id;
                    const isActive = member.isActive !== false;
                    return (
                      <tr
                        key={member.id}
                        className={`transition-colors ${
                          isActive
                            ? 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'
                            : 'bg-slate-50/40 dark:bg-slate-800/10 opacity-60 hover:opacity-80'
                        }`}
                      >
                        {/* Member info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-sm shrink-0">
                              {member.firstName?.[0]}{member.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-sm">
                                {member.firstName} {member.lastName}
                                {isCurrentUser && (
                                  <span className="ml-2 text-[9px] font-black text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                    You
                                  </span>
                                )}
                              </p>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                  <Mail size={10} /> {member.email}
                                </span>
                                {member.phone && (
                                  <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                    <Phone size={10} /> {member.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4">
                          <Badge variant={ROLE_VARIANT[member.role] || 'secondary'} className="text-[10px] font-black tracking-widest">
                            {ROLE_LABELS[member.role] || member.role.replace('_', ' ')}
                          </Badge>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {isActive ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs uppercase tracking-tighter">
                              <CheckCircle2 size={14} /> Active
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs uppercase tracking-tighter">
                              <UserX size={14} /> Disabled
                            </div>
                          )}
                        </td>

                        {/* Joined */}
                        <td className="px-6 py-4 text-xs text-slate-400 dark:text-slate-500 font-medium">
                          {member.createdAt
                            ? new Date(member.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Edit role */}
                            <button
                              onClick={() => setEditingMember(member)}
                              disabled={isCurrentUser}
                              className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all disabled:opacity-30"
                              title="Edit role"
                            >
                              <Edit2 size={15} />
                            </button>

                            {/* Soft disable / reactivate */}
                            <button
                              onClick={() =>
                                setConfirmAction({
                                  type: isActive ? 'deactivate' : 'reactivate',
                                  member,
                                })
                              }
                              disabled={isCurrentUser}
                              className={`p-2 rounded-lg transition-all disabled:opacity-30 ${
                                isActive
                                  ? 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                                  : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                              }`}
                              title={isActive ? 'Deactivate member' : 'Reactivate member'}
                            >
                              {isActive ? <UserX size={15} /> : <CheckCircle2 size={15} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}
        </Card>
);

export default TeamTab;
