-- Combined schema for a single paste into the Supabase SQL editor.
-- Source of truth also exists as individual files in supabase/migrations/.

-- Trade Journal: trades table, constraints, indexes, updated_at trigger, and RLS.
-- Authentication UI is not part of this stage. Policies require auth.uid().
-- Do not add anonymous SELECT/INSERT/UPDATE/DELETE policies.

CREATE TABLE IF NOT EXISTS public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
  trade_date DATE NOT NULL,
  trade_time TIME,
  instrument TEXT NOT NULL,
  direction TEXT NOT NULL,
  entry_price NUMERIC(20, 8) NOT NULL,
  exit_price NUMERIC(20, 8) NOT NULL,
  quantity NUMERIC(20, 8) NOT NULL,
  profit_loss NUMERIC(20, 8) NOT NULL,
  result TEXT NOT NULL,
  screenshot_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT trades_direction_check CHECK (direction IN ('BUY', 'SELL')),
  CONSTRAINT trades_result_check CHECK (result IN ('WIN', 'LOSS', 'BREAKEVEN')),
  CONSTRAINT trades_entry_price_positive CHECK (entry_price > 0),
  CONSTRAINT trades_exit_price_positive CHECK (exit_price > 0),
  CONSTRAINT trades_quantity_positive CHECK (quantity > 0),
  CONSTRAINT trades_instrument_not_empty CHECK (length(btrim(instrument)) > 0)
);

CREATE INDEX IF NOT EXISTS trades_user_id_idx ON public.trades (user_id);
CREATE INDEX IF NOT EXISTS trades_trade_date_idx ON public.trades (trade_date);
CREATE INDEX IF NOT EXISTS trades_instrument_idx ON public.trades (instrument);
CREATE INDEX IF NOT EXISTS trades_created_at_idx ON public.trades (created_at DESC);
CREATE INDEX IF NOT EXISTS trades_user_date_idx ON public.trades (user_id, trade_date DESC);

CREATE OR REPLACE FUNCTION public.set_trades_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trades_set_updated_at ON public.trades;

CREATE TRIGGER trades_set_updated_at
BEFORE UPDATE ON public.trades
FOR EACH ROW
EXECUTE PROCEDURE public.set_trades_updated_at();

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can select own trades" ON public.trades;
DROP POLICY IF EXISTS "Authenticated users can insert own trades" ON public.trades;
DROP POLICY IF EXISTS "Authenticated users can update own trades" ON public.trades;
DROP POLICY IF EXISTS "Authenticated users can delete own trades" ON public.trades;

CREATE POLICY "Authenticated users can select own trades"
ON public.trades
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert own trades"
ON public.trades
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Authenticated users can update own trades"
ON public.trades
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Authenticated users can delete own trades"
ON public.trades
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Private screenshot bucket and authenticated-only storage policies.
-- Files are organized as: {user_id}/{trade_id}/{filename}
-- Do not make this bucket public. Do not add anonymous storage policies.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trade-screenshots',
  'trade-screenshots',
  false,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Authenticated users can upload own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own screenshots" ON storage.objects;

CREATE POLICY "Authenticated users can upload own screenshots"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'trade-screenshots'
  AND split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "Authenticated users can read own screenshots"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'trade-screenshots'
  AND split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "Authenticated users can update own screenshots"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'trade-screenshots'
  AND split_part(name, '/', 1) = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'trade-screenshots'
  AND split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "Authenticated users can delete own screenshots"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'trade-screenshots'
  AND split_part(name, '/', 1) = auth.uid()::text
);
