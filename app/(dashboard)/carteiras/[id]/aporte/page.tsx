import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { NovoAporteForm } from './novo-aporte-form'
import { getQuotes } from '@/lib/api/brapi'

export default async function NovoAportePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient()

    // Buscar carteira e posições
    const { data: carteira } = await supabase
        .from('carteiras')
        .select(`
            *,
            posicoes (
                ticker,
                tipo,
                quantidade,
                preco_medio
            )
        `)
        .eq('id', params.id)
        .single()

    if (!carteira) {
        notFound()
    }

    // Buscar cotações atuais para sugerir preço de compra
    const tickers = carteira.posicoes.map((p: any) => p.ticker)
    let cotacoesAtuais: Record<string, number> = {}

    try {
        const quotes = await getQuotes(tickers)
        quotes.forEach(q => {
            cotacoesAtuais[q.symbol] = q.regularMarketPrice
        })
    } catch (error) {
        console.error('Erro ao buscar cotações:', error)
    }

    // Buscar cotações manuais também
    const { data: cotacoesManuais } = await supabase
        .from('cotacoes_manuais')
        .select('ticker, preco_atual')
        .eq('carteira_id', params.id)

    cotacoesManuais?.forEach(cm => {
        cotacoesAtuais[cm.ticker] = cm.preco_atual
    })

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Novo Aporte</h1>
                <p className="text-muted-foreground">
                    Adicione novos recursos à carteira {carteira.nome}
                </p>
            </div>

            <NovoAporteForm
                carteira={carteira}
                cotacoesAtuais={cotacoesAtuais}
            />
        </div>
    )
}
