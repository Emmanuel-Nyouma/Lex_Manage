import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '../lib/router';
import {
  ArrowRight,
  BarChart3,
  BellRing,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronLeft,
  FileStack,
  Gavel,
  Languages,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import useLexStore from '../store/useLexStore';
import appIcon from '../../assets/branding/lexmanage-playstore-icon-512.png';

export const ONBOARDING_STORAGE_KEY = 'lexmanage:onboarding-completed';

const copy = {
  fr: {
    skip: 'Passer',
    previous: 'Précédent',
    next: 'Suivant',
    getStarted: 'Commencer',
    createFirm: 'Créer mon cabinet',
    progress: 'Écran',
    slides: [
      {
        eyebrow: 'Bienvenue dans LexManage',
        title: 'Votre cabinet, mieux organisé.',
        description:
          'La plateforme de gestion juridique multi-tenant qui réunit dossiers, clients, équipes et décisions dans un espace unique et sécurisé.',
        Icon: Gavel,
        highlights: ['Pensé pour les avocats', 'Accessible partout', 'Simple dès le premier jour'],
      },
      {
        eyebrow: 'Gestion juridique unifiée',
        title: 'Pilotez chaque dossier sans rien oublier.',
        description:
          'Centralisez vos clients, affaires, échéances et rendez-vous. LexManage transforme le suivi quotidien en un flux de travail clair et maîtrisé.',
        Icon: BriefcaseBusiness,
        highlights: ['Dossiers et clients', 'Calendrier intelligent', 'Alertes d’échéances'],
      },
      {
        eyebrow: 'LexAssist Intelligence',
        title: 'L’intelligence au service de votre pratique.',
        description:
          'Retrouvez rapidement l’information utile, exploitez vos documents et obtenez des analyses contextuelles pour travailler avec plus de précision.',
        Icon: BrainCircuit,
        highlights: ['Assistant juridique IA', 'Recherche documentaire', 'Analyses contextuelles'],
      },
      {
        eyebrow: 'Sécurité multi-tenant',
        title: 'Chaque cabinet reste strictement isolé.',
        description:
          'Les données, documents et conversations de chaque organisation sont séparés. Les rôles et permissions garantissent un accès adapté à chaque collaborateur.',
        Icon: ShieldCheck,
        highlights: ['Isolation des cabinets', 'Accès par rôles', 'Collaboration sécurisée'],
      },
      {
        eyebrow: 'Une vision complète',
        title: 'Décidez avec les bonnes informations.',
        description:
          'Tableaux de bord, charge de travail, notifications et échéances prioritaires vous donnent une vision immédiate de l’activité du cabinet.',
        Icon: BarChart3,
        highlights: ['Indicateurs en temps réel', 'Équipe mieux coordonnée', 'Priorités visibles'],
      },
    ],
  },
  en: {
    skip: 'Skip',
    previous: 'Previous',
    next: 'Next',
    getStarted: 'Get started',
    createFirm: 'Create my firm',
    progress: 'Screen',
    slides: [
      {
        eyebrow: 'Welcome to LexManage',
        title: 'Your firm, better organized.',
        description:
          'The multi-tenant legal management platform that brings cases, clients, teams, and decisions together in one secure workspace.',
        Icon: Gavel,
        highlights: ['Built for legal teams', 'Available everywhere', 'Simple from day one'],
      },
      {
        eyebrow: 'Unified legal management',
        title: 'Run every matter without missing a detail.',
        description:
          'Centralize clients, matters, deadlines, and appointments. LexManage turns daily follow-up into a clear, controlled workflow.',
        Icon: BriefcaseBusiness,
        highlights: ['Matters and clients', 'Smart calendar', 'Deadline alerts'],
      },
      {
        eyebrow: 'LexAssist Intelligence',
        title: 'Intelligence built for legal work.',
        description:
          'Find useful information faster, work with your documents, and receive contextual insights that help your team operate with precision.',
        Icon: BrainCircuit,
        highlights: ['Legal AI assistant', 'Document search', 'Contextual insights'],
      },
      {
        eyebrow: 'Multi-tenant security',
        title: 'Every firm remains strictly isolated.',
        description:
          'Each organization’s data, documents, and conversations stay separated. Roles and permissions give every colleague the right level of access.',
        Icon: ShieldCheck,
        highlights: ['Firm-level isolation', 'Role-based access', 'Secure collaboration'],
      },
      {
        eyebrow: 'Complete visibility',
        title: 'Make decisions with the right information.',
        description:
          'Dashboards, workloads, notifications, and priority deadlines give you an immediate view of your firm’s activity.',
        Icon: BarChart3,
        highlights: ['Live indicators', 'Coordinated teams', 'Visible priorities'],
      },
    ],
  },
};

const featureIcons = [
  [BriefcaseBusiness, CalendarDays, Sparkles],
  [BriefcaseBusiness, CalendarDays, BellRing],
  [BrainCircuit, FileStack, Sparkles],
  [LockKeyhole, ShieldCheck, UsersRound],
  [BarChart3, UsersRound, BellRing],
];

const OnboardingScreen = () => {
  const navigate = useNavigate();
  const language = useLexStore((state) => state.language);
  const setLanguage = useLexStore((state) => state.setLanguage);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(null);
  const content = useMemo(() => copy[language] || copy.en, [language]);
  const slide = content.slides[activeIndex];
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === content.slides.length - 1;

  const completeOnboarding = (mode = 'login') => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    navigate(mode === 'signup' ? '/login?mode=signup' : '/login', { replace: true });
  };

  const goNext = () => {
    if (isLast) {
      completeOnboarding('login');
      return;
    }
    setActiveIndex((current) => Math.min(current + 1, content.slides.length - 1));
  };

  const goPrevious = () => {
    setActiveIndex((current) => Math.max(current - 1, 0));
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'ArrowRight') {
        setActiveIndex((current) => Math.min(current + 1, content.slides.length - 1));
      }
      if (event.key === 'ArrowLeft') {
        setActiveIndex((current) => Math.max(current - 1, 0));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [content.slides.length]);

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const distance = touchStartX.current - endX;

    if (Math.abs(distance) > 55) {
      if (distance > 0 && !isLast) {
        setActiveIndex((current) => Math.min(current + 1, content.slides.length - 1));
      } else if (distance < 0 && !isFirst) {
        setActiveIndex((current) => Math.max(current - 1, 0));
      }
    }
    touchStartX.current = null;
  };

  const SlideIcon = slide.Icon;

  return (
    <main
      className="relative min-h-[100dvh] overflow-hidden bg-[#07111f] text-white"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-56 -right-36 h-[34rem] w-[34rem] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      </div>

      <div className="relative mx-auto flex h-[100dvh] w-full max-w-7xl flex-col overflow-hidden px-5 py-5 sm:px-8 sm:py-7 lg:px-12">
        <header className="flex shrink-0 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-lg shadow-black/20">
              <img src={appIcon} alt="" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-base font-black tracking-[0.12em]">
                LEX<span className="font-medium text-amber-400">MANAGE</span>
              </p>
              <p className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:block">
                Legal practice platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isLast && (
              <button
                type="button"
                onClick={() => completeOnboarding('login')}
                className="rounded-lg px-3 py-2 text-xs font-bold text-slate-400 transition-colors hover:bg-white/5 hover:text-white sm:text-sm"
              >
                {content.skip}
              </button>
            )}
            <button
              type="button"
              onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 backdrop-blur transition-colors hover:border-amber-400/40 hover:bg-white/10"
              aria-label={language === 'fr' ? 'Switch to English' : 'Passer en français'}
              title={language === 'fr' ? 'English' : 'Français'}
            >
              <Languages size={15} aria-hidden="true" />
              {language === 'fr' ? 'EN' : 'FR'}
            </button>
          </div>
        </header>

        <section className="grid min-h-0 flex-1 items-center gap-5 overflow-y-auto overscroll-contain py-5 pr-1 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:overflow-visible lg:py-10">
          <div
            key={`copy-${activeIndex}-${language}`}
            className="order-2 mx-auto w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500 lg:order-1 lg:mx-0"
            aria-live="polite"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber-300">
              <Sparkles size={13} aria-hidden="true" />
              {slide.eyebrow}
            </div>
            <h1 className="max-w-2xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {slide.title}
            </h1>
            <p className="mt-5 max-w-xl text-base font-medium leading-7 text-slate-300 sm:text-lg sm:leading-8">
              {slide.description}
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {slide.highlights.map((highlight, index) => {
                const FeatureIcon = featureIcons[activeIndex][index];
                return (
                  <div
                    key={highlight}
                    className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 backdrop-blur"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400">
                      <FeatureIcon size={16} aria-hidden="true" />
                    </div>
                    <span className="text-xs font-bold leading-5 text-slate-200">{highlight}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            key={`visual-${activeIndex}`}
            className="order-1 mx-auto flex w-full max-w-[20rem] items-center justify-center animate-in fade-in zoom-in-95 duration-500 sm:max-w-[28rem] lg:order-2 lg:max-w-[34rem]"
            aria-hidden="true"
          >
            <div className="relative aspect-square w-full">
              <div className="absolute inset-[7%] rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] shadow-2xl shadow-black/30 backdrop-blur-xl" />
              <div className="absolute inset-[14%] rounded-[2rem] border border-amber-400/15 bg-[#0b1728]/90 shadow-inner shadow-amber-400/5">
                <div className="absolute inset-x-5 top-5 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-400/70" />
                    <span className="h-2 w-2 rounded-full bg-amber-400/70" />
                    <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
                  </div>
                  <span className="h-2 w-16 rounded-full bg-white/10" />
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center px-7 pt-6">
                  {activeIndex === 0 ? (
                    <img
                      src={appIcon}
                      alt=""
                      className="h-32 w-32 rounded-[2rem] object-cover shadow-2xl shadow-amber-500/10 sm:h-40 sm:w-40"
                    />
                  ) : (
                    <div className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] border border-amber-400/20 bg-amber-400/10 text-amber-400 shadow-xl shadow-amber-500/10 sm:h-36 sm:w-36">
                      <div className="absolute inset-3 rounded-[1.4rem] border border-white/5" />
                      <SlideIcon className="relative h-14 w-14 sm:h-16 sm:w-16" strokeWidth={1.6} />
                    </div>
                  )}

                  <div className="mt-6 flex w-full max-w-[14rem] items-center justify-center gap-2">
                    {slide.highlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="h-1.5 flex-1 rounded-full bg-gradient-to-r from-amber-400/70 to-amber-400/20"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute right-[2%] top-[22%] flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/90 text-amber-400 shadow-xl backdrop-blur sm:h-16 sm:w-16">
                <SlideIcon size={26} strokeWidth={1.8} />
              </div>
              <div className="absolute bottom-[12%] left-[2%] flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/90 px-3 py-2 text-emerald-400 shadow-xl backdrop-blur">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/10">
                  <Check size={13} strokeWidth={3} />
                </span>
                <span className="h-1.5 w-14 rounded-full bg-white/15 sm:w-20" />
              </div>
            </div>
          </div>
        </section>

        <footer className="z-10 flex shrink-0 flex-col gap-4 border-t border-white/8 bg-[#07111f]/95 pt-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:pt-5">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            {content.slides.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`${content.progress} ${index + 1}`}
                aria-current={index === activeIndex ? 'step' : undefined}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? 'w-8 bg-amber-400'
                    : 'w-2 bg-slate-600 hover:bg-slate-400'
                }`}
              />
            ))}
            <span className="ml-2 text-xs font-bold tabular-nums text-slate-500">
              {String(activeIndex + 1).padStart(2, '0')} / {String(content.slides.length).padStart(2, '0')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {!isFirst && (
              <button
                type="button"
                onClick={goPrevious}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-slate-200 transition-colors hover:bg-white/10"
              >
                <ChevronLeft size={17} aria-hidden="true" />
                <span className="hidden sm:inline">{content.previous}</span>
              </button>
            )}

            {isLast && (
              <button
                type="button"
                onClick={() => completeOnboarding('signup')}
                className="h-12 flex-1 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 text-sm font-extrabold text-amber-300 transition-colors hover:bg-amber-400/15 sm:flex-none"
              >
                {content.createFirm}
              </button>
            )}

            <button
              type="button"
              onClick={goNext}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400 active:scale-[0.98] sm:min-w-36 sm:flex-none"
            >
              {isLast ? content.getStarted : content.next}
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
};

export default OnboardingScreen;
