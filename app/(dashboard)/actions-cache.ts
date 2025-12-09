'use server'

import { createClient } from '@/lib/supabase/server'
import { QuotesService } from '@/lib/services/quotes-service'
import { revalidatePath } from 'next/cache'

/**
 * Verifica se os ativos das carteiras ativas possuem cotação atualizada no dia.
 * Se não tiverem, busca no Yahoo Finance e salva no cache.
 * Deve ser chamado ao carregar o Dashboard.
 */
export async function verificarEAtualizarCache() {
    try {
        const supabase = await createClient()

        // 1. Identificar ativos nas carteiras ATIVAS do usuário
        // Usamos !inner para filtrar apenas onde o join for bem sucedido com carteira ativa
        const { data: posicoes, error } = await supabase
            .from('posicoes')
            .select(`
                ticker,
                carteiras!inner (
                    ativa
                )
            `)
            .eq('carteiras.ativa', true)

        if (error) {
            console.error('[Cache] Erro ao buscar posições:', error)
            return
        }

        if (!posicoes || posicoes.length === 0) return { atualizados: 0 }

        // Remove duplicatas
        const tickers = Array.from(new Set(posicoes.map(p => p.ticker)))

        // 2. Verificar cache existente para esses tickers
        const { data: cache } = await supabase
            .from('cotacoes_cache')
            .select('*')
            .in('ticker', tickers)

        // Lógica de "Hoje": Vamos usar data UTC (ISO slice 0-10) para consistência
        const hojeYMD = new Date().toISOString().split('T')[0]

        const precisaAtualizar = tickers.filter(t => {
            const entry = cache?.find(c => c.ticker === t)

            // Se não existe no cache, precisa atualizar
            if (!entry) return true

            // Se existe, verifica se a data do update é de hoje
            const dataCacheYMD = new Date(entry.updated_at).toISOString().split('T')[0]

            return dataCacheYMD !== hojeYMD
        })

        if (precisaAtualizar.length > 0) {
            console.log(`[Cache] Atualizando ${precisaAtualizar.length} ativos via Yahoo...`)

            // Busca no Yahoo (apenas Yahoo, conforme solicitado)
            const cotacoes = await QuotesService.getQuotesYahoo(precisaAtualizar)

            if (cotacoes.length > 0) {
                const upsertData = cotacoes.map(q => ({
                    ticker: q.symbol.toUpperCase(),
                    preco: q.regularMarketPrice,
                    updated_at: new Date().toISOString(),
                    source: 'YAHOO'
                }))

                const { error: upsertError } = await supabase
                    .from('cotacoes_cache')
                    .upsert(upsertData)

                if (upsertError) {
                    console.error('[Cache] Erro ao salvar:', upsertError)
                } else {
                    console.log(`[Cache] ${cotacoes.length} cotações salvas com sucesso.`)
                    revalidatePath('/') // Força refresh do dashboard para mostrar novos valores
                    return { atualizados: cotacoes.length }
                }
            }
        }

        return { atualizados: 0 }

    } catch (e) {
        console.error('[Cache] Erro geral:', e)
        return { error: 'Falha no sync' }
    }
}
