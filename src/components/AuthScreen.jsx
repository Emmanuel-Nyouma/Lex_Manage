import React, { useState } from 'react';
import { 
  Gavel, 
  AlertCircle, 
  Mail, 
  Lock, 
  Loader2, 
  LogIn, 
  Building2, 
  ShieldCheck, 
  ArrowRight 
} from 'lucide-react';

const authService = {
  login: async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      if (!response.ok) throw data.message || "Login failed";
      
      return data.user;
    } catch (error) {
      throw error;
    }
  },
  signupCabinet: async (firmName, email, password) => {
    try {
      const response = await fetch('/api/auth/signup/cabinet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firmName, email, password })
      });
      
      const data = await response.json();
      if (!response.ok) throw data.message || "Signup failed";
      
      return data;
    } catch (error) {
      throw error;
    }
  },
  signupInvite: async (email, inviteCode, password) => {
    try {
      const response = await fetch('/api/auth/signup/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: inviteCode, password })
      });
      
      const data = await response.json();
      if (!response.ok) throw data.message || "Invitation failed";
      
      return data;
    } catch (error) {
      throw error;
    }
  }
};

const AuthScreen = ({ onLoginSuccess }) => {
  const [view, setView] = useState('login'); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firmName: '',
    inviteCode: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await authService.login(formData.email, formData.password);
      onLoginSuccess(user);
    } catch (err) {
      setError(typeof err === 'string' ? err : "Connection failed. Is the server running?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    try {
      let result;
      if (view === 'signup') {
        if(!formData.firmName) throw "Firm name is required.";
        result = await authService.signupCabinet(formData.firmName, formData.email, formData.password);
      } else {
        if(!formData.inviteCode) throw "Invitation code is required.";
        result = await authService.signupInvite(formData.email, formData.inviteCode, formData.password);
      }
      onLoginSuccess(result.user);
    } catch (err) {
      setError(typeof err === 'string' ? err : "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative flex-col justify-between p-12 text-white">
        <div className="z-10">
          <div className="flex items-center gap-3 text-amber-500 mb-6">
            <Gavel size={32} />
            <span className="text-2xl font-bold tracking-wide text-white">LEX<span className="text-slate-400 font-light">MANAGE</span></span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            The management platform<br/>for the legal elite.
          </h1>
          <p className="text-slate-400 text-lg max-w-md">
            Manage your cases, collaborate with your team, and leverage AI to maximize efficiency.
          </p>
        </div>
        
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="z-10 text-sm text-slate-500">
          © 2024 LexManage Systems. Security and privacy guaranteed.
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
          
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900">
              {view === 'login' ? 'Login' : view === 'signup' ? 'Create Firm' : 'Join a Team'}
            </h2>
            <p className="mt-2 text-slate-500">
              {view === 'login' ? 'Access your secure workspace.' : 'Start your 14-day free trial.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2 border border-red-100">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {view === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    name="email" type="email" required
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                    placeholder="lawyer@firm.com"
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">Password</label>
                  <button type="button" className="text-xs text-amber-600 hover:underline">Forgot?</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    name="password" type="password" required
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                    placeholder="••••••••"
                    onChange={handleChange}
                  />
                </div>
              </div>
              <button 
                type="submit" disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
                Sign In
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-5">
              <div className="flex p-1 bg-slate-100 rounded-lg mb-6">
                <button 
                  type="button"
                  onClick={() => setView('signup')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${view === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  New Firm
                </button>
                <button 
                  type="button"
                  onClick={() => setView('invite')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${view === 'invite' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  I have an invite
                </button>
              </div>

              {view === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Firm Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      name="firmName" type="text" required
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                      placeholder="Ex: Smith & Partners"
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              {view === 'invite' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Invitation Code</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      name="inviteCode" type="text" required
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-mono uppercase"
                      placeholder="INV-XXXX-XXXX"
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  name="email" type="email" required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  placeholder="pro@example.com"
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input 
                    name="password" type="password" required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm</label>
                  <input 
                    name="confirmPassword" type="password" required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button 
                type="submit" disabled={isLoading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                {view === 'signup' ? 'Create Admin Account' : 'Join Firm'}
              </button>
            </form>
          )}

          <div className="text-center pt-4 border-t border-slate-100">
            {view === 'login' ? (
              <p className="text-sm text-slate-600">
                No account yet?{' '}
                <button onClick={() => setView('signup')} className="font-semibold text-amber-600 hover:text-amber-700 hover:underline">
                  Create a firm
                </button>
              </p>
            ) : (
              <p className="text-sm text-slate-600">
                Already have an account?{' '}
                <button onClick={() => setView('login')} className="font-semibold text-amber-600 hover:text-amber-700 hover:underline">
                  Sign In
                </button>
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
