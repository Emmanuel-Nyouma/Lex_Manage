import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  UserPlus, Mail, Shield, Copy, Check, Trash2, Loader2, Clock,
  ExternalLink, AlertCircle, ChevronDown, Users, Edit2, X,
  MapPin, Globe, Bell, Phone, CheckCircle2, Power, BarChart2,
  UserX, Building2, Hash, Link2, Camera, Save, RefreshCw
} from 'lucide-react';
import useLexStore from '../store/useLexStore';
import apiClient from '../lib/api';
import { toast } from 'sonner';
import { Card, Badge, Button, Input } from './ui';
import SendNotificationDialog from './SendNotificationDialog';

/* ─── Role badge colors ──────────────────────────────────────────── */
const ROLE_VARIANT = {
  CABINET_ADMIN: 'info',
  LAWYER: 'secondary',
  ASSISTANT: 'neutral',
  SECRETARY: 'neutral',
  SUPER_ADMIN: 'error',
};

const ROLE_LABELS = {
  CABINET_ADMIN: 'Administrator',
  LAWYER: 'Lawyer / Associate',
  ASSISTANT: 'Legal Assistant',
  SECRETARY: 'Secretary',
  SUPER_ADMIN: 'Super Admin',
};

/* ─── Edit-member modal ──────────────────────────────────────────── */
const EditMemberModal = ({ member, onClose, onSave }) => {
  const [role, setRole] = useState(member.role);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(member.id, { role });
      onClose();
    } catch {
      toast.error('Failed to update member');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-white">
            Edit Member: {member.firstName} {member.lastName}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
              Member Role
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
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                size={14}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} isLoading={isSaving}>Update Role</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Confirm-action modal ───────────────────────────────────────── */
const ConfirmModal = ({ title, description, confirmLabel, variant = 'danger', onConfirm, onClose }) => (
  <div className="fixed inset-0 z-[130] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300 p-6 space-y-4">
      <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      <div className="flex gap-3 pt-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button
          className={`flex-1 ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800' : ''}`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  </div>
);

/* ─── Stat chip ──────────────────────────────────────────────────── */
const StatChip = ({ label, value, color = 'slate' }) => (
  <div>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{label}</p>
    <p className={`text-xl font-black ${color === 'amber' ? 'text-amber-600 dark:text-amber-500' : 'text-slate-900 dark:text-white'}`}>
      {value}
    </p>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════════ */
const CompanySettingsView = () => {
  const { currentUser } = useLexStore();

  /* form state — invite */
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('LAWYER');
  const [isInviting, setIsInviting] = useState(false);
  const [lastGeneratedLink, setLastGeneratedLink] = useState('');

  /* data state */
  const [invitations, setInvitations] = useState([]);
  const [members, setMembers] = useState([]);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /* UI state */
  const [editingMember, setEditingMember] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('team');
  const [showInactive, setShowInactive] = useState(false);

  /* form state — firm info */
  const [firmForm, setFirmForm] = useState({
    name: '', city: '', country: '', address: '',
    phone: '', fax: '', website: '', siret: '', barNumber: '',
  });
  const [isSavingFirm, setIsSavingFirm] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef(null);

  const isAdmin =
    currentUser?.role === 'CABINET_ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  /* ── fetch ── */
  const fetchData = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const [invitesRes, membersRes, tenantRes] = await Promise.all([
        apiClient.get('/tenants/invitations'),
        apiClient.get('/tenants/members'),
        apiClient.get('/tenants/me'),
      ]);
      setInvitations(invitesRes.data || []);
      setMembers(membersRes.data || []);
      setTenantInfo(tenantRes.data || null);
    } catch (err) {
      console.error(err);
      toast.error('Error loading data');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* Sync firm form when tenantInfo loads */
  useEffect(() => {
    if (!tenantInfo) return;
    setFirmForm({
      name:      tenantInfo.name      ?? '',
      city:      tenantInfo.city      ?? '',
      country:   tenantInfo.country   ?? '',
      address:   tenantInfo.address   ?? '',
      phone:     tenantInfo.phone     ?? '',
      fax:       tenantInfo.fax       ?? '',
      website:   tenantInfo.website   ?? '',
      siret:     tenantInfo.siret     ?? '',
      barNumber: tenantInfo.barNumber ?? '',
    });
    if (tenantInfo.logoUrl) setLogoPreview(tenantInfo.logoUrl);
  }, [tenantInfo]);

  /* ── guard ── */
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-600 dark:text-slate-300 animate-in fade-in duration-500 py-20">
        <AlertCircle size={48} className="mb-4 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Restricted Access</h2>
        <p>Only firm administrators can access these settings.</p>
      </div>
    );
  }

  /* ── actions ── */
  const handleInvite = async (e) => {
    e.preventDefault();
    setIsInviting(true);
    setLastGeneratedLink('');
    try {
      const { data } = await apiClient.post('/tenants/invitations', { email, role });
      const link = `${window.location.origin}/login?invitation=${data.token}`;
      setLastGeneratedLink(link);
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
    try {
      await apiClient.delete(`/tenants/invitations/${id}`);
      toast.success('Invitation revoked');
      fetchData();
    } catch {
      toast.error('Error during revocation');
    }
  };

  const handleUpdateMember = async (id, data) => {
    await apiClient.patch(`/tenants/members/${id}`, data);
    toast.success('Member updated');
    fetchData();
  };

  /* Soft-disable: toggles isActive instead of deleting */
  const handleToggleActive = async (member) => {
    try {
      await apiClient.patch(`/tenants/members/${member.id}`, {
        isActive: !member.isActive,
      });
      toast.success(
        member.isActive ? 'Member deactivated' : 'Member reactivated'
      );
      fetchData();
    } catch {
      toast.error('Error updating member status');
    } finally {
      setConfirmAction(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleSaveFirm = async (e) => {
    e.preventDefault();
    setIsSavingFirm(true);
    try {
      const { data } = await apiClient.patch('/tenants/me', firmForm);
      setTenantInfo(prev => ({ ...prev, ...data }));
      toast.success('Firm information updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving firm info');
    } finally {
      setIsSavingFirm(false);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Local preview
    setLogoPreview(URL.createObjectURL(file));
    // Upload
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const { data } = await apiClient.post('/tenants/me/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setTenantInfo(prev => ({ ...prev, logoUrl: data.logoUrl }));
      toast.success('Logo updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Logo upload failed');
      setLogoPreview(tenantInfo?.logoUrl ?? null);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const firmField = (key) => ({
    value: firmForm[key],
    onChange: (e) => setFirmForm(prev => ({ ...prev, [key]: e.target.value })),
  });

  /* ── computed stats ── */
  const activeCount = members.filter((m) => m.isActive !== false).length;
  const inactiveCount = members.length - activeCount;

  /* ════════════════════════════════════════════════════════════════ */
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

      {/* Modals */}
      {editingMember && (
        <EditMemberModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSave={handleUpdateMember}
        />
      )}
      {confirmAction && (
        <ConfirmModal
          title={confirmAction.type === 'deactivate'
            ? `Deactivate ${confirmAction.member.firstName}?`
            : `Reactivate ${confirmAction.member.firstName}?`}
          description={confirmAction.type === 'deactivate'
            ? 'This member will lose access to the platform. You can reactivate them at any time.'
            : 'This member will regain full access based on their role.'}
          confirmLabel={confirmAction.type === 'deactivate' ? 'Deactivate' : 'Reactivate'}
          variant={confirmAction.type === 'deactivate' ? 'danger' : 'default'}
          onConfirm={() => handleToggleActive(confirmAction.member)}
          onClose={() => setConfirmAction(null)}
        />
      )}
      <SendNotificationDialog isOpen={isNotifyOpen} onClose={() => setIsNotifyOpen(false)} />

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-stretch justify-between gap-6">
        <div className="flex-1">
          <p className="text-[11px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-1">
            Firm Management
          </p>
          <div className="flex items-center gap-3">
            {tenantInfo?.logoUrl && (
              <img
                src={tenantInfo.logoUrl}
                alt={`${tenantInfo.name} logo`}
                className="w-11 h-11 rounded-xl object-contain border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shrink-0"
              />
            )}
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {tenantInfo?.name || 'Your Firm'}
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Operational overview and team configuration.
          </p>

          {tenantInfo && (
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800/50 w-fit px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-amber-500" />
                {tenantInfo.city || 'N/A'}
              </span>
              <span className="opacity-20">|</span>
              <span className="flex items-center gap-1.5">
                <Globe size={14} className="text-amber-500" />
                {tenantInfo.country || 'N/A'}
              </span>
              <span className="opacity-20">|</span>
              <span
                className="text-slate-400 dark:text-slate-500 select-all cursor-copy"
                onClick={() => copyToClipboard(tenantInfo.id)}
                title="Click to copy full ID"
              >
                ID: {tenantInfo.id.split('-')[0]}…
              </span>
            </div>
          )}
        </div>

        {/* Stats card */}
        {tenantInfo && (
          <div className="flex items-center gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-900 shadow-xl shadow-amber-500/20 shrink-0">
              <Users size={28} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-2">
              <StatChip label="Total" value={tenantInfo._count?.users || 0} />
              <StatChip label="Active" value={activeCount} color="amber" />
              <StatChip label="Lawyers" value={tenantInfo.roleStats?.lawyers || 0} />
              <StatChip label="Support" value={(tenantInfo.roleStats?.assistants || 0) + (tenantInfo.roleStats?.secretaries || 0)} />
            </div>
          </div>
        )}
      </div>

      {/* ── Action bar ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Tabs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
          {[
            { id: 'team',       label: `Team (${members.length})`,          icon: Users    },
            { id: 'invitations',label: `Invitations (${invitations.length})`,icon: Clock    },
            { id: 'invite',     label: 'Invite',                            icon: UserPlus },
            { id: 'firm',       label: 'Firm Info',                         icon: Building2},
          ].map(({ id, label, icon: _Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <_Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Send notification */}
        <Button
          variant="secondary"
          onClick={() => setIsNotifyOpen(true)}
          className="bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-900/30 dark:text-amber-400 font-bold shadow-sm"
          icon={Bell}
        >
          Send Notification
        </Button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          Tab: Team
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'team' && (
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
              <Loader2 className="animate-spin text-amber-500" size={28} />
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
      )}

      {/* ══════════════════════════════════════════════════════════
          Tab: Invitations
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'invitations' && (
        <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Clock size={20} className="text-slate-500 dark:text-slate-400" />
            Pending Invitations
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="animate-spin text-amber-500" size={24} />
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
      )}

      {/* ══════════════════════════════════════════════════════════
          Tab: Invite
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'invite' && (
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
      )}

      {/* ══════════════════════════════════════════════════════════
          Tab: Firm Info
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'firm' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Logo card ── */}
          <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50 h-fit">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Camera size={18} className="text-amber-500" /> Firm Logo
            </h3>

            <div className="flex flex-col items-center gap-4">
              {/* Preview */}
              <div
                onClick={() => logoInputRef.current?.click()}
                className="relative w-32 h-32 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-amber-400 transition-colors group bg-slate-50 dark:bg-slate-800/50"
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Firm logo"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Building2 size={32} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">No logo</span>
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                  {isUploadingLogo
                    ? <Loader2 size={24} className="text-white animate-spin" />
                    : <Camera size={24} className="text-white" />
                  }
                </div>
              </div>

              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={handleLogoChange}
              />

              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={isUploadingLogo}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-50"
              >
                {isUploadingLogo ? 'Uploading…' : 'Click to change logo'}
              </button>
              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                PNG, JPEG, SVG or WebP<br />Max 2 MB — displayed in emails & documents
              </p>
            </div>
          </Card>

          {/* ── Edit form ── */}
          <form
            onSubmit={handleSaveFirm}
            className="lg:col-span-2 space-y-6"
          >
            <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Building2 size={18} className="text-amber-500" /> General Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Firm name */}
                <FirmField
                  label="Firm Name"
                  icon={Building2}
                  placeholder="Cabinet Dupont & Associés"
                  required
                  {...firmField('name')}
                />
                {/* Website */}
                <FirmField
                  label="Website"
                  icon={Link2}
                  placeholder="https://cabinet-dupont.fr"
                  type="url"
                  {...firmField('website')}
                />
                {/* City */}
                <FirmField
                  label="City"
                  icon={MapPin}
                  placeholder="Paris"
                  {...firmField('city')}
                />
                {/* Country */}
                <FirmField
                  label="Country"
                  icon={Globe}
                  placeholder="France"
                  {...firmField('country')}
                />
                {/* Address — full width */}
                <div className="sm:col-span-2">
                  <FirmField
                    label="Full Address"
                    icon={MapPin}
                    placeholder="12 rue de la Paix, 75001 Paris"
                    {...firmField('address')}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Phone size={18} className="text-amber-500" /> Contacts & Legal Identifiers
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Phone */}
                <FirmField
                  label="Phone"
                  icon={Phone}
                  placeholder="+33 1 23 45 67 89"
                  type="tel"
                  {...firmField('phone')}
                />
                {/* Fax */}
                <FirmField
                  label="Fax"
                  icon={Phone}
                  placeholder="+33 1 23 45 67 90"
                  type="tel"
                  {...firmField('fax')}
                />
                {/* SIRET */}
                <FirmField
                  label="SIRET"
                  icon={Hash}
                  placeholder="123 456 789 00012"
                  {...firmField('siret')}
                />
                {/* N° Barreau */}
                <FirmField
                  label="Bar Number (N° Barreau)"
                  icon={Shield}
                  placeholder="75001"
                  {...firmField('barNumber')}
                />
              </div>
            </Card>

            {/* Save button */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (tenantInfo) setFirmForm({
                    name: tenantInfo.name ?? '', city: tenantInfo.city ?? '',
                    country: tenantInfo.country ?? '', address: tenantInfo.address ?? '',
                    phone: tenantInfo.phone ?? '', fax: tenantInfo.fax ?? '',
                    website: tenantInfo.website ?? '', siret: tenantInfo.siret ?? '',
                    barNumber: tenantInfo.barNumber ?? '',
                  });
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <RefreshCw size={15} /> Reset
              </button>
              <button
                type="submit"
                disabled={isSavingFirm}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-amber-700 shadow-lg disabled:opacity-50 transition-all"
              >
                {isSavingFirm
                  ? <Loader2 size={16} className="animate-spin" />
                  : <Save size={16} />
                }
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

/* ─── Reusable field component ───────────────────────────────────── */
const FirmField = ({ label, icon: Icon, placeholder, type = 'text', required, value, onChange }) => (
  <div>
    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />}
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all dark:text-white placeholder:text-slate-400"
      />
    </div>
  </div>
);

export default CompanySettingsView;
