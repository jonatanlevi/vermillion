-- Prize pool configuration — all parameters adjustable without deploy
CREATE TABLE IF NOT EXISTS prize_config (
  id                      SERIAL PRIMARY KEY,
  operational_cost_pct    NUMERIC(5,2) DEFAULT 20.00,  -- % הוצאות תפעול מהכנסות
  company_profit_pct      NUMERIC(5,2) DEFAULT 50.00,  -- % מהרווח הנקי לחברה
  prize_pool_pct          NUMERIC(5,2) DEFAULT 50.00,  -- % מהרווח הנקי לקופת פרסים
  withholding_tax_pct     NUMERIC(5,2) DEFAULT 0.00,   -- % ניכוי מס במקור (לפני תשלום לזוכה)
  income_tax_note         TEXT DEFAULT 'הזוכה אחראי באופן בלעדי לדיווח ותשלום כל מס החל על הפרס לפי חוק, לרבות מס הכנסה.',
  monthly_price_ils       NUMERIC(8,2) DEFAULT 99.00,  -- מחיר מנוי חודשי
  annual_price_ils        NUMERIC(8,2) DEFAULT 749.00, -- מחיר מנוי שנתי
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Single row config
INSERT INTO prize_config (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;

-- RLS: read-only for all, write only for service_role
ALTER TABLE prize_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prize_config_read" ON prize_config FOR SELECT USING (true);
