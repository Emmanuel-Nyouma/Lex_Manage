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
import { Card, Badge, Button, Input, PageSkeleton } from './ui';
import SendNotificationDialog from './SendNotificationDialog';
import TeamTab from './company-settings/TeamTab';
import InvitationsTab from './company-settings/InvitationsTab';
import InviteTab from './company-settings/InviteTab';
import FirmTab from './company-settings/FirmTab';

/* ─── Role badge colors ──────────────────────────────────────────── */
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
      <div role="dialog" aria-modal="true" aria-labelledby="edit-member-title" className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 id="edit-member-title" className="font-bold text-slate-900 dark:text-white">
            Edit Member: {member.firstName} {member.lastName}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close member editor"
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="member-role" className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
              Member Role
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <select
                id="member-role"
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
    <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-action-title" aria-describedby="confirm-action-description" className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300 p-6 space-y-4">
      <h3 id="confirm-action-title" className="font-bold text-slate-900 dark:text-white">{title}</h3>
      <p id="confirm-action-description" className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
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

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Unable to copy to clipboard');
    }
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
              <button
                type="button"
                className="text-slate-400 dark:text-slate-500 select-all cursor-copy"
                onClick={() => copyToClipboard(tenantInfo.id)}
                title="Click to copy full ID"
                aria-label="Copy firm ID"
              >
                ID: {tenantInfo.id.split('-')[0]}…
              </button>
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
              type="button"
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


      {activeTab === 'team' && (
        <TeamTab
          inactiveCount={inactiveCount}
          showInactive={showInactive}
          setShowInactive={setShowInactive}
          activeCount={activeCount}
          isLoading={isLoading}
          members={members}
          currentUser={currentUser}
          setEditingMember={setEditingMember}
          setConfirmAction={setConfirmAction}
        />
      )}

      {activeTab === 'invitations' && (
        <InvitationsTab
          isLoading={isLoading}
          invitations={invitations}
          copyToClipboard={copyToClipboard}
          revokeInvitation={revokeInvitation}
        />
      )}

      {activeTab === 'invite' && (
        <InviteTab
          email={email}
          setEmail={setEmail}
          role={role}
          setRole={setRole}
          isInviting={isInviting}
          handleInvite={handleInvite}
          lastGeneratedLink={lastGeneratedLink}
          copyToClipboard={copyToClipboard}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'firm' && (
        <FirmTab
          logoInputRef={logoInputRef}
          logoPreview={logoPreview}
          isUploadingLogo={isUploadingLogo}
          handleLogoChange={handleLogoChange}
          handleSaveFirm={handleSaveFirm}
          firmField={firmField}
          tenantInfo={tenantInfo}
          setFirmForm={setFirmForm}
          isSavingFirm={isSavingFirm}
        />
      )}


    </div>
  );
};

export default CompanySettingsView;
