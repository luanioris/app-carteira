-- Transações (histórico completo)
CREATE TABLE IF NOT EXISTS transacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  carteira_id UUID NOT NULL REFERENCES carteiras(id) ON DELETE CASCADE,
  ticker VARCHAR(10) NOT NULL,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN (
    'COMPRA_INICIAL', 
    'COMPRA_ADICIONAL', 
    'PROVENTO_REINVESTIDO', 
    'REBALANCEAMENTO_COMPRA',
    'REBALANCEAMENTO_VENDA'
  )),
  quantidade DECIMAL(15,4) NOT NULL,
  preco_unitario DECIMAL(15,2) NOT NULL CHECK (preco_unitario > 0),
  valor_total DECIMAL(15,2) NOT NULL,
  data TIMESTAMPTZ DEFAULT NOW(),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proventos
CREATE TABLE IF NOT EXISTS proventos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  carteira_id UUID NOT NULL REFERENCES carteiras(id) ON DELETE CASCADE,
  ticker VARCHAR(10) NOT NULL,
  valor DECIMAL(15,2) NOT NULL CHECK (valor > 0),
  data TIMESTAMPTZ NOT NULL,
  reinvestido BOOLEAN DEFAULT false,
  transacao_id UUID REFERENCES transacoes(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices (IF NOT EXISTS não funciona para INDEX em todas as versões, então usamos exceção ou apenas ignoramos se falhar, mas o CREATE TABLE IF NOT EXISTS acima já garante a estrutura)
CREATE INDEX IF NOT EXISTS idx_transacoes_carteira_id ON transacoes(carteira_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON transacoes(data DESC);
CREATE INDEX IF NOT EXISTS idx_proventos_carteira_id ON proventos(carteira_id);

-- RLS (Row Level Security)
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proventos ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas para evitar erro de duplicidade
DROP POLICY IF EXISTS "Users can view their transacoes" ON transacoes;
DROP POLICY IF EXISTS "Users can manage their transacoes" ON transacoes;
DROP POLICY IF EXISTS "Users can view their proventos" ON proventos;
DROP POLICY IF EXISTS "Users can manage their proventos" ON proventos;

-- Políticas para Transações
CREATE POLICY "Users can view their transacoes"
  ON transacoes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM carteiras
    WHERE carteiras.id = transacoes.carteira_id
    AND carteiras.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their transacoes"
  ON transacoes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM carteiras
    WHERE carteiras.id = transacoes.carteira_id
    AND carteiras.user_id = auth.uid()
  ));

-- Políticas para Proventos
CREATE POLICY "Users can view their proventos"
  ON proventos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM carteiras
    WHERE carteiras.id = proventos.carteira_id
    AND carteiras.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their proventos"
  ON proventos FOR ALL
  USING (EXISTS (
    SELECT 1 FROM carteiras
    WHERE carteiras.id = proventos.carteira_id
    AND carteiras.user_id = auth.uid()
  ));
