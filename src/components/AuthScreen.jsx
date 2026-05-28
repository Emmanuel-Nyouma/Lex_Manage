import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { 
  Gavel, 
  Mail, 
  Lock, 
  LogIn, 
  ShieldCheck, 
  ArrowRight,
  User,
  Phone,
  Calendar,
  Briefcase,
  ChevronLeft,
  UserPlus,
  Key,
  Check
} from 'lucide-react';
import apiClient from '../lib/api';
import useLexStore from '../store/useLexStore';
import { Button, Input, Badge } from './UI';

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});

const mfaSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits")
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

const signupSchema = z.object({
  firmName: z.string().min(2, "Firm name is required").optional().or(z.literal('')),
  country: z.string().min(2, "Country is required").optional().or(z.literal('')),
  city: z.string().min(2, "City is required").optional().or(z.literal('')),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phone: z.string().min(8, "Phone number is required"),
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const AuthScreen = () => {
  const [view, setView] = useState('login'); // 'login', 'signup', 'forgot_password', 'mfa_challenge'
  const [signupStep, setSignupStep] = useState(1);
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('invitation');

  const { register, handleSubmit, watch, trigger, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(
      view === 'login' ? loginSchema : 
      view === 'signup' ? signupSchema : 
      view === 'mfa_challenge' ? mfaSchema :
      forgotPasswordSchema
    ),
    mode: "onChange"
  });

  useEffect(() => { if (invitationToken) { setView('signup'); setSignupStep(2); } }, [invitationToken]);

  const nextStep = async () => {
    // Manually trigger only step 1 fields
    const isValidFirm = (watch('firmName') || '').length >= 2;
    const isValidCountry = (watch('country') || '').length >= 2;
    const isValidCity = (watch('city') || '').length >= 2;
    
    if (isValidFirm && isValidCountry && isValidCity) {
      setSignupStep(2);
    } else {
      toast.error("Please fill in all firm details.");
    }
  };

  const onSubmit = async (values) => {
    try {
      if (view === 'login') {
        await useLexStore.getState().login(values.email, values.password);
      } else if (view === 'signup') {
        const registerData = {
          email: values.email,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
          tenantName: values.firmName,
          country: values.country,
          city: values.city,
          invitationToken: invitationToken || undefined
        };
        
        await apiClient.post('/api/v1/auth/register', registerData);
        toast.success("Firm created successfully! Please log in.");
        setView('login');
      } else if (view === 'forgot_password') {
        toast.info("Feature coming soon.");
      }
    } catch (err) {
      console.error("Auth Error:", err);
      toast.error(err.response?.data?.message || "An error occurred");
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative flex-col justify-between p-12 text-white border-r border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,0.1),transparent)] pointer-events-none"></div>
        <div>
          <div className="flex items-center gap-3 text-amber-500 mb-10">
            <Gavel size={40} className="drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
            <span className="text-3xl font-bold tracking-tight text-white">LEX<span className="text-slate-500 font-light">MANAGE</span></span>
          </div>
          <div className="space-y-6">
            <h1 className="text-5xl font-extrabold leading-[1.1] mb-4">
              The reference platform <br />
              <span className="text-amber-500">for excellence in law firms.</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-md leading-relaxed">
              Manage your cases, automate your billing, and collaborate securely.
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="font-bold text-sm">Multi-Tenant Isolation</p>
              <p className="text-xs text-slate-500">Data strictly partitioned by firm.</p>
            </div>
          </div>
          <div className="z-10 text-xs text-slate-500 font-medium tracking-widest uppercase">© 2026 LexManage Systems • SaaS Edition</div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white dark:bg-slate-950 overflow-y-auto">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 py-8">
          
          <div className="text-center lg:text-left">
            {(view === 'forgot_password' || view === 'mfa_challenge' || (view === 'signup' && signupStep === 2)) && (
              <button 
                onClick={() => {
                  if (view === 'signup' && signupStep === 2) setSignupStep(1);
                  else setView('login');
                }} 
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-amber-600 mb-6 transition-all group"
              >
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back
              </button>
            )}
            
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {view === 'login' ? 'Welcome' : 
               view === 'signup' ? (invitationToken ? 'Join the firm' : 'Create your firm') : 
               'Recovery'}
            </h2>
            <p className="mt-3 text-slate-500 font-medium">
              {view === 'login' ? 'Log in to your secure workspace.' : 
               view === 'signup' ? (signupStep === 1 ? 'Step 1: Firm Information' : 'Step 2: Main Administrator') : 
               'A reset link will be sent to you.'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {view === 'login' && (
              <>
                <Input {...register("email")} label="Work Email" type="email" icon={Mail} error={errors.email?.message} />
                <div className="space-y-2">
                  <Input {...register("password")} label="Password" type="password" icon={Lock} error={errors.password?.message} />
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setView('forgot_password')} className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors">Forgot password?</button>
                  </div>
                </div>
              </>
            )}

            {view === 'signup' && !invitationToken && signupStep === 1 && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <Input {...register("firmName")} label="Firm Name" icon={Briefcase} placeholder="ex: Kamdem & Associates" error={errors.firmName?.message} />
                <div className="grid grid-cols-2 gap-4">
                  <Input {...register("country")} label="Country" placeholder="Cameroon" error={errors.country?.message} />
                  <Input {...register("city")} label="City" placeholder="Douala" error={errors.city?.message} />
                </div>
                <Button type="button" onClick={nextStep} className="w-full h-14 text-lg font-bold" icon={ArrowRight}>
                  Next
                </Button>
              </div>
            )}

            {view === 'signup' && (invitationToken || signupStep === 2) && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <Input {...register("firstName")} label="First Name" icon={User} error={errors.firstName?.message} />
                  <Input {...register("lastName")} label="Last Name" error={errors.lastName?.message} />
                </div>
                <Input {...register("email")} label="Work Email" type="email" icon={Mail} error={errors.email?.message} />
                <Input {...register("phone")} label="Phone" type="tel" icon={Phone} placeholder="+237 ..." error={errors.phone?.message} />
                <div className="grid grid-cols-2 gap-4">
                  <Input {...register("password")} label="Password" type="password" icon={Lock} error={errors.password?.message} />
                  <Input {...register("confirmPassword")} label="Confirm Password" type="password" icon={ShieldCheck} error={errors.confirmPassword?.message} />
                </div>
                <Button type="submit" isLoading={isSubmitting} className="w-full h-14 text-lg font-bold" icon={Check}>
                  {invitationToken ? 'Join now' : 'Create firm'}
                </Button>
              </div>
            )}

            {view === 'forgot_password' && (
              <div className="space-y-5">
                <Input {...register("email")} label="Recovery Email" type="email" icon={Mail} error={errors.email?.message} />
                <Button type="submit" isLoading={isSubmitting} className="w-full h-14 font-bold">
                  Send link
                </Button>
              </div>
            )}

            {view === 'login' && (
              <Button type="submit" isLoading={isSubmitting} className="w-full h-14 text-lg font-bold shadow-[0_10px_20px_rgba(15,23,42,0.1)]" icon={ArrowRight}>
                Login
              </Button>
            )}
          </form>

          {view === 'login' && !invitationToken && (
            <div className="text-center pt-8 border-t border-slate-100 dark:border-slate-800">
              <p className="text-slate-500 text-sm mb-4">Don't have an account yet?</p>
              <button 
                onClick={() => { setView('signup'); setSignupStep(1); }} 
                className="w-full py-3 px-6 rounded-xl border-2 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
              >
                <UserPlus size={18} className="text-amber-500" />
                Create a new firm
              </button>
            </div>
          )}

          {view === 'signup' && (
            <div className="text-center pt-6">
              <button onClick={() => setView('login')} className="text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                Already registered? Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
