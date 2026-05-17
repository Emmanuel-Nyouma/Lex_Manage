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
  UserPlus
} from 'lucide-react';
import { Button, Input } from './UI';
import { supabase } from '../lib/supabase';

const loginSchema = z.object({
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères")
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Format d'email invalide"),
});

// Schéma de base pour l'inscription
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
  const [view, setView] = useState('login');
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('invitation');

  // Ajuster le schéma de validation si c'est une invitation
  const currentSignupSchema = useMemo(() => {
    let schema = signupBaseSchema;
    
    if (!invitationToken) {
      schema = schema.extend({
        firmName: z.string().min(2, "Le nom du cabinet est requis"),
      });
    }

    return schema.refine((data) => data.password === data.confirmPassword, {
      message: "Les mots de passe ne correspondent pas",
      path: ["confirmPassword"],
    });
  }, [invitationToken]);

  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors, isSubmitting } 
  } = useForm({
    resolver: zodResolver(
      view === 'login' ? loginSchema : 
      view === 'signup' ? currentSignupSchema : 
      forgotPasswordSchema
    ),
    mode: "onChange"
  });

  // Basculer automatiquement sur 'signup' si un token est présent
  useEffect(() => {
    if (invitationToken) {
      setView('signup');
    }
  }, [invitationToken]);

  useEffect(() => {
    reset();
  }, [view, reset]);

  const onSubmit = async (values) => {
    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (error) throw error;
        toast.success("Bon retour, Maître !");
      } else if (view === 'signup') {
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
              // Meta-données pour le trigger Postgres
              firm_name: invitationToken ? null : values.firmName,
              invitation_token: invitationToken || null
            }
          }
        });
        
        if (error) {
          // Gérer les erreurs spécifiques envoyées par le trigger (ex: token invalide)
          if (error.message.includes('invitation')) {
            throw new Error("Le lien d'invitation est invalide ou a expiré.");
          }
          throw error;
        }

        toast.success(invitationToken 
          ? "Inscription réussie ! Vous avez rejoint le cabinet." 
          : "Cabinet créé ! Vérifiez vos e-mails."
        );
        setView('login');
      } else if (view === 'forgot_password') {
        const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Lien de récupération envoyé par e-mail.");
        setView('login');
      }
    } catch (err) {
      toast.error(err.message || "Une erreur est survenue");
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100">
      {/* Branding */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 dark:bg-slate-950 relative flex-col justify-between p-12 text-white border-r border-slate-800">
        <div className="z-10">
          <div className="flex items-center gap-3 text-amber-500 mb-6">
            <Gavel size={32} />
            <span className="text-2xl font-bold tracking-wide text-white">LEX<span className="text-slate-400 font-light">MANAGE</span></span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">La gestion d'élite pour le barreau moderne.</h1>
          <p className="text-slate-400 max-w-md">Transformez votre pratique juridique avec une IA de pointe et une gestion multi-tenant sécurisée.</p>
        </div>
        <div className="z-10 text-sm text-slate-500">© 2026 LexManage Systems.</div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      </div>

      {/* Form Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-slate-950 overflow-y-auto">
        <div className="w-full max-w-lg space-y-8 animate-in fade-in duration-500 py-8">
          
          <div className="text-center lg:text-left">
            {view === 'forgot_password' && (
              <button onClick={() => setView('login')} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-amber-600 mb-4 transition-colors">
                <ChevronLeft size={14} /> Retour à la connexion
              </button>
            )}
            
            {invitationToken && view === 'signup' && (
              <Badge variant="info" className="mb-4 py-1 px-3 flex items-center gap-2 w-fit">
                <UserPlus size={14} /> Invitation en cours
              </Badge>
            )}

            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              {view === 'login' ? 'Connexion' : view === 'signup' ? (invitationToken ? 'Rejoindre le Cabinet' : 'Création de Cabinet') : 'Récupération'}
            </h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              {view === 'login' ? 'Accédez à votre espace sécurisé.' : view === 'signup' ? 'Renseignez vos informations professionnelles.' : 'Entrez votre e-mail pour réinitialiser votre mot de passe.'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {view === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Input {...register("firstName")} label="Prénom" placeholder="Jean" icon={User} error={errors.firstName?.message} />
                  <Input {...register("lastName")} label="Nom" placeholder="Dupont" error={errors.lastName?.message} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input {...register("dateOfBirth")} label="Date de naissance" type="date" icon={Calendar} error={errors.dateOfBirth?.message} />
                  <Input {...register("phone")} label="Téléphone" type="tel" placeholder="06..." icon={Phone} error={errors.phone?.message} />
                </div>
                
                {!invitationToken && (
                  <>
                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-4"></div>
                    <Input {...register("firmName")} label="Nom du Cabinet (Structure)" placeholder="Cabinet Smith & Co" icon={Briefcase} error={errors.firmName?.message} />
                  </>
                )}
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-4"></div>
              </>
            )}

            <Input {...register("email")} label="Adresse Email" type="email" icon={Mail} placeholder="avocat@cabinet.fr" error={errors.email?.message} />

            {view === 'login' && (
              <div className="space-y-1">
                <Input {...register("password")} label="Mot de passe" type="password" icon={Lock} placeholder="••••••••" error={errors.password?.message} />
                <button type="button" onClick={() => setView('forgot_password')} className="text-xs font-semibold text-amber-600 hover:underline">
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            {view === 'signup' && (
              <div className="grid grid-cols-2 gap-4">
                <Input {...register("password")} label="Mot de passe" type="password" icon={Lock} placeholder="••••••••" error={errors.password?.message} />
                <Input {...register("confirmPassword")} label="Confirmation" type="password" icon={ShieldCheck} placeholder="••••••••" error={errors.confirmPassword?.message} />
              </div>
            )}

            <Button type="submit" isLoading={isSubmitting} className="w-full h-12" icon={view === 'login' ? LogIn : ArrowRight}>
              {view === 'login' ? 'Se connecter' : view === 'signup' ? (invitationToken ? 'Rejoindre' : 'Initialiser le cabinet') : 'Envoyer le lien'}
            </Button>
          </form>

          {view !== 'forgot_password' && !invitationToken && (
            <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="text-sm font-semibold text-amber-600 hover:underline">
                {view === 'login' ? "Nouveau cabinet ? S'inscrire ici" : "Déjà inscrit ? Se connecter"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
