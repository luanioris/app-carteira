import { Perfil, CalculoDistribuicao, TipoAtivo } from '@/types/carteira'

/**
 * Calcula a distribuição de valores e quantidades para uma nova carteira
 * Inclui otimização de sobras (Greedy Algorithm)
 */
export function calcularDistribuicao(
    perfil: Perfil,
    valorTotal: number,
    etfInternacional: string,
    etfRendaFixa: string,
    acoesSelecionadas: string[],
    precos: Record<string, number>
): CalculoDistribuicao[] {
    const distribuicao: CalculoDistribuicao[] = []

    // 1. Definição dos Targets (Quanto R$ eu QUERIA ter em cada ativo)

    // ETF Internacional
    const targetIVVB = valorTotal * (perfil.percentual_ivvb / 100)

    // ETF Renda Fixa
    const targetLFTB = valorTotal * (perfil.percentual_lftb / 100)

    // Ações (divisão igualitária)
    const numAcoes = acoesSelecionadas.length
    const targetAcao = numAcoes > 0 ? (valorTotal * (perfil.percentual_acoes / 100)) / numAcoes : 0

    // 2. Cálculo Inicial (Floor)

    // IVVB
    const precoIVVB = precos[etfInternacional] || 0
    let qtdIVVB = precoIVVB > 0 ? Math.floor(targetIVVB / precoIVVB) : 0

    distribuicao.push({
        ticker: etfInternacional,
        tipo: 'ETF_INTER',
        percentual_categoria: perfil.percentual_ivvb,
        valor_destinado: targetIVVB,
        preco_unitario: precoIVVB,
        quantidade_calculada: qtdIVVB,
        valor_investido: qtdIVVB * precoIVVB,
    })

    // LFTB
    const precoLFTB = precos[etfRendaFixa] || 0
    let qtdLFTB = precoLFTB > 0 ? Math.floor(targetLFTB / precoLFTB) : 0

    distribuicao.push({
        ticker: etfRendaFixa,
        tipo: 'ETF_RF',
        percentual_categoria: perfil.percentual_lftb,
        valor_destinado: targetLFTB,
        preco_unitario: precoLFTB,
        quantidade_calculada: qtdLFTB,
        valor_investido: qtdLFTB * precoLFTB,
    })

    // Ações
    for (const ticker of acoesSelecionadas) {
        const preco = precos[ticker] || 0
        let qtd = preco > 0 ? Math.floor(targetAcao / preco) : 0

        distribuicao.push({
            ticker,
            tipo: 'ACAO',
            percentual_categoria: perfil.percentual_acoes / numAcoes,
            valor_destinado: targetAcao,
            preco_unitario: preco,
            quantidade_calculada: qtd,
            valor_investido: qtd * preco,
        })
    }

    // 3. Otimização de Sobras (Greedy)
    // Tenta usar o dinheiro que sobrou para comprar mais unidades, priorizando quem está mais longe do target

    let sobra = valorTotal - calcularValorTotalInvestido(distribuicao)
    let houveMudanca = true
    let iteracoes = 0
    const MAX_ITERACOES = 100 // Segurança contra loop infinito

    while (sobra > 0 && houveMudanca && iteracoes < MAX_ITERACOES) {
        houveMudanca = false
        iteracoes++

        // Ordenar ativos por "quem está mais atrasado" em relação ao target (valor_destinado - valor_investido)
        // Mas só considerar ativos que cabem no bolso (preco <= sobra)
        const candidatos = distribuicao
            .filter(item => item.preco_unitario > 0 && item.preco_unitario <= sobra)
            .sort((a, b) => {
                const faltaA = a.valor_destinado - a.valor_investido
                const faltaB = b.valor_destinado - b.valor_investido
                return faltaB - faltaA // Decrescente: quem falta mais vem primeiro
            })

        if (candidatos.length > 0) {
            const escolhido = candidatos[0]

            // Incrementa 1 unidade no escolhido
            escolhido.quantidade_calculada++
            escolhido.valor_investido += escolhido.preco_unitario

            // Atualiza a sobra
            sobra -= escolhido.preco_unitario
            houveMudanca = true
        }
    }

    return distribuicao
}

/**
 * Calcula o valor total que será efetivamente investido
 */
export function calcularValorTotalInvestido(
    distribuicao: CalculoDistribuicao[]
): number {
    return distribuicao.reduce((total, item) => total + item.valor_investido, 0)
}

/**
 * Calcula o valor que sobrou (não foi investido devido a arredondamentos)
 */
export function calcularValorSobrando(
    valorTotal: number,
    distribuicao: CalculoDistribuicao[]
): number {
    const investido = calcularValorTotalInvestido(distribuicao)
    return valorTotal - investido
}
