import React, { useState } from 'react';
import { X, Check, ChevronDown, Building2, User, FileText, DollarSign, Calendar as CalendarIcon } from 'lucide-react';

const NewCaseDialog = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    type: 'Civil Litigation',
    amount: '',
    deadline: '',
    description: ''
  });

  // Task 2: Global Navigation & Close Triggers
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      id: Date.now(),
      status: 'Active',
      members: ['SJ'], // Default to current user's initials
      amount: formData.amount.startsWith('$') ? formData.amount : `$${formData.amount}`
    });
    onClose();
    setFormData({ name: '', client: '', type: 'Civil Litigation', amount: '', deadline: '', description: '' });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Open New Matter</h2>
              <p className="text-xs text-slate-500 font-medium">Create a new case file in the firm repository.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Case Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Case Reference / Title</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  name="name" required value={formData.name} onChange={handleChange}
                  placeholder="e.g. Sterling v. Global Logistics Corp"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Client Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Client Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  name="client" required value={formData.client} onChange={handleChange}
                  placeholder="e.g. Howard Sterling"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Matter Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Matter Type</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                  name="type" value={formData.type} onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none appearance-none bg-white"
                >
                  <option value="Civil Litigation">Civil Litigation</option>
                  <option value="Criminal Defense">Criminal Defense</option>
                  <option value="Corporate">Corporate</option>
                  <option value="IP Litigation">IP Litigation</option>
                  <option value="Probate">Probate</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Employment">Employment Law</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>

            {/* Estimated Value */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Estimated Matter Value</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  name="amount" required value={formData.amount} onChange={handleChange}
                  placeholder="e.g. 250,000"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Initial Deadline</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  name="deadline" type="date" required value={formData.deadline} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Case Description (Optional)</label>
              <textarea 
                name="description" value={formData.description} onChange={handleChange}
                placeholder="Briefly describe the matter scope and objectives..."
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none resize-none"
              ></textarea>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button 
              type="button" onClick={onClose}
              className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all flex items-center gap-2"
            >
              <Check size={18} /> Open Matter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewCaseDialog;
