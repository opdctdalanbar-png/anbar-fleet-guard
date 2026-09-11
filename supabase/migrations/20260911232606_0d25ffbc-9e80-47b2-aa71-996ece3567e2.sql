CREATE TYPE public.app_role AS ENUM ('engineer', 'auditor', 'technician');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  username text NOT NULL UNIQUE,
  name text NOT NULL,
  location text NOT NULL DEFAULT '',
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE public.generators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  specific_location text NOT NULL DEFAULT '',
  capacity text NOT NULL DEFAULT '',
  engine_serial text,
  alternator_serial text,
  status text NOT NULL DEFAULT 'working',
  last_oil_change date,
  last_filter_change date,
  last_battery_change date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generator_id uuid NOT NULL REFERENCES public.generators(id) ON DELETE CASCADE,
  date date NOT NULL,
  tech_id uuid NOT NULL,
  tech_name text NOT NULL DEFAULT '',
  meter_hours text NOT NULL DEFAULT '',
  maintenance_type text NOT NULL DEFAULT 'لا يوجد',
  oil_status text NOT NULL DEFAULT '',
  filter_status text NOT NULL DEFAULT '',
  cooling_status text NOT NULL DEFAULT '',
  battery_status text,
  battery_voltage text NOT NULL DEFAULT '',
  charging_voltage text NOT NULL DEFAULT '',
  oil_changed_on date,
  filter_changed_on date,
  battery_changed_on date,
  notes text NOT NULL DEFAULT '',
  photos text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (generator_id, date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generators TO authenticated;
GRANT ALL ON public.generators TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_engineer_write" ON public.profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'engineer'))
  WITH CHECK (public.has_role(auth.uid(), 'engineer'));

CREATE POLICY "user_roles_select_own_or_engineer" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'engineer'));

CREATE POLICY "generators_select_authenticated" ON public.generators
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "generators_engineer_insert" ON public.generators
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'engineer'));
CREATE POLICY "generators_update" ON public.generators
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'engineer') OR public.has_role(auth.uid(), 'technician'))
  WITH CHECK (public.has_role(auth.uid(), 'engineer') OR public.has_role(auth.uid(), 'technician'));
CREATE POLICY "generators_engineer_delete" ON public.generators
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'engineer'));

CREATE POLICY "reports_select_authenticated" ON public.reports
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "reports_insert_own_or_engineer" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (tech_id = auth.uid() OR public.has_role(auth.uid(), 'engineer'));
CREATE POLICY "reports_update_own_or_engineer" ON public.reports
  FOR UPDATE TO authenticated
  USING (tech_id = auth.uid() OR public.has_role(auth.uid(), 'engineer'))
  WITH CHECK (tech_id = auth.uid() OR public.has_role(auth.uid(), 'engineer'));
CREATE POLICY "reports_delete_engineer" ON public.reports
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'engineer'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.generators;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;

CREATE POLICY "report_photos_authenticated_read" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'report-photos');
CREATE POLICY "report_photos_authenticated_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'report-photos');
CREATE POLICY "report_photos_authenticated_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'report-photos');
