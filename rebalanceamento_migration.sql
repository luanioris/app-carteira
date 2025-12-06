-- Adicionar campos para controle de migração/rebalanceamento na tabela carteiras
ALTER TABLE carteiras 
ADD COLUMN IF NOT EXISTS carteira_origem_id UUID REFERENCES carteiras(id),
ADD COLUMN IF NOT EXISTS migrada_para_id UUID REFERENCES carteiras(id),
ADD COLUMN IF NOT EXISTS data_encerramento TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ativa BOOLEAN DEFAULT true;

-- Adicionar campo para congelar preço na tabela posicoes
ALTER TABLE posicoes
ADD COLUMN IF NOT EXISTS preco_fechamento DECIMAL(15,2);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_carteiras_ativa ON carteiras(ativa);
