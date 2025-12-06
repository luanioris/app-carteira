import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { RebalancearForm } from './rebalancear-form'
import { getQuotes } from '@/lib/api/brapi'

export default async function RebalancearPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient()

    // Buscar carteira atual
    const { data: carteira } = await supabase
        .from('carteiras')
        .select(`
            *,
            perfis (*),
            posicoes (*)
        `)
        .eq('id', params.id)
        .single()

    if (!carteira) notFound()

    // Buscar perfis disponíveis
    const { data: perfis } = await supabase
        .from('perfis')
        .select('*')
        .order('percentual_acoes', { ascending: true })

    // Buscar cotações atuais para pré-popular
    const tickers = carteira.posicoes.map((p: any) => p.ticker)
    let cotacoesAtuais: Record<string, number> = {}

    try {
        if (tickers.length > 0) {
            const quotes = await getQuotes(tickers)
            quotes.forEach(q => {
                cotacoesAtuais[q.symbol] = q.regularMarketPrice
            })
        }
    } catch (e) {
        console.error('Erro ao buscar cotações iniciais', e)
    }

    return (
        <div className="container mx-auto py-6 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Rebalanceamento Anual</h1>
                <p className="text-muted-foreground">
                    Migre sua carteira para uma nova versão baseada em seu novo estudo.
                </p>
            </div>

            <RebalancearForm
                carteiraAtual={carteira}
                perfis={perfis || []}
                cotacoesIniciais={cotacoesAtuais}
            />
        </div>
    )
}
