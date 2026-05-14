import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { 
  Gavel, 
  Mail, 
  Lock, 
  LogIn, 
  Building2, 
  ShieldCheck, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { Button, Input } from './UI';
import { supabase } from '../lib/supabase';

const loginSchema = z.object({
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères")
});

const signupSchema = z.object({
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères"),
  confirmPassword: z.string(),
  firmName: z.string().min(2, "Le nom du cabinet est requis"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

const AuthScreen = () => {
  const [view, setView] = useState('login'); 
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm({
    resolver: zodResolver(view === 'login' ? loginSchema : signupSchema)
  });

  const onSubmit = async (values) => {
    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (error) throw error;
        toast.success("Bon retour, Maître !");
      } else {
        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              full_name: values.firmName,
            }
          }
        });
        if (error) throw error;
        toast.success("Compte créé ! Vérifiez vos e-mails.");
        setView('login');
      }
    } catch (err) {
      toast.error(err.message || "Une erreur est survenue");
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Colonne de gauche - Branding */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 dark:bg-slate-950 relative flex-col justify-between p-12 text-white border-r border-slate-800">
        <div className="z-10">
          <div className="flex items-center gap-3 text-amber-500 mb-6">
            <Gavel size={32} />
            <span className="text-2xl font-bold tracking-wide text-white">LEX<span className="text-slate-400 font-light">MANAGE</span></span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            La gestion d'élite<br/>pour le barreau moderne.
          </h1>
          <p className="text-slate-400 text-lg max-w-md">
            Centralisez vos dossiers, collaborez avec votre équipe et exploitez l'IA pour maximiser votre stratégie juridique.
          </p>
        </div>
        
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="z-10 text-sm text-slate-500">
          © 2026 LexManage Systems. Sécurité et confidentialité garanties.
        </div>
      </div>

      {/* Colonne de droite - Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-slate-950">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
          
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              {view === 'login' ? 'Connexion' : 'Nouveau Cabinet'}
            </h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              {view === 'login' ? 'Accédez à votre espace sécurisé.' : 'Commencez votre essai gratuit de 14 jours.'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {view === 'signup' && (
              <Input 
                {...register("firmName")}
                label="Nom du Cabinet"
                icon={Building2}
                placeholder="Ex: Smith & Partners"
                error={errors.firmName?.message}
              />
            )}

            <Input 
              {...register("email")}
              label="Adresse Email"
              type="email"
              icon={Mail}
              placeholder="avocat@cabinet.fr"
              error={errors.email?.message}
            />

            <Input 
              {...register("password")}
              label="Mot de passe"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              error={errors.password?.message}
            />

            {view === 'signup' && (
              <Input 
                {...register("confirmPassword")}
                label="Confirmer le mot de passe"
                type="password"
                icon={ShieldCheck}
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
              />
            )}

            <Button 
              type="submit" 
              isLoading={isSubmitting}
              className="w-full"
              icon={view === 'login' ? LogIn : ArrowRight}
            >
              {view === 'login' ? 'Se connecter' : 'Créer le compte administrateur'}
            </Button>
          </form>

          <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => setView(view === 'login' ? 'signup' : 'login')}
              className="text-sm font-semibold text-amber-600 hover:underline"
            >
              {view === 'login' ? "Pas encore de compte ? Créer un cabinet" : "Déjà inscrit ? Se connecter"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
