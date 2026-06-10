import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Mail, Phone, Shield, ShieldCheck, Lock, User, 
  ExternalLink, Check, AlertCircle, Loader2 
} from 'lucide-react';
import { Card, Badge, Button, Input } from './ui';
import useLexStore from '../store/useLexStore';
import { useUpdateProfile } from '../hooks/useProfile';

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional().or(z.literal(''))
});

const ProfileView = () => {
  const { currentUser, fetchMe } = useLexStore();
  const updateProfile = useUpdateProfile();
  
  const [isEditing, setIsEditing] = useState(false);

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    reset 
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      phone: currentUser?.phone || ''
    }
  });

  const startEditing = () => {
    reset({
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      phone: currentUser?.phone || ''
    });
    setIsEditing(true);
  };

  const onSubmit = async (data) => {
    updateProfile.mutate(data, {
      onSuccess: () => {
        setIsEditing(false);
        fetchMe();
        toast.success("Profile updated successfully");
      }
    });
  };

  const fullName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'No Name Set';
  const roleDisplay = currentUser?.role?.replace('_', ' ') || 'Lawyer';
  const isAdmin = currentUser?.role === 'CABINET_ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  if (isEditing) {
    return (
      <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="flex items-center justify-between">
           <h1 className="text-2xl font-black text-slate-900 dark:text-white">Edit Profile</h1>
           <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="p-8 space-y-6 border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="grid grid-cols-2 gap-4">
              <Input 
                {...register("firstName")}
                label="First Name" 
                placeholder="First Name"
                error={errors.firstName?.message}
              />
              <Input 
                {...register("lastName")}
                label="Last Name" 
                placeholder="Last Name"
                error={errors.lastName?.message}
              />
            </div>
            
            <Input 
              {...register("phone")}
              label="Phone Number" 
              placeholder="+1 (555) 000-0000"
              icon={Phone}
              error={errors.phone?.message}
            />

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit"
                className="flex-1"
                isLoading={updateProfile.isPending}
              >
                Save Changes
              </Button>
            </div>
          </Card>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-20">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">My Profile</h1>
            <p className="text-slate-600 dark:text-slate-300 dark:text-slate-400 font-medium">Manage your personal identity and security settings.</p>
          </div>
          <button 
            onClick={startEditing} 
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-amber-700 transition-all shadow-lg active:scale-95"
          >
            Edit Profile
          </button>
       </div>
       
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Identity Card */}
          <Card className="lg:col-span-2 p-8 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
             <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="relative group">
                   <div className="w-32 h-32 shrink-0 rounded-3xl bg-slate-900 dark:bg-amber-600 text-white flex items-center justify-center text-4xl font-black border-4 border-amber-50 dark:border-amber-900/30 shadow-2xl transition-transform group-hover:rotate-3">
                      {fullName.charAt(0).toUpperCase()}
                   </div>
                   {isAdmin && (
                      <div className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-xl shadow-lg border-2 border-white dark:border-slate-900">
                         <ShieldCheck size={16} />
                      </div>
                   )}
                </div>

                <div className="flex-1 text-center md:text-left pt-2">
                   <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{fullName}</h2>
                      <Badge variant={isAdmin ? "info" : "neutral"}>{roleDisplay}</Badge>
                   </div>
                   
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center justify-center md:justify-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300">
                         <Mail size={16} className="text-amber-600 shrink-0"/>
                         <span className="font-medium truncate">{currentUser?.email || 'No email set'}</span>
                      </div>
                       <div className="flex items-center justify-center md:justify-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300">
                          <Phone size={16} className="text-amber-600 shrink-0"/>
                          <span className="font-medium">{currentUser?.phone || 'No phone set'}</span>
                       </div>
                   </div>
                </div>
             </div>
          </Card>

          {/* Security Summary Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Lock size={16} className="text-amber-600" /> Account Security
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-500">MFA Active</span>
                  </div>
                  <Badge variant="success">Secured</Badge>
                </div>

                <button className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl transition-colors group">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-slate-500 dark:text-slate-300" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Change Password</span>
                  </div>
                  <ExternalLink size={12} className="text-slate-500 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
              
              <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-4 leading-relaxed">
                Last password change: <span className="font-bold">Mar 12, 2026</span>. We recommend updating your credentials every 90 days.
              </p>
            </Card>
          </div>
       </div>
    </div>
  );
};

export default ProfileView;


