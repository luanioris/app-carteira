// Função auxiliar para calcular distribuição de ativos
export function calcularDistribuicao(
    valorTotal: number,
    perfil: { percentual_acoes: number; percentual_ivvb: number; percentual_lftb: number },
    ativos: { ticker: string; tipo: string; preco: number }[]
) {
    // Agrupar ativos por tipo
    const ativosPorTipo = {
        ACAO: ativos.filter(a => a.tipo === 'ACAO'),
        ETF_INTER: ativos.filter(a => a.tipo === 'ETF_INTER'),
        ETF_RF: ativos.filter(a => a.tipo === 'ETF_RF')
    }

    // Calcular valores por categoria
    const valorAcoes = valorTotal * (perfil.percentual_acoes / 100)
    const valorETFInter = valorTotal * (perfil.percentual_ivvb / 100)
    const valorETFRF = valorTotal * (perfil.percentual_lftb / 100)

    const resultado: Array<{
        ticker: string
        tipo: string
        preco: number
        quantidade: number
        valorAlocado: number
    }> = []

    // Distribuir igualmente entre ativos da mesma categoria
    const distribuir = (ativos: any[], valorCategoria: number) => {
        if (ativos.length === 0) return
        const valorPorAtivo = valorCategoria / ativos.length

        ativos.forEach(ativo => {
            const quantidade = Math.floor(valorPorAtivo / ativo.preco)
            const valorAlocado = quantidade * ativo.preco

            resultado.push({
                ticker: ativo.ticker,
                tipo: ativo.tipo,
                preco: ativo.preco,
                quantidade,
                valorAlocado
            })
        })
    }

    distribuir(ativosPorTipo.ACAO, valorAcoes)
    distribuir(ativosPorTipo.ETF_INTER, valorETFInter)
    distribuir(ativosPorTipo.ETF_RF, valorETFRF)

    return resultado
}
