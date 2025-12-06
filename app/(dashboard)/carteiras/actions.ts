'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Perfil, CalculoDistribuicao } from '@/types/carteira'
import { getQuotes } from '@/lib/api/brapi'

/**
 * Busca cotações de forma segura no servidor usando o QuotesService (Brapi + Yahoo)
 */
export async function buscarCotacoesAction(tickers: string[]) {
    try {
        const quotes = await getQuotes(tickers)
        // Serializar para garantir que seja um objeto plano (Next.js server actions)
        return quotes.map(q => ({
            symbol: q.symbol,
            regularMarketPrice: q.regularMarketPrice
        }))
    } catch (error) {
        console.error('Erro ao buscar cotações na action:', error)
        throw new Error('Falha ao buscar cotações')
    }
}

/**
 * Busca todos os perfis disponíveis
 */
export async function getPerfis(): Promise<Perfil[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .order('nome', { ascending: true })

    if (error) {
        console.error('Erro ao buscar perfis:', error)
        throw new Error('Não foi possível carregar os perfis')
    }

    return data || []
}

/**
 * Busca um perfil específico por ID
 */
export async function getPerfil(id: string): Promise<Perfil | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Erro ao buscar perfil:', error)
        return null
    }

    return data
}

/**
 * Cria uma nova carteira com todas as posições iniciais
 */
export async function criarCarteira(
    nome: string,
    perfilId: string,
    valorInicial: number,
    distribuicao: CalculoDistribuicao[]
) {
    const supabase = await createClient()

    // 1. Buscar usuário atual
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Usuário não autenticado')
    }

    // 2. Criar a carteira
    const { data: carteira, error: carteiraError } = await supabase
        .from('carteiras')
        .insert({
            user_id: user.id,
            nome,
            perfil_id: perfilId,
            valor_inicial: valorInicial,
        })
        .select()
        .single()

    if (carteiraError) {
        console.error('Erro ao criar carteira:', carteiraError)
        throw new Error('Não foi possível criar a carteira')
    }

    // 3. Criar as posições iniciais
    const posicoes = distribuicao
        .filter((item) => item.quantidade_calculada > 0)
        .map((item) => ({
            carteira_id: carteira.id,
            ticker: item.ticker,
            tipo: item.tipo,
            quantidade: item.quantidade_calculada,
            preco_medio: item.preco_unitario,
        }))

    if (posicoes.length > 0) {
        const { error: posicoesError } = await supabase
            .from('posicoes')
            .insert(posicoes)

        if (posicoesError) {
            console.error('Erro ao criar posições:', posicoesError)
            // Tentar deletar a carteira criada
            await supabase.from('carteiras').delete().eq('id', carteira.id)
            throw new Error('Não foi possível criar as posições da carteira')
        }
    }

    // 4. Criar as transações iniciais
    const transacoes = distribuicao
        .filter((item) => item.quantidade_calculada > 0)
        .map((item) => ({
            carteira_id: carteira.id,
            ticker: item.ticker,
            tipo: 'COMPRA_INICIAL' as const,
            quantidade: item.quantidade_calculada,
            preco_unitario: item.preco_unitario,
            valor_total: item.valor_investido,
        }))

    if (transacoes.length > 0) {
        const { error: transacoesError } = await supabase
            .from('transacoes')
            .insert(transacoes)

        if (transacoesError) {
            console.error('Erro ao criar transações:', transacoesError)
            // Não vamos falhar aqui, apenas logar o erro
        }
    }


    revalidatePath('/carteiras')
    redirect('/carteiras')
}

/**
 * Deleta uma carteira e todas as suas posições e transações
 */
export async function deletarCarteira(carteiraId: string) {
    const supabase = await createClient()

    // Verificar se a carteira pertence ao usuário
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Usuário não autenticado')
    }

    const { data: carteira } = await supabase
        .from('carteiras')
        .select('user_id')
        .eq('id', carteiraId)
        .single()

    if (!carteira || carteira.user_id !== user.id) {
        throw new Error('Carteira não encontrada ou sem permissão')
    }

    // 1. Remover referências em outras carteiras (desconectar histórico)

    // Se esta carteira foi origem de outras (é a "mãe"), limpar a referência nas filhas
    await supabase
        .from('carteiras')
        .update({ carteira_origem_id: null })
        .eq('carteira_origem_id', carteiraId)

    // Se esta carteira foi destino de uma migração (é a "filha"), limpar a referência na mãe
    await supabase
        .from('carteiras')
        .update({ migrada_para_id: null })
        .eq('migrada_para_id', carteiraId)

    // 2. Deletar carteira (cascade vai deletar posições e transações)
    const { error } = await supabase
        .from('carteiras')
        .delete()
        .eq('id', carteiraId)

    if (error) {
        console.error('Erro ao deletar carteira:', error)
        throw new Error('Não foi possível deletar a carteira. Verifique se existem dependências manuais.')
    }

    revalidatePath('/carteiras')
    redirect('/carteiras')
}

/**
 * Atualiza manualmente o preço ATUAL de um ativo (para ativos sem API)
 * NÃO altera o preço médio de compra!
 */
export async function atualizarPrecoManual(carteiraId: string, ticker: string, novoPreco: number) {
    'use server'
    const supabase = await createClient()

    // Verificar permissão
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    const { data: carteira } = await supabase
        .from('carteiras')
        .select('user_id')
        .eq('id', carteiraId)
        .single()

    if (!carteira || carteira.user_id !== user.id) {
        throw new Error('Sem permissão')
    }

    // Salvar cotação manual (upsert)
    const { error } = await supabase
        .from('cotacoes_manuais')
        .upsert({
            carteira_id: carteiraId,
            ticker: ticker,
            preco_atual: novoPreco,
            data_atualizacao: new Date().toISOString()
        }, {
            onConflict: 'carteira_id,ticker'
        })

    if (error) {
        console.error('Erro ao atualizar cotação:', error)
        throw new Error('Não foi possível atualizar a cotação')
    }

    revalidatePath(`/carteiras/${carteiraId}`)
}

/**
 * Duplica uma carteira existente para fins de teste
 */
export async function duplicarCarteira(carteiraId: string, novoNome?: string) {
    const supabase = await createClient()

    // 1. Verificar permissão e buscar dados originais
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    const { data: carteiraOriginal } = await supabase
        .from('carteiras')
        .select(`
            *,
            posicoes (*),
            transacoes (*),
            cotacoes_manuais (*)
        `)
        .eq('id', carteiraId)
        .single()

    if (!carteiraOriginal || carteiraOriginal.user_id !== user.id) {
        throw new Error('Carteira não encontrada ou sem permissão')
    }

    // 2. Criar nova carteira
    const nomeCarteira = novoNome || `Cópia de ${carteiraOriginal.nome}`

    const { data: novaCarteira, error: erroCarteira } = await supabase
        .from('carteiras')
        .insert({
            user_id: user.id,
            nome: nomeCarteira,
            perfil_id: carteiraOriginal.perfil_id,
            valor_inicial: carteiraOriginal.valor_inicial
        })
        .select()
        .single()

    if (erroCarteira) throw new Error('Erro ao criar nova carteira')

    // 3. Copiar posições
    if (carteiraOriginal.posicoes?.length > 0) {
        const novasPosicoes = carteiraOriginal.posicoes.map((p: any) => ({
            carteira_id: novaCarteira.id,
            ticker: p.ticker,
            tipo: p.tipo,
            quantidade: p.quantidade,
            preco_medio: p.preco_medio
        }))
        await supabase.from('posicoes').insert(novasPosicoes)
    }

    // 4. Copiar transações
    if (carteiraOriginal.transacoes?.length > 0) {
        const novasTransacoes = carteiraOriginal.transacoes.map((t: any) => ({
            carteira_id: novaCarteira.id,
            ticker: t.ticker,
            tipo: t.tipo,
            quantidade: t.quantidade,
            preco_unitario: t.preco_unitario,
            valor_total: t.valor_total,
            data: t.data
        }))
        await supabase.from('transacoes').insert(novasTransacoes)
    }

    // 5. Copiar cotações manuais
    if (carteiraOriginal.cotacoes_manuais?.length > 0) {
        const novasCotacoes = carteiraOriginal.cotacoes_manuais.map((c: any) => ({
            carteira_id: novaCarteira.id,
            ticker: c.ticker,
            preco_atual: c.preco_atual,
            data_atualizacao: c.data_atualizacao
        }))
        await supabase.from('cotacoes_manuais').insert(novasCotacoes)
    }

    revalidatePath('/carteiras')
    redirect(`/carteiras/${novaCarteira.id}`)
}
