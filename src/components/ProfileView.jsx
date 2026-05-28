import React, { useState } from 'react';
import { 
  Mail, Phone, MapPin, Award, TrendingUp, Sparkles, Settings, ToggleRight, ToggleLeft, X, Check, Loader2 
} from 'lucide-react';
import { Card, Badge, Button, Input } from './UI';
import useLexStore from '../store/useLexStore';
import { useUpdateProfile } from '../hooks/useProfile';

const ProfileView = () => {
  const { currentUser, fetchMe } = useLexStore();
  const updateProfile = useUpdateProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    phone: currentUser?.phone || ''
  });

  const handleSave = async () => {
    updateProfile.mutate(formData, {
      onSuccess: () => {
        setIsEditing(false);
        fetchMe();
      }
    });
  };

  const fullName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || '--';
  const role = currentUser?.role || 'Lawyer';

  if (isEditing) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Profile</h1>
        <Card className="p-6 space-y-4">
          <Input label="First Name" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
          <Input label="Last Name" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
          <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} isLoading={updateProfile.isPending}>Save Changes</Button>
            <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
       <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
       
       <Card className="p-8 shadow-lg">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
             <div className="w-28 h-28 shrink-0 rounded-full bg-slate-900 dark:bg-amber-600 text-white flex items-center justify-center text-4xl font-bold border-4 border-amber-100 dark:border-amber-900/30 shadow-xl">
                {fullName.charAt(0).toUpperCase()}
             </div>
             <div className="flex-1 text-center md:text-left pt-2">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                   <h2 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">{fullName}</h2>
                   <Badge variant="info">{role}</Badge>
                </div>
                
                 <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                   <div className="flex items-center justify-center md:justify-start gap-3 text-slate-600 dark:text-slate-300">
                      <Mail size={16} className="text-amber-600"/>
                      <span>{currentUser?.email || '--'}</span>
                   </div>
                    <div className="flex items-center justify-center md:justify-start gap-3 text-slate-600 dark:text-slate-300">
                       <Phone size={16} className="text-amber-600"/>
                       <span>{currentUser?.phone || '--'}</span>
                    </div>
                </div>
             </div>
             <button onClick={() => setIsEditing(true)} className="px-6 py-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg">
                Edit Profile
             </button>
          </div>
       </Card>
    </div>
  );
};

export default ProfileView;
