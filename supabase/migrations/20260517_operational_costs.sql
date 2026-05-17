-- מעקב עלויות תפעול — אוטומטי (Groq) + ידני (Vercel, Supabase, אחר)
CREATE TABLE IF NOT EXISTS operational_costs (
  id           BIGSERIAL PRIMARY KEY,
  month        CHAR(7) NOT NULL,          -- 'YYYY-MM'
  week         CHAR(10),                  -- 'YYYY-WXX' (ISO week, optional)
  category     TEXT NOT NULL,             -- 'groq_api' | 'vercel' | 'supabase' | 'other'
  amount_ils   NUMERIC(10,4) NOT NULL,    -- עלות בשקלים
  description  TEXT,
  auto_tracked BOOLEAN DEFAULT FALSE,     -- true = הוזן אוטומטית על ידי המערכת
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_costs_month ON operational_costs(month);

-- RLS: רק service_role כותב; אין קריאה ציבורית
ALTER TABLE operational_costs ENABLE ROW LEVEL SECURITY;
