import React from 'react';
import { 
  Mail, Phone, MapPin, Award, TrendingUp, Sparkles, Settings, ToggleRight, ToggleLeft 
} from 'lucide-react';
import { Card, Badge } from './UI';

const ProfileView = ({ currentUser }) => (
  <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
     <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
     
     <Card className="p-8 dark:bg-slate-900 dark:border-slate-800 shadow-lg">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
           <div className="w-28 h-28 rounded-full bg-slate-900 dark:bg-amber-600 text-white flex items-center justify-center text-4xl font-bold border-4 border-amber-100 dark:border-amber-900/30 shadow-xl ring-4 ring-slate-50 dark:ring-slate-950">
              {currentUser?.name?.charAt(0) || "U"}
           </div>
           <div className="flex-1 text-center md:text-left pt-2">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                 <h2 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">{currentUser?.name}</h2>
                 <Badge variant="navy">{currentUser?.role}</Badge>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-wide uppercase">{currentUser?.specialization || "Senior Partner"}</p>
              
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                 <div className="flex items-center justify-center md:justify-start gap-3 text-slate-600 dark:text-slate-300 group cursor-default">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 transition-colors">
                      <Mail size={16} className="text-amber-600 dark:text-amber-500"/>
                    </div>
                    {currentUser?.email}
                 </div>
                 <div className="flex items-center justify-center md:justify-start gap-3 text-slate-600 dark:text-slate-300 group cursor-default">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 transition-colors">
                      <Phone size={16} className="text-amber-600 dark:text-amber-500"/>
                    </div>
                    {currentUser?.phone || "+1 (555) 000-0000"}
                 </div>
                 <div className="flex items-center justify-center md:justify-start gap-3 text-slate-600 dark:text-slate-300 group cursor-default">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 transition-colors">
                      <MapPin size={16} className="text-amber-600 dark:text-amber-500"/>
                    </div>
                    {currentUser?.location || "Manhattan Office"}
                 </div>
                 <div className="flex items-center justify-center md:justify-start gap-3 text-slate-600 dark:text-slate-300 group cursor-default">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 transition-colors">
                      <Award size={16} className="text-amber-600 dark:text-amber-500"/>
                    </div>
                    BAR ID: #{currentUser?.id ? `NY-${currentUser.id*123}` : "NY-88219"}
                 </div>
              </div>
           </div>
           <button className="px-6 py-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-lg">
              Edit Profile
           </button>
        </div>
     </Card>

     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
           <Card className="p-6 dark:bg-slate-900 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 tracking-tight">
                 <TrendingUp size={20} className="text-emerald-500"/> Performance Metrics
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 transition-all hover:shadow-md">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest">Billable Hours</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">1,240 <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded ml-1">+5%</span></div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-4 overflow-hidden">
                       <div className="bg-slate-900 dark:bg-amber-500 h-full w-[75%] shadow-[0_0_8px_rgba(245,158,11,0.3)]"></div>
                    </div>
                 </div>
                 <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 transition-all hover:shadow-md">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest">Cases Closed</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">32 <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded ml-1">+2</span></div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-4 overflow-hidden">
                       <div className="bg-emerald-500 h-full w-[60%]"></div>
                    </div>
                 </div>
                 <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 transition-all hover:shadow-md">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest">Client Rating</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">4.9<span className="text-sm font-medium text-slate-400 ml-1">/5</span></div>
                    <div className="flex gap-0.5 mt-3 text-amber-500">
                       {[1,2,3,4,5].map(i => <Sparkles key={i} size={10} fill="currentColor" />)}
                    </div>
                 </div>
              </div>
           </Card>

           <Card className="p-6 dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
              <h3 className="font-bold text-slate-900 dark:text-white mb-5 tracking-tight">Firm Access Information</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 border-b dark:border-slate-800">
                       <tr>
                          <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Role</th>
                          <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Cabinet ID</th>
                          <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Access</th>
                          <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Last Login</th>
                       </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y dark:divide-slate-800">
                       <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{currentUser?.role}</td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">{currentUser?.cabinetId || "CAB-992-X"}</td>
                          <td className="px-6 py-4"><Badge variant="navy">Full Access</Badge></td>
                          <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-500">Today, 09:14 AM</td>
                       </tr>
                    </tbody>
                 </table>
              </div>
           </Card>
        </div>

        <div className="space-y-6">
           <Card className="p-6 dark:bg-slate-900 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 tracking-tight">
                 <Settings size={20} className="text-slate-400 dark:text-slate-500"/> Security & Preference
              </h3>
              <div className="space-y-5">
                 <div className="flex items-center justify-between group">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Email Notifications</span>
                    <ToggleRight size={28} className="text-emerald-500 cursor-pointer hover:scale-110 transition-all"/>
                 </div>
                 <div className="flex items-center justify-between group">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Daily Briefing</span>
                    <ToggleRight size={28} className="text-emerald-500 cursor-pointer hover:scale-110 transition-all"/>
                 </div>
                 <div className="flex items-center justify-between group">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Two-Factor Auth</span>
                    <ToggleLeft size={28} className="text-slate-300 dark:text-slate-700 cursor-pointer hover:scale-110 transition-all"/>
                 </div>
                 <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <button className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm">
                       Change Password
                    </button>
                    <button className="w-full py-2.5 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-all">
                       Sign out everywhere
                    </button>
                 </div>
              </div>
           </Card>
        </div>
     </div>
  </div>
);

export default ProfileView;
