import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useSearchParams } from '../lib/router';
import { 
  Gavel, 
  Mail, 
  Lock, 
  LogIn, 
  ShieldCheck, 
  ArrowRight,
  User,
  Phone,
  Briefcase,
  ChevronLeft,
  UserPlus,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import apiClient from '../lib/api';
import useLexStore from '../store/useLexStore';
import { API_CONFIG } from '../config/api.config';
import { Button, Input, Badge } from './ui/index';
import NetworkStatusBanner from './NetworkStatusBanner';

const PasswordStrengthMeter = ({ password = "" }) => {
  const has8Chars = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let strength = 0;
  if (password.length > 0) {
    if (has8Chars) strength += 1;
    if (hasUppercase) strength += 1;
    if (hasNumbers) strength += 1;
    if (hasSpecial) strength += 1;
    // ensure at least 1 bar if they started typing
    if (strength === 0) strength = 1;
  }

  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < strength ? (strength <= 2 ? 'bg-amber-500' : 'bg-green-500') : 'bg-slate-200 dark:bg-slate-800'
            }`}
          />
        ))}
      </div>
      <p className="text-[10px] text-slate-600 dark:text-slate-300 dark:text-slate-400">
        Robustesse : <strong>{strength === 0 ? 'Aucune' : strength <= 2 ? 'Faible' : strength === 3 ? 'Moyenne' : 'Forte'}</strong>
      </p>
      
      <ul className="text-[10px] space-y-1 text-slate-600 dark:text-slate-400 mt-1">
        <li className={has8Chars ? 'text-green-600 dark:text-green-500 font-medium' : 'text-slate-500 dark:text-slate-300'}>
          {has8Chars ? '✓' : '○'} Au moins 8 caractères
        </li>
        <li className={hasUppercase ? 'text-green-600 dark:text-green-500 font-medium' : 'text-slate-500 dark:text-slate-300'}>
          {hasUppercase ? '✓' : '○'} Une lettre majuscule
        </li>
        <li className={hasNumbers ? 'text-green-600 dark:text-green-500 font-medium' : 'text-slate-500 dark:text-slate-300'}>
          {hasNumbers ? '✓' : '○'} Au moins un chiffre
        </li>
      </ul>
    </div>
  );
};

const loginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Le mot de passe est obligatoire")
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Adresse email invalide"),
});

const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/[A-Z]/, "Il doit contenir au moins une majuscule")
    .regex(/[0-9]/, "Il doit contenir au moins un chiffre"),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmNewPassword"],
});

const signupSchema = z.object({
  firmName: z.string().min(2, "Le nom du cabinet est obligatoire").optional().or(z.literal('')),
  country: z.string().min(2, "Le pays est obligatoire").optional().or(z.literal('')),
  city: z.string().min(2, "La ville est obligatoire").optional().or(z.literal('')),
  firstName: z.string().min(2, "Le prénom est obligatoire"),
  lastName: z.string().min(2, "Le nom est obligatoire"),
  phone: z.string().min(8, "Le numéro de téléphone est obligatoire"),
  email: z.string().email("Adresse email invalide"),
  password: z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/[A-Z]/, "Il doit contenir au moins une majuscule")
    .regex(/[0-9]/, "Il doit contenir au moins un chiffre"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

const AuthScreen = () => {
  const [searchParams] = useSearchParams();
  const language = useLexStore((s) => s.language);
  const invitationToken = searchParams.get('invitation');
  const requestedMode = searchParams.get('mode');
  const resetToken = searchParams.get('token');
  const [view, setView] = useState(
    requestedMode === 'reset_password' && resetToken
      ? 'reset_password'
      : invitationToken || requestedMode === 'signup'
        ? 'signup'
        : 'login'
  );
  const [signupStep, setSignupStep] = useState(invitationToken ? 2 : 1);
  const [shouldShake, setShouldShake] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isWarmingUp, setIsWarmingUp] = useState(false);

  // Cold-start handling: wake the backend as soon as the auth page loads (so it's
  // ready by the time the user submits), and reflect retry state in the UI.
  useEffect(() => {
    fetch(`${API_CONFIG.BASE_URL}/health`, { method: 'GET' }).catch(() => {});

    const onWarming = () => setIsWarmingUp(true);
    const onWarmed = () => setIsWarmingUp(false);
    window.addEventListener('api:warming-up', onWarming);
    window.addEventListener('api:warmed', onWarmed);
    return () => {
      window.removeEventListener('api:warming-up', onWarming);
      window.removeEventListener('api:warmed', onWarmed);
    };
  }, []);

  const { register, handleSubmit, control, getValues, setError, clearErrors, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(
      view === 'login' ? loginSchema :
      view === 'signup' ? signupSchema :
      view === 'reset_password' ? resetPasswordSchema :
      forgotPasswordSchema
    ),
    mode: "onChange"
  });
  const passwordValue = useWatch({ control, name: 'password', defaultValue: '' });
  const newPasswordValue = useWatch({ control, name: 'newPassword', defaultValue: '' });

  // Step 1 (firm info) is mandatory before reaching step 2. The signup schema
  // keeps these fields optional (so invited users who skip step 1 can register),
  // so we enforce them manually here for the firm-creation flow.
  const nextStep = async () => {
    const { firmName, country, city } = getValues();
    let valid = true;

    if (!firmName || firmName.trim().length < 2) {
      setError('firmName', { type: 'manual', message: 'Le nom du cabinet est obligatoire' });
      valid = false;
    }
    if (!country || country.trim().length < 2) {
      setError('country', { type: 'manual', message: 'Le pays est obligatoire' });
      valid = false;
    }
    if (!city || city.trim().length < 2) {
      setError('city', { type: 'manual', message: 'La ville est obligatoire' });
      valid = false;
    }

    if (valid) {
      clearErrors(['firmName', 'country', 'city']);
      setSignupStep(2);
    } else {
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 800);
      toast.error("Renseignez toutes les informations du cabinet avant de continuer.");
    }
  };

  const onSubmit = async (values) => {
    setLoginError('');
    try {
      if (view === 'login') {
        await useLexStore.getState().login(values.email, values.password);
        setShowWelcome(true);
        // Toast is handled in store, but we add the animation overlay
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
        
        await apiClient.post('/auth/register', registerData);
        toast.success("Cabinet créé. Vous pouvez maintenant vous connecter.");
        setView('login');
      } else if (view === 'forgot_password') {
        const { data } = await apiClient.post('/auth/forgot-password', { email: values.email });
        toast.success(data.message || "Si le compte existe, un lien a été envoyé.");
        setView('login');
      } else if (view === 'reset_password') {
        await apiClient.post('/auth/reset-password', {
          token: resetToken,
          newPassword: values.newPassword,
        });
        toast.success("Mot de passe réinitialisé. Vous pouvez maintenant vous connecter.");
        setView('login');
      }
    } catch (err) {
      console.error("Auth Error:", err);
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 800);

      if (view === 'login') {
        // Unified message — never reveal whether it was the email or the password
        const status = err.response?.status;
        setLoginError(
          status === 401
            ? 'Adresse email ou mot de passe incorrect'
            : (err.response?.data?.message || 'Connexion impossible. Veuillez réessayer.')
        );
      } else {
        const errorMessage = err.response?.data?.message || err.message || "Une erreur est survenue pendant l’authentification";
        toast.error(errorMessage);
      }
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      {/* Welcome Animation Overlay */}
      {showWelcome && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-500">
           <div className="text-center animate-in zoom-in-95 duration-700">
              <h1 className="text-6xl font-black text-white tracking-tight mb-4">
                 Heureux de vous <span className="text-amber-500">revoir</span>
              </h1>
              <p className="text-slate-400 font-medium text-lg">LexManage charge les données de votre cabinet…</p>
              <div className="mt-8 flex justify-center">
                 <div className="w-16 h-1 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin"></div>
              </div>
           </div>
        </div>
      )}

      <div className="hidden lg:flex w-1/2 bg-slate-900 relative flex-col justify-between p-12 text-white border-r border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,0.1),transparent)] pointer-events-none"></div>
        <div>
          <div className="flex items-center gap-3 text-amber-500 mb-10">
            <Gavel size={40} className="drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
            <span className="text-3xl font-bold tracking-tight text-white">LEX<span className="text-slate-600 dark:text-slate-300 font-light">MANAGE</span></span>
          </div>
          <div className="space-y-6">
            <h1 className="text-5xl font-extrabold leading-[1.1] mb-4">
              La plateforme de référence <br />
              <span className="text-amber-500">pour les cabinets d’avocats.</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-300 text-lg max-w-md leading-relaxed">
              Gérez vos dossiers, automatisez vos opérations et collaborez en toute sécurité.
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="font-bold text-sm">Isolation multi-cabinets</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">Données strictement séparées pour chaque cabinet.</p>
            </div>
          </div>
          <div className="z-10 text-xs text-slate-600 dark:text-slate-300 font-medium tracking-widest uppercase">© 2026 LexManage Systems • Édition SaaS</div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white dark:bg-slate-950 overflow-y-auto">
        <div className={`w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 py-8 ${shouldShake ? 'animate-shake' : ''}`}>
          
          <div className="text-center lg:text-left">
            {(view === 'forgot_password' || view === 'reset_password' || (view === 'signup' && signupStep === 2)) && (
              <button 
                aria-label="Retour"
                onClick={() => {
                  if (view === 'signup' && signupStep === 2 && !invitationToken) setSignupStep(1);
                  else setView('login');
                }}
                className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-amber-600 mb-6 transition-all group"
              >
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Retour
              </button>
            )}
            
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {view === 'login' ? 'Bienvenue' :
               view === 'signup' ? (invitationToken ? 'Rejoindre le cabinet' : 'Créer votre cabinet') :
               view === 'reset_password' ? 'Nouveau mot de passe' : 'Récupération'}
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300 font-medium">
              {view === 'login' ? 'Log in to your secure workspace.' : 
               view === 'signup' ? (signupStep === 1 ? 'Étape 1 : informations du cabinet' : 'Étape 2 : administrateur principal') :
               view === 'reset_password'
                 ? 'Choisissez un nouveau mot de passe sécurisé.'
                 : 'Un lien de réinitialisation vous sera envoyé.'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <NetworkStatusBanner language={language} />
            {isWarmingUp && (
              <div
                role="status"
                className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 animate-in fade-in slide-in-from-top-2 duration-300"
              >
                <Loader2 size={18} className="shrink-0 animate-spin" />
                <span className="text-sm font-semibold">Démarrage du serveur, veuillez patienter…</span>
              </div>
            )}
            {view === 'login' && (
              <>
                {loginError && (
                  <div
                    role="alert"
                    className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 animate-in fade-in slide-in-from-top-2 duration-300"
                  >
                    <AlertCircle size={18} className="shrink-0 animate-pulse" />
                    <span className="text-sm font-semibold">{loginError}</span>
                  </div>
                )}
                <Input {...register("email")} label="Email professionnel" type="email" icon={Mail} error={errors.email?.message} />
                <div className="space-y-2">
                  <Input {...register("password")} label="Mot de passe" type="password" icon={Lock} error={errors.password?.message} />
                  <div className="flex justify-end">
                    <button type="button" onClick={() => { setLoginError(''); setView('forgot_password'); }} className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors">Mot de passe oublié ?</button>
                  </div>
                </div>
              </>
            )}

            {view === 'signup' && !invitationToken && signupStep === 1 && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <Input {...register("firmName")} label="Nom du cabinet" icon={Briefcase} placeholder="Ex. : Kamdem & Associés" error={errors.firmName?.message} />
                <div className="grid grid-cols-2 gap-4">
                  <Input {...register("country")} label="Pays" placeholder="Cameroun" error={errors.country?.message} />
                  <Input {...register("city")} label="Ville" placeholder="Douala" error={errors.city?.message} />
                </div>
                <Button type="button" onClick={nextStep} className="w-full h-14 text-lg font-bold" icon={ArrowRight}>
                  Suivant
                </Button>
              </div>
            )}

            {view === 'signup' && (invitationToken || signupStep === 2) && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                <Input {...register("firstName")} label="Prénom" icon={User} error={errors.firstName?.message} />
                  <Input {...register("lastName")} label="Nom" error={errors.lastName?.message} />
                </div>
                <Input {...register("email")} label="Email professionnel" type="email" icon={Mail} error={errors.email?.message} />
                <Input {...register("phone")} label="Téléphone" type="tel" icon={Phone} placeholder="+237 …" error={errors.phone?.message} />
                <div className="space-y-4">
                  <div>
                    <Input {...register("password")} label="Mot de passe" type="password" icon={Lock} error={errors.password?.message} />
                    <PasswordStrengthMeter password={passwordValue} />
                  </div>
                  <Input {...register("confirmPassword")} label="Confirmer le mot de passe" type="password" icon={ShieldCheck} error={errors.confirmPassword?.message} />
                </div>
                <div className="flex gap-3">
                  {!invitationToken && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSignupStep(1)}
                      icon={ChevronLeft}
                      className="h-14 px-6 text-base font-bold"
                    >
                      Retour
                    </Button>
                  )}
                  <Button type="submit" isLoading={isSubmitting} className="flex-1 h-14 text-lg font-bold" icon={Check}>
                    {invitationToken ? 'Rejoindre maintenant' : 'Créer le cabinet'}
                  </Button>
                </div>
              </div>
            )}

            {view === 'forgot_password' && (
              <div className="space-y-5">
                <Input {...register("email")} label="Email de récupération" type="email" icon={Mail} error={errors.email?.message} />
                <Button type="submit" isLoading={isSubmitting} className="w-full h-14 font-bold">
                  Envoyer le lien
                </Button>
              </div>
            )}

            {view === 'reset_password' && (
              <div className="space-y-5">
                <div>
                  <Input {...register("newPassword")} label="Nouveau mot de passe" type="password" icon={Lock} error={errors.newPassword?.message} />
                  <PasswordStrengthMeter password={newPasswordValue} />
                </div>
                <Input {...register("confirmNewPassword")} label="Confirmer le mot de passe" type="password" icon={ShieldCheck} error={errors.confirmNewPassword?.message} />
                <Button type="submit" isLoading={isSubmitting} className="w-full h-14 font-bold">
                  Réinitialiser le mot de passe
                </Button>
              </div>
            )}

            {view === 'login' && (
              <Button type="submit" isLoading={isSubmitting} className="w-full h-14 text-lg font-bold shadow-[0_10px_20px_rgba(15,23,42,0.1)]" icon={ArrowRight}>
                Se connecter
              </Button>
            )}
          </form>

          {view === 'login' && !invitationToken && (
            <div className="text-center pt-8 border-t border-slate-100 dark:border-slate-800">
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">Vous n’avez pas encore de compte ?</p>
              <button 
                aria-label="Créer un nouveau cabinet"
                onClick={() => { setLoginError(''); setView('signup'); setSignupStep(1); }}
                className="w-full py-3 px-6 rounded-xl border-2 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
              >
                <UserPlus size={18} className="text-amber-500" />
                Créer un nouveau cabinet
              </button>
            </div>
          )}

          {view === 'signup' && (
            <div className="text-center pt-6">
              <button aria-label="Se connecter" onClick={() => setView('login')} className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                Déjà inscrit ? Se connecter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;


