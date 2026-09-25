ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS transaction_id text;
ALTER TABLE public.votes ALTER COLUMN status SET DEFAULT 'pending';
DROP TRIGGER IF EXISTS votes_apply ON public.votes;
CREATE OR REPLACE FUNCTION public.apply_vote() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'paid') THEN
    UPDATE public.models SET votes = votes + GREATEST(NEW.quantity, 0) WHERE id = NEW.model_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER votes_apply AFTER INSERT OR UPDATE OF status ON public.votes FOR EACH ROW EXECUTE FUNCTION public.apply_vote();