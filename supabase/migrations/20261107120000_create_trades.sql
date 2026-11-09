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
