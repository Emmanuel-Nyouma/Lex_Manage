-- ==========================================
-- LEXMANAGE : PRODUCTION SAAS SETUP
-- Architecture: Multi-tenant, Soft Delete, Audit Trail
-- ==========================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES PRINCIPALES
CREATE TABLE IF NOT EXISTS public.firms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  firm_id UUID REFERENCES public.firms(id),
  first_name TEXT,
  last_name TEXT,
  role TEXT CHECK (role IN ('admin', 'lawyer', 'paralegal')),
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firm_id UUID REFERENCES public.firms(id) NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  client_name TEXT,
  opponent_name TEXT,
  jurisdiction TEXT,
  status TEXT DEFAULT 'active',
  priority TEXT DEFAULT 'medium',
  next_hearing_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firm_id UUID REFERENCES public.firms(id) NOT NULL,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  size INTEGER,
  gemini_file_uri TEXT, -- Pour l'intégration RAG Gemini
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 3. AUDIT LOGS (Traçabilité)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firm_id UUID REFERENCES public.firms(id),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES public.profiles(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fonction d'audit automatique
CREATE OR REPLACE FUNCTION public.audit_cases_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.audit_logs (firm_id, table_name, record_id, action, old_data, new_data, changed_by)
    VALUES (OLD.firm_id, 'cases', OLD.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_logs (firm_id, table_name, record_id, action, new_data, changed_by)
    VALUES (NEW.firm_id, 'cases', NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_cases_trigger
  AFTER INSERT OR UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.audit_cases_changes();

-- 4. SECURITÉ ABSOLUE (RLS)
ALTER TABLE public.firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Fonction utilitaire pour récupérer le firm_id
CREATE OR REPLACE FUNCTION public.get_user_firm_id()
RETURNS UUID AS $$
  SELECT firm_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- POLITIQUES
-- Profiles
CREATE POLICY "Users can view profiles in their firm" ON public.profiles
  FOR SELECT USING (firm_id = public.get_user_firm_id());

-- Cases
CREATE POLICY "Users can view firm cases" ON public.cases
  FOR SELECT USING (firm_id = public.get_user_firm_id() AND deleted_at IS NULL);

CREATE POLICY "Users can insert cases for their firm" ON public.cases
  FOR INSERT WITH CHECK (firm_id = public.get_user_firm_id());

CREATE POLICY "Users can update firm cases" ON public.cases
  FOR UPDATE USING (firm_id = public.get_user_firm_id());

-- Documents
CREATE POLICY "Users can view firm documents" ON public.documents
  FOR SELECT USING (firm_id = public.get_user_firm_id() AND deleted_at IS NULL);

-- 5. INSCRIPTION AUTOMATIQUE (Trigger Auth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_firm_id UUID;
  v_firm_name TEXT;
BEGIN
  v_firm_name := new.raw_user_meta_data->>'firm_name';
  
  -- Création de la firme si demandée
  IF v_firm_name IS NOT NULL THEN
    INSERT INTO public.firms (name) VALUES (v_firm_name) RETURNING id INTO v_firm_id;
  ELSE
    -- Optionnel: rattacher à une firme par défaut ou rester null
    v_firm_id := NULL;
  END IF;

  INSERT INTO public.profiles (id, firm_id, first_name, last_name, role, avatar_url)
  VALUES (
    new.id, 
    v_firm_id, 
    new.raw_user_meta_data->>'first_name', 
    new.raw_user_meta_data->>'last_name',
    COALESCE(new.raw_user_meta_data->>'role', 'lawyer'),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
