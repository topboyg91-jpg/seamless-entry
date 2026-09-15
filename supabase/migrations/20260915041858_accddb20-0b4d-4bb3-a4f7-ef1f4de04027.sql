
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  date_label TEXT,
  time_label TEXT,
  venue TEXT,
  cover_url TEXT,
  voting_open BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO anon, authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events open read" ON public.events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "events open write" ON public.events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  number TEXT,
  city TEXT,
  bio TEXT,
  image_url TEXT,
  votes INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.models TO anon, authenticated;
GRANT ALL ON public.models TO service_role;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "models open read" ON public.models FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "models open write" ON public.models FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  amount INT NOT NULL DEFAULT 0,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'paid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.votes TO anon, authenticated;
GRANT ALL ON public.votes TO service_role;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "votes open read" ON public.votes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "votes open write" ON public.votes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.site_content (
  key TEXT NOT NULL PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO anon, authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_content open read" ON public.site_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "site_content open write" ON public.site_content FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO anon, authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact open read" ON public.contact_messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "contact open write" ON public.contact_messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER events_touch BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER models_touch BEFORE UPDATE ON public.models FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.apply_vote() RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.models SET votes = votes + GREATEST(NEW.quantity, 0) WHERE id = NEW.model_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER votes_apply AFTER INSERT ON public.votes FOR EACH ROW EXECUTE FUNCTION public.apply_vote();

INSERT INTO public.site_content (key, value) VALUES
  ('brand_name', 'Westgate Arena'),
  ('hero_kicker', 'LIVE VOTING'),
  ('hero_title', 'Vote for your favourite model'),
  ('hero_subtitle', 'Choose a competition below, meet every contestant, and cast your votes.'),
  ('vote_price', '10'),
  ('footer_tagline', 'Live modelling competitions and audience voting in Nairobi, Kenya.'),
  ('about_intro', 'Westgate Arena is a Nairobi venue built for modelling competitions and pageants. We run the shows, host the finalists and put the result partly in the audience''s hands through live voting.'),
  ('about_second', 'Each season brings new talent from across Kenya. Our aim is simple: a stage that is fair, well produced and open to anyone who wants to be seen.'),
  ('contact_email', 'eventsestis@gmail.com'),
  ('contact_address', 'Nairobi, Kenya');

INSERT INTO public.events (slug, title, description, date_label, time_label, venue, voting_open, sort_order) VALUES
  ('runway-finale', 'Runway Finale 2026', 'The closing night of the season. Three finalists walk one last time and the audience decides who takes the title.', 'Sat 26 Sep', '7:00 PM', 'Westgate Arena, Nairobi', true, 1),
  ('crown-night', 'Crown Night Pageant', 'A full pageant evening of talent, couture and the crowning of the season''s queen, decided in part by your votes.', 'Fri 18 Sep', '6:30 PM', 'Westgate Arena, Nairobi', true, 2);

INSERT INTO public.models (event_id, name, number, city, bio, votes, sort_order)
SELECT id, 'Amara Njeri', '01', 'Nairobi', 'Runway specialist known for sharp editorial posing and a calm, commanding walk.', 414, 1 FROM public.events WHERE slug = 'runway-finale';
INSERT INTO public.models (event_id, name, number, city, bio, votes, sort_order)
SELECT id, 'Kelvin Otieno', '02', 'Kisumu', 'Tailoring-focused model who moved from local showcases to national campaigns in one season.', 388, 2 FROM public.events WHERE slug = 'runway-finale';
INSERT INTO public.models (event_id, name, number, city, bio, votes, sort_order)
SELECT id, 'Zawadi Kimani', '03', 'Mombasa', 'Coastal talent blending traditional textiles with contemporary styling.', 356, 3 FROM public.events WHERE slug = 'runway-finale';
INSERT INTO public.models (event_id, name, number, city, bio, votes, sort_order)
SELECT id, 'Naliaka Wekesa', '01', 'Eldoret', 'Pageant veteran with a background in dance and a strong stage presence.', 302, 1 FROM public.events WHERE slug = 'crown-night';
INSERT INTO public.models (event_id, name, number, city, bio, votes, sort_order)
SELECT id, 'Shani Mwangi', '02', 'Nakuru', 'Couture-focused finalist who designs many of her own competition looks.', 278, 2 FROM public.events WHERE slug = 'crown-night';
INSERT INTO public.models (event_id, name, number, city, bio, votes, sort_order)
SELECT id, 'Tesa Achieng', '03', 'Kisumu', 'Newcomer scouted this season, known for a striking walk and calm confidence.', 241, 3 FROM public.events WHERE slug = 'crown-night';
