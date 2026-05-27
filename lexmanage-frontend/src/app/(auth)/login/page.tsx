'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Gavel, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

const registerSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères').regex(/[A-Z]/, 'Doit contenir une majuscule').regex(/[0-9]/, 'Doit contenir un chiffre'),
  tenantName: z.string().min(2, 'Nom du cabinet requis'),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPwd, setShowPwd] = useState(false);
  const { login, register: registerUser } = useAuthStore();
  const router = useRouter();

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onLogin = async (values: LoginForm) => {
    try {
      await login(values.email, values.password);
      toast.success('Bon retour, Maître !');
      router.push('/dashboard');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Identifiants invalides');
    }
  };

  const onRegister = async (values: RegisterForm) => {
    try {
      await registerUser(values);
      toast.success(`Cabinet "${values.tenantName}" créé avec succès !`);
      router.push('/dashboard');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur lors de l\'inscription');
    }
  };

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 border-r border-slate-800 flex-col justify-between p-14">
        <div>
          <div className="flex items-center gap-3 text-amber-500 mb-10">
            <Gavel size={36} />
            <span className="text-3xl font-bold text-white">LEX<span className="text-slate-400 font-light">MANAGE</span></span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-6">
            La plateforme SaaS<br />des cabinets africains.
          </h1>
          <p className="text-slate-400 text-lg">IA juridique native · Multi-tenant sécurisé · Gestion complète</p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[['500+', 'Cabinets'], ['50k+', 'Dossiers'], ['99.9%', 'Uptime']].map(([val, label]) => (
            <div key={label} className="bg-slate-800 rounded-xl p-4">
              <div className="text-2xl font-bold text-amber-500">{val}</div>
              <div className="text-xs text-slate-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="lg:hidden flex items-center justify-center gap-2 text-amber-500 mb-6">
              <Gavel size={28} /><span className="text-2xl font-bold text-white">LEXMANAGE</span>
            </div>
            <h2 className="text-2xl font-bold text-white">{mode === 'login' ? 'Connexion' : 'Créer votre cabinet'}</h2>
            <p className="text-slate-400 text-sm mt-2">
              {mode === 'login' ? 'Accédez à votre espace sécurisé.' : 'Démarrez votre essai gratuit.'}
            </p>
          </div>

          {mode === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <Field label="Email" error={loginForm.formState.errors.email?.message}>
                <input type="email" {...loginForm.register('email')} placeholder="admin@cabinet.cm" className="input-field" />
              </Field>
              <Field label="Mot de passe" error={loginForm.formState.errors.password?.message}>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} {...loginForm.register('password')} placeholder="••••••••" className="input-field pr-10" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-3 text-slate-400 hover:text-white">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
              <SubmitButton isLoading={loginForm.formState.isSubmitting} label="Se connecter" />
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Prénom" error={registerForm.formState.errors.firstName?.message}>
                  <input {...registerForm.register('firstName')} placeholder="Jean" className="input-field" />
                </Field>
                <Field label="Nom" error={registerForm.formState.errors.lastName?.message}>
                  <input {...registerForm.register('lastName')} placeholder="Kamdem" className="input-field" />
                </Field>
              </div>
              <Field label="Nom du cabinet" error={registerForm.formState.errors.tenantName?.message}>
                <input {...registerForm.register('tenantName')} placeholder="Cabinet Kamdem & Associés" className="input-field" />
              </Field>
              <Field label="Email" error={registerForm.formState.errors.email?.message}>
                <input type="email" {...registerForm.register('email')} placeholder="admin@cabinet.cm" className="input-field" />
              </Field>
              <Field label="Mot de passe" error={registerForm.formState.errors.password?.message}>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} {...registerForm.register('password')} placeholder="Min. 8 caractères" className="input-field pr-10" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-3 text-slate-400 hover:text-white">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
              <SubmitButton isLoading={registerForm.formState.isSubmitting} label="Créer mon cabinet" />
            </form>
          )}

          <div className="text-center text-sm">
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-amber-500 hover:text-amber-400 font-medium transition-colors">
              {mode === 'login' ? "Nouveau cabinet ? S'inscrire →" : '← Déjà inscrit ? Se connecter'}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function SubmitButton({ isLoading, label }: { isLoading: boolean; label: string }) {
  return (
    <button type="submit" disabled={isLoading} className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold rounded-lg py-3 text-sm transition-all flex items-center justify-center gap-2">
      {isLoading ? <><Loader2 size={16} className="animate-spin" />Chargement...</> : label}
    </button>
  );
}
