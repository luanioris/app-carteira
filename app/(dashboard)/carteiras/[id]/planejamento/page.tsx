import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlanejamentoDashboard } from './planejamento-dashboard'

export default async function PlanejamentoPage(props: { params: Promise<{ id: string }> }) {
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

    // Buscar meta existente
    const { data: meta } = await supabase
        .from('metas')
        .select('*')
        .eq('carteira_id', params.id)
        .single()

    // Buscar valor atual da carteira (soma das posições)
    const { data: posicoes } = await supabase
        .from('posicoes')
        .select('ticker, quantidade, preco_medio') // Idealmente preco_atual, mas vamos usar medio como base se não tiver cotação
        .eq('carteira_id', params.id)

    // Buscar cotações manuais para melhor precisão
    const { data: cotacoesManuais } = await supabase
        .from('cotacoes_manuais')
        .select('ticker, preco_atual')
        .eq('carteira_id', params.id)

    let valorAtual = 0
    if (posicoes) {
        const cotacoesMap = cotacoesManuais?.reduce((acc, curr) => {
            acc[curr.ticker] = curr.preco_atual
            return acc
        }, {} as Record<string, number>) || {}

        valorAtual = posicoes.reduce((sum, p) => {
            const preco = cotacoesMap[p.ticker] || p.preco_medio
            return sum + (p.quantidade * preco)
        }, 0)
    }

    return (
        <PlanejamentoDashboard
            carteira={carteira}
            metaInicial={meta}
            valorAtual={valorAtual}
        />
    )
}
