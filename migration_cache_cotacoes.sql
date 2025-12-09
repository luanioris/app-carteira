-- Tabela de Cache de Cotações (Global para todos os usuários)
-- Objetivo: Evitar chamadas excessivas à API externa e permitir cálculo de valor atual.

CREATE TABLE IF NOT EXISTS cotacoes_cache (
  ticker VARCHAR(20) PRIMARY KEY,
  preco DECIMAL(15,2) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  source VARCHAR(50) DEFAULT 'YAHOO'
);

-- Ativar RLS
ALTER TABLE cotacoes_cache ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem para evitar conflito
DROP POLICY IF EXISTS "Authenticated users can read cache" ON cotacoes_cache;
DROP POLICY IF EXISTS "Authenticated users can update cache" ON cotacoes_cache;

-- Política de Leitura: Qualquer usuário autenticado pode ler o cache
CREATE POLICY "Authenticated users can read cache"
ON cotacoes_cache FOR SELECT
TO authenticated
USING (true);

-- Política de Escrita: Qualquer usuário autenticado pode atualizar o cache
-- Isso permite que o primeiro usuário do dia atualize para todos
CREATE POLICY "Authenticated users can update cache"
ON cotacoes_cache FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
