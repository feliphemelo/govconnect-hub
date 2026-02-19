-- Create whatsapp_instances table
CREATE TABLE IF NOT EXISTS whatsapp_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    instance_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    api_key TEXT,
    webhook_url TEXT,
    status VARCHAR(50) DEFAULT 'disconnected',
    is_active BOOLEAN DEFAULT true,
    qr_code TEXT,
    session_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, phone_number)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_company_id ON whatsapp_instances(company_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON whatsapp_instances(status);

-- Add comment
COMMENT ON TABLE whatsapp_instances IS 'Stores WhatsApp instance configurations for each company';
