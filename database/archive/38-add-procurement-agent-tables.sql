-- Migration 38: AI Procurement Agent Tables
-- Adds ProcurementRequest, RfqSupplierCandidate, RfqCommunication, QuotationResponse

-- Enums
DO $$ BEGIN
  CREATE TYPE "ProcurementStatus" AS ENUM ('draft', 'searching', 'rfq_sent', 'evaluating', 'awarded', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CandidateSource" AS ENUM ('internal', 'web');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CommDirection" AS ENUM ('outbound', 'inbound');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CommChannel" AS ENUM ('email', 'whatsapp');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ProcurementRequest
CREATE TABLE IF NOT EXISTS procurement_requests (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  raw_prompt        TEXT NOT NULL,
  product           VARCHAR(255) NOT NULL,
  location          VARCHAR(255),
  constraints       JSONB DEFAULT '{}',
  status            "ProcurementStatus" NOT NULL DEFAULT 'draft',
  rfq_subject       VARCHAR(500),
  rfq_body          TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_procurement_requests_org ON procurement_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_procurement_requests_user ON procurement_requests(created_by_id);
CREATE INDEX IF NOT EXISTS idx_procurement_requests_status ON procurement_requests(status);

-- RfqSupplierCandidate
CREATE TABLE IF NOT EXISTS rfq_supplier_candidates (
  id                       TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  procurement_request_id   TEXT NOT NULL REFERENCES procurement_requests(id) ON DELETE CASCADE,
  organization_id          UUID REFERENCES organizations(id) ON DELETE SET NULL,
  company_name             VARCHAR(255) NOT NULL,
  contact_email            VARCHAR(255),
  contact_phone            VARCHAR(100),
  contact_whatsapp         VARCHAR(100),
  website                  VARCHAR(500),
  address                  VARCHAR(500),
  source                   "CandidateSource" NOT NULL DEFAULT 'internal',
  rank_score               FLOAT NOT NULL DEFAULT 0,
  is_selected              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rfq_candidates_request ON rfq_supplier_candidates(procurement_request_id);
CREATE INDEX IF NOT EXISTS idx_rfq_candidates_org ON rfq_supplier_candidates(organization_id);

-- RfqCommunication
CREATE TABLE IF NOT EXISTS rfq_communications (
  id                       TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  procurement_request_id   TEXT NOT NULL REFERENCES procurement_requests(id) ON DELETE CASCADE,
  supplier_candidate_id    TEXT NOT NULL REFERENCES rfq_supplier_candidates(id) ON DELETE CASCADE,
  direction                "CommDirection" NOT NULL DEFAULT 'outbound',
  channel                  "CommChannel" NOT NULL,
  to_address               VARCHAR(255),
  subject                  VARCHAR(500),
  body                     TEXT NOT NULL,
  external_message_id      VARCHAR(500),
  delivery_status          VARCHAR(50),
  raw_reply                TEXT,
  sent_at                  TIMESTAMPTZ,
  received_at              TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rfq_comms_request ON rfq_communications(procurement_request_id);
CREATE INDEX IF NOT EXISTS idx_rfq_comms_candidate ON rfq_communications(supplier_candidate_id);
CREATE INDEX IF NOT EXISTS idx_rfq_comms_channel ON rfq_communications(channel);

-- QuotationResponse
CREATE TABLE IF NOT EXISTS quotation_responses (
  id                       TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  procurement_request_id   TEXT NOT NULL REFERENCES procurement_requests(id) ON DELETE CASCADE,
  supplier_candidate_id    TEXT NOT NULL REFERENCES rfq_supplier_candidates(id) ON DELETE CASCADE,
  unit_price               DECIMAL(12, 2),
  currency                 VARCHAR(10),
  unit                     VARCHAR(50),
  availability             VARCHAR(255),
  delivery_days            INT,
  delivery_terms           TEXT,
  payment_terms            TEXT,
  valid_until              TIMESTAMPTZ,
  notes                    TEXT,
  raw_text                 TEXT,
  confidence               FLOAT,
  is_awarded               BOOLEAN NOT NULL DEFAULT FALSE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotation_responses_request ON quotation_responses(procurement_request_id);
CREATE INDEX IF NOT EXISTS idx_quotation_responses_candidate ON quotation_responses(supplier_candidate_id);

-- Auto-update updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_procurement_requests_updated_at
    BEFORE UPDATE ON procurement_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_rfq_communications_updated_at
    BEFORE UPDATE ON rfq_communications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_quotation_responses_updated_at
    BEFORE UPDATE ON quotation_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
