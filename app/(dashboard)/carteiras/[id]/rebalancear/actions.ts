'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

interface ItemNovo {
    ticker: string
    tipo: string
    percentual_alvo: number // Apenas para referência, o cálculo real é feito antes
    quantidade_calculada: number
    preco_estimado: number
}

interface DadosMigracao {
    carteiraAntigaId: string
    novoAporte: number
    novoPerfilId: string
    novosItens: ItemNovo[]
    cotacoesAtuais: Record<string, number>
}

export async function migrarCarteira(dados: DadosMigracao) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    // 1. Buscar dados da carteira antiga
    const { data: carteiraAntiga } = await supabase
        .from('carteiras')
        .select('*, posicoes(*)')
        .eq('id', dados.carteiraAntigaId)
        .single()

    if (!carteiraAntiga || carteiraAntiga.user_id !== user.id) {
        throw new Error('Carteira não encontrada ou sem permissão')
    }

    // 2. Criar Nova Carteira
    const novoNome = `${carteiraAntiga.nome} (v${new Date().getFullYear()})`

    const { data: novaCarteira, error: erroCriacao } = await supabase
        .from('carteiras')
        .insert({
            user_id: user.id,
            nome: novoNome,
            perfil_id: dados.novoPerfilId,
            valor_inicial: carteiraAntiga.valor_inicial + dados.novoAporte,
            carteira_origem_id: carteiraAntiga.id,
            ativa: true
        })
        .select()
        .single()

    if (erroCriacao) throw new Error(`Erro ao criar nova carteira: ${erroCriacao.message}`)

    // 3. Processar Ativos e Posições
    const posicoesAntigas = carteiraAntiga.posicoes
    const transacoes: any[] = []

    // A. Registrar Aporte Inicial
    if (dados.novoAporte > 0) {
        transacoes.push({
            carteira_id: novaCarteira.id,
            ticker: 'CAIXA',
            tipo: 'COMPRA_ADICIONAL',
            quantidade: 1,
            preco_unitario: dados.novoAporte,
            valor_total: dados.novoAporte,
            observacoes: 'Aporte realizado durante migração de carteira'
        })
    }

    // B. Criar novas posições e registrar transações detalhadas
    for (const item of dados.novosItens) {
        const posicaoAntiga = posicoesAntigas.find((p: any) => p.ticker === item.ticker)

        // Validação de segurança para números
        const precoEstimado = isNaN(item.preco_estimado) ? 0 : item.preco_estimado
        const qtdCalculada = isNaN(item.quantidade_calculada) ? 0 : item.quantidade_calculada

        let precoMedioFinal = precoEstimado
        let quantidadeTransferida = 0
        let quantidadeComprada = 0
        let quantidadeVendida = 0

        if (posicaoAntiga) {
            // Ativo que já existia na carteira anterior
            const qtdAntiga = posicaoAntiga.quantidade

            if (qtdCalculada > qtdAntiga) {
                // Caso 1: Manteve tudo + comprou mais
                quantidadeTransferida = qtdAntiga
                quantidadeComprada = qtdCalculada - qtdAntiga

                // Calcular novo PM
                const valorAntigo = qtdAntiga * posicaoAntiga.preco_medio
                const valorNovo = quantidadeComprada * precoEstimado
                precoMedioFinal = (valorAntigo + valorNovo) / qtdCalculada
            } else if (qtdCalculada < qtdAntiga) {
                // Caso 2: Vendeu parte
                quantidadeTransferida = qtdCalculada
                quantidadeVendida = qtdAntiga - qtdCalculada

                // PM mantém o da carteira anterior
                precoMedioFinal = posicaoAntiga.preco_medio
            } else {
                // Caso 3: Manteve exatamente a mesma quantidade
                quantidadeTransferida = qtdAntiga
                precoMedioFinal = posicaoAntiga.preco_medio
            }
        } else {
            // Ativo novo (não existia na carteira anterior)
            quantidadeComprada = qtdCalculada
            precoMedioFinal = precoEstimado
        }

        // Garantir que não seja NaN
        if (isNaN(precoMedioFinal)) precoMedioFinal = 0

        // Inserir Posição
        const { error: erroPosicao } = await supabase.from('posicoes').insert({
            carteira_id: novaCarteira.id,
            ticker: item.ticker,
            tipo: item.tipo,
            quantidade: qtdCalculada,
            preco_medio: precoMedioFinal
        })

        if (erroPosicao) {
            console.error(`Erro ao criar posição ${item.ticker}:`, erroPosicao)
        }

        // Registrar Transações Detalhadas

        // 1. Transferência (se veio da carteira anterior)
        if (quantidadeTransferida > 0 && posicaoAntiga) {
            transacoes.push({
                carteira_id: novaCarteira.id,
                ticker: item.ticker,
                tipo: 'TRANSFERENCIA_ENTRADA',
                quantidade: quantidadeTransferida,
                preco_unitario: posicaoAntiga.preco_medio,
                valor_total: quantidadeTransferida * posicaoAntiga.preco_medio,
                observacoes: `Transferido ${quantidadeTransferida} un. da carteira anterior (PM: R$${posicaoAntiga.preco_medio.toFixed(2)})`
            })
        }

        // 2. Compra Adicional (se comprou mais)
        if (quantidadeComprada > 0) {
            const tipoCompra = posicaoAntiga ? 'REBALANCEAMENTO_COMPRA' : 'COMPRA_INICIAL'
            const observacao = posicaoAntiga
                ? `Compra adicional de ${quantidadeComprada} un. a R$${precoEstimado.toFixed(2)} (Novo PM: R$${precoMedioFinal.toFixed(2)})`
                : `Compra inicial de ${quantidadeComprada} un. a R$${precoEstimado.toFixed(2)}`

            transacoes.push({
                carteira_id: novaCarteira.id,
                ticker: item.ticker,
                tipo: tipoCompra,
                quantidade: quantidadeComprada,
                preco_unitario: precoEstimado,
                valor_total: quantidadeComprada * precoEstimado,
                observacoes: observacao
            })
        }

        // 3. Venda Parcial (se vendeu parte)
        if (quantidadeVendida > 0) {
            transacoes.push({
                carteira_id: novaCarteira.id,
                ticker: item.ticker,
                tipo: 'REBALANCEAMENTO_VENDA',
                quantidade: quantidadeVendida,
                preco_unitario: precoEstimado,
                valor_total: quantidadeVendida * precoEstimado,
                observacoes: `Venda de ${quantidadeVendida} un. a R$${precoEstimado.toFixed(2)} (redução de posição)`
            })
        }
    }

    // 4. Salvar Transações
    if (transacoes.length > 0) {
        const { error: erroTransacoes } = await supabase.from('transacoes').insert(transacoes)
        if (erroTransacoes) {
            console.error('Erro ao salvar transações:', erroTransacoes)
        }
    }

    // 5. Copiar Cotações Manuais
    const { data: cotacoesManuais } = await supabase
        .from('cotacoes_manuais')
        .select('*')
        .eq('carteira_id', carteiraAntiga.id)

    if (cotacoesManuais && cotacoesManuais.length > 0) {
        const novasCotacoes = cotacoesManuais.map(c => ({
            carteira_id: novaCarteira.id,
            ticker: c.ticker,
            preco_atual: c.preco_atual,
            data_atualizacao: new Date().toISOString()
        }))

        await supabase.from('cotacoes_manuais').insert(novasCotacoes)
    }

    // 6. Encerrar Carteira Antiga
    for (const pos of posicoesAntigas) {
        const precoFechamento = dados.cotacoesAtuais[pos.ticker] || pos.preco_medio
        await supabase
            .from('posicoes')
            .update({ preco_fechamento: precoFechamento })
            .eq('id', pos.id)
    }

    await supabase
        .from('carteiras')
        .update({
            ativa: false,
            data_encerramento: new Date().toISOString(),
            migrada_para_id: novaCarteira.id
        })
        .eq('id', carteiraAntiga.id)

    revalidatePath('/carteiras')
    redirect(`/carteiras/${novaCarteira.id}`)
}
