
-- Table to link users to multiple sectors
CREATE TABLE IF NOT EXISTS public.user_sectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sector_id UUID NOT NULL REFERENCES public.sectors(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, sector_id)
);

ALTER TABLE public.user_sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user sectors"
ON public.user_sectors FOR ALL
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view user sectors in same company"
ON public.user_sectors FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- Add preferred_theme to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_theme TEXT DEFAULT 'system';
