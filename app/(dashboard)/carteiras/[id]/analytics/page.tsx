import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AnalyticsDashboard } from './analytics-dashboard'
import { getQuotes } from '@/lib/api/brapi'

export default async function AnalyticsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Buscar carteira
    const { data: carteira } = await supabase
        .from('carteiras')
        .select('*, perfis(nome)')
        .eq('id', params.id)
        .single()

    if (!carteira || carteira.user_id !== user.id) {
        redirect('/carteiras')
    }

    // Buscar transações (para calcular evolução)
    const { data: transacoes } = await supabase
        .from('transacoes')
        .select('*')
        .eq('carteira_id', params.id)
        .order('data', { ascending: true })

    // Buscar posições atuais
    const { data: posicoes } = await supabase
        .from('posicoes')
        .select('*')
        .eq('carteira_id', params.id)

    // Buscar proventos
    const { data: proventos } = await supabase
        .from('proventos')
        .select('*')
        .eq('carteira_id', params.id)

    // Buscar cotações atuais (se carteira ativa)
    const carteiraAtiva = carteira.ativa !== false
    let cotacoesAtuais: Record<string, number> = {}
    let benchmarks = {
        ibov: 0,
        cdi: 13.65 // Taxa DI atual aproximada (anual)
    }

    if (carteiraAtiva) {
        const tickers = posicoes?.map(p => p.ticker) || []
        // Adicionar IBOV na busca
        const tickersComBenchmark = [...tickers, '^BVSP']

        // Buscar da API
        try {
            const quotes = await getQuotes(tickersComBenchmark)
            quotes.forEach(q => {
                if (q.symbol === '^BVSP') {
                    benchmarks.ibov = q.regularMarketChangePercent || 0 // Variação do dia/período
                } else {
                    cotacoesAtuais[q.symbol] = q.regularMarketPrice
                }
            })
        } catch (error) {
            console.error('Erro ao buscar cotações:', error)
        }

        // Buscar cotações manuais (sobrescreve API)
        const { data: cotacoesManuais } = await supabase
            .from('cotacoes_manuais')
            .select('ticker, preco_atual')
            .eq('carteira_id', params.id)

        cotacoesManuais?.forEach(cm => {
            cotacoesAtuais[cm.ticker] = cm.preco_atual
        })
    }

    // Adicionar preço atual às posições
    const posicoesComPreco = posicoes?.map(p => ({
        ...p,
        preco_atual: carteiraAtiva
            ? (cotacoesAtuais[p.ticker] || p.preco_medio)
            : (p.preco_fechamento || p.preco_medio)
    })) || []

    return (
        <AnalyticsDashboard
            carteira={carteira}
            transacoes={transacoes || []}
            posicoes={posicoesComPreco}
            proventos={proventos || []}
            benchmarks={benchmarks}
        />
    )
}
