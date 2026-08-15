import React, { useId } from 'react';
import { Camera, Building2, Loader2, MapPin, Globe, Link2, Phone, Hash, Shield, RefreshCw, Save } from 'lucide-react';
import { Card } from '../ui';

const FirmTab = ({
  logoInputRef,
  logoPreview,
  isUploadingLogo,
  handleLogoChange,
  handleSaveFirm,
  firmField,
  tenantInfo,
  setFirmForm,
  isSavingFirm,
}) => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Logo card ── */}
          <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50 h-fit">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Camera size={18} className="text-amber-500" /> Firm Logo
            </h3>

            <div className="flex flex-col items-center gap-4">
              {/* Preview */}
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                aria-label="Choose firm logo"
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
              </button>

              <input
                ref={logoInputRef}
                type="file"
                aria-label="Firm logo file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={handleLogoChange}
              />

              <button
                type="button"
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
);

/* ─── Reusable field component ───────────────────────────────────── */
const FirmField = ({ label, icon: Icon, placeholder, type = 'text', required, value, onChange }) => {
  const inputId = useId();
  return (
    <div>
      <label htmlFor={inputId} className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />}
        <input
          id={inputId}
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
};


export default FirmTab;
