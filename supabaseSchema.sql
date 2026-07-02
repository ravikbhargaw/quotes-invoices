-- Create Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    company TEXT,
    gstin TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS) if desired, or keep it open for simple anon access
-- ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read/write access" ON public.clients FOR ALL USING (true);

-- Create Quotes Table
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_number TEXT NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    gstin TEXT,
    date TEXT NOT NULL,
    validity TEXT NOT NULL,
    reference TEXT,
    status TEXT NOT NULL DEFAULT 'Draft', -- 'Draft', 'Sent', 'Approved', 'Declined'
    format TEXT NOT NULL DEFAULT 'proposal', -- 'proposal', 'estimate'
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    payment_schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
    timeline_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes JSONB NOT NULL DEFAULT '[]'::jsonb,
    terms JSONB NOT NULL DEFAULT '[]'::jsonb,
    adjustment NUMERIC DEFAULT 0,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    tax NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS) if desired
-- ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read/write access" ON public.quotes FOR ALL USING (true);

-- Create a helper function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to update updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
