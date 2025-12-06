'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

interface ItemAporte {
    ticker: string
    quantidade: number
    preco: number
}

export async function realizarAporte(carteiraId: string, valorTotal: number, itens: ItemAporte[]) {
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    // Verificar permissão na carteira
    const { data: carteira } = await supabase
        .from('carteiras')
        .select('user_id')
        .eq('id', carteiraId)
        .single()

    if (!carteira || carteira.user_id !== user.id) {
        throw new Error('Sem permissão')
    }

    // Iniciar transação (Supabase não tem transaction block via client JS simples, faremos sequencialmente com cuidado)
    // Idealmente seria uma RPC function no banco, mas faremos via código por simplicidade agora.

    try {
        for (const item of itens) {
            // 1. Registrar Transação
            const { error: erroTransacao } = await supabase
                .from('transacoes')
                .insert({
                    carteira_id: carteiraId,
                    ticker: item.ticker,
                    tipo: 'COMPRA_ADICIONAL',
                    quantidade: item.quantidade,
                    preco_unitario: item.preco,
                    valor_total: item.quantidade * item.preco,
                    data: new Date().toISOString()
                })

            if (erroTransacao) throw erroTransacao

            // 2. Buscar Posição Atual para Recalcular PM
            const { data: posicaoAtual } = await supabase
                .from('posicoes')
                .select('quantidade, preco_medio')
                .eq('carteira_id', carteiraId)
                .eq('ticker', item.ticker)
                .single()

            if (posicaoAtual) {
                // Recalcular Preço Médio Ponderado
                const qtdAtual = posicaoAtual.quantidade
                const pmAtual = posicaoAtual.preco_medio

                const novaQtd = qtdAtual + item.quantidade
                const novoPM = ((qtdAtual * pmAtual) + (item.quantidade * item.preco)) / novaQtd

                // Atualizar Posição
                const { error: erroUpdate } = await supabase
                    .from('posicoes')
                    .update({
                        quantidade: novaQtd,
                        preco_medio: novoPM
                    })
                    .eq('carteira_id', carteiraId)
                    .eq('ticker', item.ticker)

                if (erroUpdate) throw erroUpdate
            } else {
                // Se por acaso a posição não existir (novo ativo), cria uma nova
                // (Embora neste fluxo estejamos listando apenas ativos existentes)
                const { error: erroInsert } = await supabase
                    .from('posicoes')
                    .insert({
                        carteira_id: carteiraId,
                        ticker: item.ticker,
                        tipo: 'ACAO', // Default, idealmente buscaria tipo correto
                        quantidade: item.quantidade,
                        preco_medio: item.preco
                    })

                if (erroInsert) throw erroInsert
            }
        }

        // Revalidar cache
        revalidatePath(`/carteiras/${carteiraId}`)

    } catch (error) {
        console.error('Erro ao realizar aporte:', error)
        throw new Error('Falha ao processar aporte')
    }
}
