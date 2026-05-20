import React, { useState, useEffect, useMemo } from 'react';
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
  Key
} from 'lucide-react';
import { Button, Input, Badge } from './UI';
import { supabase } from '../lib/supabase';

const loginSchema = z.object({
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères")
});

const mfaSchema = z.object({
  code: z.string().length(6, "Le code doit faire 6 chiffres")
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Format d'email invalide"),
});

const signupBaseSchema = z.object({
  firstName: z.string().min(2, "Le prénom est requis"),
  lastName: z.string().min(2, "Le nom est requis"),
  dateOfBirth: z.string().min(1, "La date de naissance est requise"),
  phone: z.string().min(8, "Le numéro de téléphone est requis"),
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères"),
  confirmPassword: z.string(),
});

const AuthScreen = () => {
  const [view, setView] = useState('login'); // 'login', 'signup', 'forgot_password', 'mfa_challenge'
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('invitation');

  const currentSignupSchema = useMemo(() => {
    let schema = signupBaseSchema;
    if (!invitationToken) {
      schema = schema.extend({ firmName: z.string().min(2, "Le nom du cabinet est requis") });
    }
    return schema.refine((data) => data.password === data.confirmPassword, {
      message: "Les mots de passe ne correspondent pas",
      path: ["confirmPassword"],
    });
  }, [invitationToken]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(
      view === 'login' ? loginSchema : 
      view === 'signup' ? currentSignupSchema : 
      view === 'mfa_challenge' ? mfaSchema :
      forgotPasswordSchema
    ),
    mode: "onChange"
  });

  useEffect(() => { if (invitationToken) setView('signup'); }, [invitationToken]);
  useEffect(() => { reset(); }, [view, reset]);

  const onSubmit = async (values) => {
    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (error) throw error;

        // VERIFICATION MFA
        const { data: { currentLevel, nextLevel }, error: mfaError } = 
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        
        if (mfaError) throw mfaError;

        if (currentLevel === 'aal1' && nextLevel === 'aal2') {
          setView('mfa_challenge');
          return;
        }

        toast.success("Bon retour, Maître !");
      } 
      
      else if (view === 'mfa_challenge') {
        // Validation du code 2FA
        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) throw factorsError;

        const totpFactor = factors.totp[0];
        if (!totpFactor) throw new Error("Aucun facteur MFA trouvé.");

        const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
          factorId: totpFactor.id,
          code: values.code
        });

        if (verifyError) throw new Error("Code invalide. Réessayez.");
        toast.success("Authentification double facteur réussie !");
      }

      else if (view === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              first_name: values.firstName,
              last_name: values.lastName,
              full_name: `${values.firstName} ${values.lastName}`,
              phone: values.phone,
              date_of_birth: values.dateOfBirth,
              firm_name: invitationToken ? null : values.firmName,
              invitation_token: invitationToken || null,
              role: 'lawyer', // Default role for new signups
              avatar_url: null
            }
          }
        });
        if (error) throw error;
        toast.success(invitationToken ? "Bienvenue dans le cabinet !" : "Cabinet créé ! Vérifiez vos e-mails.");
        setView('login');
      } 

      else if (view === 'forgot_password') {
        const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Lien de récupération envoyé.");
        setView('login');
      }
    } catch (err) {
      toast.error(err.message || "Une erreur est survenue");
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative flex-col justify-between p-12 text-white border-r border-slate-800">
        <div>
          <div className="flex items-center gap-3 text-amber-500 mb-6">
            <Gavel size={32} />
            <span className="text-2xl font-bold tracking-wide text-white">LEX<span className="text-slate-400 font-light">MANAGE</span></span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">La sécurité au service de la Justice.</h1>
        </div>
        <div className="z-10 text-sm text-slate-500">© 2026 LexManage Systems.</div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white dark:bg-slate-950 overflow-y-auto">
        <div className="w-full max-w-md space-y-8 animate-in fade-in duration-500 py-8">
          
          <div className="text-center lg:text-left">
            {(view === 'forgot_password' || view === 'mfa_challenge') && (
              <button onClick={() => setView('login')} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-amber-600 mb-4 transition-colors">
                <ChevronLeft size={14} /> Retour
              </button>
            )}
            
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              {view === 'login' ? 'Connexion' : 
               view === 'mfa_challenge' ? 'Double Facteur' : 
               view === 'signup' ? 'Inscription' : 'Récupération'}
            </h2>
            <p className="mt-2 text-slate-500">
              {view === 'mfa_challenge' ? 'Entrez le code de votre application d\'authentification.' : 'Accédez à votre espace sécurisé.'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {view === 'mfa_challenge' && (
              <div className="animate-in slide-in-from-bottom-2 duration-300">
                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 mb-6 flex gap-3 items-center">
                  <Key className="text-amber-600" size={24} />
                  <p className="text-xs text-amber-800 dark:text-amber-400 font-medium">Votre compte est protégé. Merci d'entrer votre code TOTP.</p>
                </div>
                <Input 
                  {...register("code")} 
                  label="Code de vérification (6 chiffres)" 
                  placeholder="000000" 
                  maxLength={6}
                  error={errors.code?.message} 
                />
              </div>
            )}

            {view === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Input {...register("firstName")} label="Prénom" icon={User} error={errors.firstName?.message} />
                  <Input {...register("lastName")} label="Nom" error={errors.lastName?.message} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input {...register("dateOfBirth")} label="Naissance" type="date" icon={Calendar} error={errors.dateOfBirth?.message} />
                  <Input {...register("phone")} label="Téléphone" type="tel" icon={Phone} error={errors.phone?.message} />
                </div>
                {!invitationToken && <Input {...register("firmName")} label="Nom du Cabinet" icon={Briefcase} error={errors.firmName?.message} />}
              </>
            )}

            {(view === 'login' || view === 'signup' || view === 'forgot_password') && (
              <Input {...register("email")} label="Email" type="email" icon={Mail} error={errors.email?.message} />
            )}

            {view === 'login' && (
              <div className="space-y-1">
                <Input {...register("password")} label="Mot de passe" type="password" icon={Lock} error={errors.password?.message} />
                <button type="button" onClick={() => setView('forgot_password')} className="text-xs font-semibold text-amber-600 hover:underline">Oublié ?</button>
              </div>
            )}

            {view === 'signup' && (
              <div className="grid grid-cols-2 gap-4">
                <Input {...register("password")} label="Mot de passe" type="password" icon={Lock} error={errors.password?.message} />
                <Input {...register("confirmPassword")} label="Confirmation" type="password" icon={ShieldCheck} error={errors.confirmPassword?.message} />
              </div>
            )}

            <Button type="submit" isLoading={isSubmitting} className="w-full h-12" icon={ArrowRight}>
              {view === 'mfa_challenge' ? 'Vérifier et Entrer' : 'Continuer'}
            </Button>
          </form>

          {view === 'login' && !invitationToken && (
            <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setView('signup')} className="text-sm font-semibold text-amber-600 hover:underline">Nouveau cabinet ? S'inscrire</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
