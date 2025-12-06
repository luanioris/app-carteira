-- ============================================
-- MIGRATION: Suporte a Rebalanceamento/Migração de Carteiras
-- Data: 2025-12-03
-- ============================================

-- 1. Adicionar campos de controle na tabela carteiras
ALTER TABLE carteiras 
ADD COLUMN IF NOT EXISTS carteira_origem_id UUID REFERENCES carteiras(id),
ADD COLUMN IF NOT EXISTS migrada_para_id UUID REFERENCES carteiras(id),
ADD COLUMN IF NOT EXISTS data_encerramento TIMESTAMPTZ;

-- 2. Adicionar campo para congelar preço na tabela posicoes
-- Quando uma carteira é encerrada, salvamos o preço final para histórico
ALTER TABLE posicoes
ADD COLUMN IF NOT EXISTS preco_fechamento DECIMAL(15,2);

-- 3. Criar índice para performance em consultas de carteiras ativas
CREATE INDEX IF NOT EXISTS idx_carteiras_ativa ON carteiras(ativa);

-- 4. Atualizar constraint de tipos de transação para incluir transferências
ALTER TABLE transacoes DROP CONSTRAINT IF EXISTS transacoes_tipo_check;
ALTER TABLE transacoes ADD CONSTRAINT transacoes_tipo_check CHECK (tipo IN (
    'COMPRA_INICIAL', 
    'COMPRA_ADICIONAL', 
    'PROVENTO_REINVESTIDO', 
    'REBALANCEAMENTO_COMPRA',
    'REBALANCEAMENTO_VENDA',
    'TRANSFERENCIA_ENTRADA',
    'TRANSFERENCIA_SAIDA'
));

-- ============================================
-- INSTRUÇÕES:
-- 1. Acesse https://supabase.com/dashboard
-- 2. Vá em SQL Editor
-- 3. Cole e execute este script
-- ============================================
