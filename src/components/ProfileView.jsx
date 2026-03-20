import React from 'react';
import { 
  Mail, Phone, MapPin, Award, TrendingUp, Sparkles, Settings, ToggleRight, ToggleLeft 
} from 'lucide-react';
import { Card, Badge } from './UI';

const ProfileView = ({ currentUser }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
     <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
     
     <Card className="p-6 bg-white border border-slate-200">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
           <div className="w-24 h-24 rounded-full bg-slate-900 text-white flex items-center justify-center text-3xl font-bold border-4 border-amber-100 shadow-md">
              {currentUser?.name?.charAt(0) || "U"}
           </div>
           <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                 <h2 className="text-2xl font-bold text-slate-900">{currentUser?.name}</h2>
                 <Badge variant="navy">{currentUser?.role}</Badge>
              </div>
              <p className="text-slate-500 font-medium">{currentUser?.specialization || "General Practice"}</p>
              
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                 <div className="flex items-center justify-center md:justify-start gap-2 text-slate-700">
                    <Mail size={16} className="text-amber-600"/> {currentUser?.email}
                 </div>
                 <div className="flex items-center justify-center md:justify-start gap-2 text-slate-700">
                    <Phone size={16} className="text-amber-600"/> {currentUser?.phone || "+1 (555) 000-0000"}
                 </div>
                 <div className="flex items-center justify-center md:justify-start gap-2 text-slate-700">
                    <MapPin size={16} className="text-amber-600"/> {currentUser?.location || "Main Office"}
                 </div>
                 <div className="flex items-center justify-center md:justify-start gap-2 text-slate-700">
                    <Award size={16} className="text-amber-600"/> BAR ID: #{currentUser?.id ? `NY-${currentUser.id*123}` : "Pending"}
                 </div>
              </div>
           </div>
           <button className="px-4 py-2 border border-slate-300 rounded-md text-sm hover:bg-slate-50 font-medium transition-colors">
              Edit Profile
           </button>
        </div>
     </Card>

     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
           <Card className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                 <TrendingUp size={18} className="text-emerald-600"/> Performance Metrics
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Billable Hours</div>
                    <div className="text-2xl font-bold text-slate-900 mt-1">1,240 <span className="text-xs font-normal text-emerald-600">+5%</span></div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                       <div className="bg-slate-900 h-full w-[75%]"></div>
                    </div>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Cases Closed</div>
                    <div className="text-2xl font-bold text-slate-900 mt-1">32 <span className="text-xs font-normal text-emerald-600">+2</span></div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                       <div className="bg-emerald-500 h-full w-[60%]"></div>
                    </div>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Client Rating</div>
                    <div className="text-2xl font-bold text-slate-900 mt-1">4.9/5</div>
                    <div className="flex gap-0.5 mt-2 text-amber-500">
                       {[1,2,3,4,5].map(i => <Sparkles key={i} size={10} fill="currentColor" />)}
                    </div>
                 </div>
              </div>
           </Card>

           <Card className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Firm Access Information</h3>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500">
                       <tr>
                          <th className="px-4 py-2 font-medium">Role</th>
                          <th className="px-4 py-2 font-medium">Cabinet ID</th>
                          <th className="px-4 py-2 font-medium">Access Level</th>
                          <th className="px-4 py-2 font-medium">Last Login</th>
                       </tr>
                    </thead>
                    <tbody className="bg-white">
                       <tr>
                          <td className="px-4 py-3 font-semibold text-slate-900">{currentUser?.role}</td>
                          <td className="px-4 py-3 font-mono text-slate-600">{currentUser?.cabinetId}</td>
                          <td className="px-4 py-3"><Badge variant="navy">Full Access</Badge></td>
                          <td className="px-4 py-3 text-slate-500">Today, 09:14 AM</td>
                       </tr>
                    </tbody>
                 </table>
              </div>
           </Card>
        </div>

        <div className="space-y-6">
           <Card className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                 <Settings size={18} className="text-slate-400"/> Settings
              </h3>
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">Email Notifications</span>
                    <ToggleRight size={24} className="text-emerald-500 cursor-pointer"/>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">Daily Briefing</span>
                    <ToggleRight size={24} className="text-emerald-500 cursor-pointer"/>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">Two-Factor Auth</span>
                    <ToggleLeft size={24} className="text-slate-300 cursor-pointer"/>
                 </div>
                 <div className="pt-4 mt-4 border-t border-slate-100">
                    <button className="w-full py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded hover:bg-slate-200 transition-colors mb-2">
                       Change Password
                    </button>
                    <button className="w-full py-2 border border-red-200 text-red-600 text-sm font-medium rounded hover:bg-red-50 transition-colors">
                       Sign out of all devices
                    </button>
                 </div>
              </div>
           </Card>
        </div>
     </div>
  </div>
);

export default ProfileView;
