// Tipos do banco de dados
export type Perfil = {
  id: string
  nome: string
  percentual_ivvb: number
  percentual_lftb: number
  percentual_acoes: number
  created_at: string
}

export type Carteira = {
  id: string
  user_id: string
  nome: string
  perfil_id: string
  valor_inicial: number
  data_criacao: string
  data_ultimo_rebalanceamento: string | null
  ativa: boolean
  notas: string | null
  created_at: string
  updated_at: string
}

export type TipoAtivo = 'ETF_INTER' | 'ETF_RF' | 'ACAO'

export type Posicao = {
  id: string
  carteira_id: string
  ticker: string
  tipo: TipoAtivo
  quantidade: number
  preco_medio: number
  created_at: string
  updated_at: string
}

export type TipoTransacao =
  | 'COMPRA_INICIAL'
  | 'COMPRA_ADICIONAL'
  | 'PROVENTO_REINVESTIDO'
  | 'REBALANCEAMENTO_COMPRA'
  | 'REBALANCEAMENTO_VENDA'

export type Transacao = {
  id: string
  carteira_id: string
  ticker: string
  tipo: TipoTransacao
  quantidade: number
  preco_unitario: number
  valor_total: number
  data: string
  observacoes: string | null
  created_at: string
}

// Tipos para o formulário de criação
export type NovaCarteiraStep1 = {
  nome: string
  perfil_id: string
  valor_inicial: number
}

export type NovaCarteiraStep2 = {
  etf_internacional: string // Ticker do ETF internacional (ex: IVVB11)
  etf_renda_fixa: string // Ticker do ETF renda fixa (ex: LFTB11)
  acoes_selecionadas: string[] // Lista de tickers de ações
}

export type NovaCarteiraStep3 = {
  precos: Record<string, number> // ticker -> preço unitário
}

export type CalculoDistribuicao = {
  ticker: string
  tipo: TipoAtivo
  percentual_categoria: number
  valor_destinado: number
  preco_unitario: number
  quantidade_calculada: number
  valor_investido: number
}
