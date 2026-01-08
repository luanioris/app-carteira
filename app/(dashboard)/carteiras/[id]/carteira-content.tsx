import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, PieChart, PlusCircle, Banknote, RefreshCw, BarChart3, Target } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DeletarCarteiraButton } from './deletar-button'
import { AtualizarPrecoButton } from './atualizar-preco-button'
import { DuplicarCarteiraButton } from './duplicar-button'
import { ExportarExcelButton } from './exportar-excel-button'
import { HistoricoCarteira } from './historico-carteira'
import { NotasCarteira } from './notas-carteira'
import { CacheUpdater } from '../../cache-updater'

export async function CarteiraContent(props: { id: string }) {
    const params = { id: props.id }
    const supabase = await createClient()

    // Buscar proventos
    const { data: proventos } = await supabase
        .from('proventos')
        .select('*')
        .eq('carteira_id', params.id)

    const totalProventos = proventos?.reduce((sum, p) => sum + p.valor, 0) || 0

    // Buscar transações
    const { data: transacoes } = await supabase
        .from('transacoes')
        .select('*')
        .eq('carteira_id', params.id)
        .order('data', { ascending: false })
        .limit(50)

    // Buscar carteira com perfil e posições
    const { data: carteira, error } = await supabase
        .from('carteiras')
        .select(`
      *,
      perfis (
        nome,
        percentual_acoes,
        percentual_ivvb,
        percentual_lftb
      ),
      posicoes (
        ticker,
        tipo,
        quantidade,
        preco_medio,
        preco_fechamento
      )
    `)
        .eq('id', params.id)
        .single()

    if (error || !carteira) {
        notFound()
    }

    // Se a carteira está inativa (migrada), NÃO buscar cotações da API
    const carteiraAtiva = carteira.ativa !== false
    const tickers = carteira.posicoes.map((p: any) => p.ticker)

    // Buscar cotações atuais do CACHE (substituindo API direta para performance e consistência)
    let cotacoesCache: Record<string, number> = {}

    if (carteiraAtiva && tickers.length > 0) {
        const { data: cacheData } = await supabase
            .from('cotacoes_cache')
            .select('ticker, preco')
            .in('ticker', tickers)

        cacheData?.forEach(c => {
            cotacoesCache[c.ticker] = c.preco
        })
    }

    // Buscar cotações manuais (APENAS se carteira ativa)
    let cotacoesManuaisMap: Record<string, number> = {}

    if (carteiraAtiva) {
        const { data: cotacoesManuais } = await supabase
            .from('cotacoes_manuais')
            .select('ticker, preco_atual')
            .eq('carteira_id', params.id)

        cotacoesManuais?.forEach(cm => {
            cotacoesManuaisMap[cm.ticker] = cm.preco_atual
        })
    }

    // Calcular valores
    const posicoes = carteira.posicoes.map((pos: any) => {
        let precoAtual: number
        let temCotacaoAutomatica: boolean

        if (!carteiraAtiva) {
            // Carteira INATIVA: usar preço de fechamento (congelado)
            precoAtual = pos.preco_fechamento || pos.preco_medio
            temCotacaoAutomatica = false // Nunca permitir edição em carteira inativa
        } else {
            // Carteira ATIVA: lógica normal
            const precoApi = cotacoesCache[pos.ticker]
            const precoManual = cotacoesManuaisMap[pos.ticker]

            // Prioridade: Manual > Cache (Yahoo) > Preço Médio
            precoAtual = precoManual || precoApi || pos.preco_medio

            // Flag para exibir botão de edição (se tiver cache, considera automática)
            temCotacaoAutomatica = !!precoApi
        }

        const valorInvestido = pos.quantidade * pos.preco_medio
        const valorAtual = pos.quantidade * precoAtual
        const lucro = valorAtual - valorInvestido
        const percentualLucro = valorInvestido > 0 ? (lucro / valorInvestido) * 100 : 0

        return {
            ...pos,
            preco_atual: precoAtual,
            tem_cotacao_automatica: temCotacaoAutomatica,
            valor_investido: valorInvestido,
            valor_atual: valorAtual,
            lucro,
            percentual_lucro: percentualLucro
        }
    })

    // Ordenar posições: Ações > ETF Inter > ETF RF
    const prioridadeTipo: Record<string, number> = {
        'ACAO': 1,
        'ETF_INTER': 2,
        'ETF_RF': 3
    }

    posicoes.sort((a: any, b: any) => {
        const pA = prioridadeTipo[a.tipo] || 99
        const pB = prioridadeTipo[b.tipo] || 99
        return pA - pB
    })

    const totalInvestido = posicoes.reduce((sum: number, p: any) => sum + p.valor_investido, 0)
    const totalAtual = posicoes.reduce((sum: number, p: any) => sum + p.valor_atual, 0)
    const lucroTotal = totalAtual - totalInvestido
    const percentualLucroTotal = totalInvestido > 0 ? (lucroTotal / totalInvestido) * 100 : 0

    // Agrupar por tipo para o gráfico
    const distribuicaoPorTipo = posicoes.reduce((acc: any, pos: any) => {
        const tipo = pos.tipo === 'ETF_INTER' ? 'ETF Internacional' :
            pos.tipo === 'ETF_RF' ? 'ETF Renda Fixa' : 'Ações'
        if (!acc[tipo]) {
            acc[tipo] = 0
        }
        acc[tipo] += pos.valor_atual
        return acc
    }, {})

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Atualizador de Cache em Background */}
            <CacheUpdater />

            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/carteiras">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">{carteira.nome}</h1>
                    <p className="text-muted-foreground">
                        Perfil: {carteira.perfis?.nome || 'N/A'} • Criada em {new Date(carteira.created_at).toLocaleDateString('pt-BR')}
                        {!carteiraAtiva && carteira.data_encerramento && (
                            <> • <span className="text-orange-600 font-semibold">Encerrada em {new Date(carteira.data_encerramento).toLocaleDateString('pt-BR')}</span></>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {carteiraAtiva && (
                        <>
                            <Link href={`/carteiras/${carteira.id}/rebalancear`}>
                                <Button variant="outline">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Rebalancear
                                </Button>
                            </Link>
                            <Link href={`/carteiras/${carteira.id}/proventos`}>
                                <Button variant="outline">
                                    <Banknote className="mr-2 h-4 w-4" />
                                    Proventos
                                </Button>
                            </Link>
                            <Link href={`/carteiras/${carteira.id}/analytics`}>
                                <Button variant="outline">
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    Analytics
                                </Button>
                            </Link>
                            <Link href={`/carteiras/${carteira.id}/planejamento`}>
                                <Button variant="outline">
                                    <Target className="mr-2 h-4 w-4" />
                                    Planejamento
                                </Button>
                            </Link>
                            <Link href={`/carteiras/${carteira.id}/aporte`}>
                                <Button>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Novo Aporte
                                </Button>
                            </Link>
                        </>
                    )}
                    <ExportarExcelButton
                        carteira={carteira}
                        posicoes={posicoes}
                        proventos={proventos || []}
                        transacoes={transacoes || []}
                    />
                    <DuplicarCarteiraButton carteiraId={carteira.id} />
                    <DeletarCarteiraButton carteiraId={carteira.id} carteiraNome={carteira.nome} />
                </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Valor Investido</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            R$ {totalInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Valor inicial: R$ {carteira.valor_inicial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Valor Atual</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            R$ {totalAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {carteiraAtiva ? 'Cotações atualizadas' : 'Valores congelados'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lucro/Prejuízo</CardTitle>
                        {lucroTotal >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${lucroTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            R$ {Math.abs(lucroTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className={`text-xs ${lucroTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {lucroTotal >= 0 ? '+' : ''}{percentualLucroTotal.toFixed(2)}%
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Proventos</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            R$ {totalProventos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total recebido
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ativos</CardTitle>
                        <PieChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{posicoes.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Posições ativas
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Notas da Carteira */}
            <NotasCarteira
                carteiraId={carteira.id}
                notasIniciais={carteira.notas}
            />

            {/* Distribuição por Tipo */}
            <Card>
                <CardHeader>
                    <CardTitle>Distribuição por Categoria</CardTitle>
                    <CardDescription>Alocação atual da carteira</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Object.entries(distribuicaoPorTipo).map(([tipo, valor]: [string, any]) => {
                            const percentual = totalAtual > 0 ? (valor / totalAtual) * 100 : 0
                            return (
                                <div key={tipo} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{tipo}</span>
                                        <span className="text-muted-foreground">
                                            R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({percentual.toFixed(1)}%)
                                        </span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                                        <div
                                            className="h-full bg-primary"
                                            style={{ width: `${percentual}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Tabela de Posições */}
            <Card>
                <CardHeader>
                    <CardTitle>Posições</CardTitle>
                    <CardDescription>Todos os ativos da carteira</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border">
                        <table className="w-full">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="p-3 text-left">Ativo</th>
                                    <th className="p-3 text-right">Qtd</th>
                                    <th className="p-3 text-right">Preço Médio</th>
                                    <th className="p-3 text-right">Preço Atual</th>
                                    <th className="p-3 text-right">Investido</th>
                                    <th className="p-3 text-right">Atual</th>
                                    <th className="p-3 text-right">Lucro/Prejuízo</th>
                                    <th className="p-3 text-right">%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {posicoes.map((pos: any) => (
                                    <tr
                                        key={pos.ticker}
                                        className={`border-t ${pos.tipo === 'ETF_INTER' ? 'bg-blue-50/50 hover:bg-blue-50' :
                                            pos.tipo === 'ETF_RF' ? 'bg-green-50/50 hover:bg-green-50' :
                                                'hover:bg-muted/50'
                                            }`}
                                    >
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{pos.ticker}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {pos.tipo === 'ETF_INTER' ? 'ETF Inter' :
                                                        pos.tipo === 'ETF_RF' ? 'ETF RF' : 'Ação'}
                                                </Badge>
                                            </div>
                                        </td>
                                        <td className="p-3 text-right">{pos.quantidade}</td>
                                        <td className="p-3 text-right">R$ {pos.preco_medio.toFixed(2)}</td>
                                        <td className="p-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span>R$ {pos.preco_atual.toFixed(2)}</span>
                                                {carteiraAtiva && !pos.tem_cotacao_automatica && (
                                                    <AtualizarPrecoButton
                                                        carteiraId={carteira.id}
                                                        ticker={pos.ticker}
                                                        precoAtual={pos.preco_atual}
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 text-right">
                                            R$ {pos.valor_investido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-3 text-right">
                                            R$ {pos.valor_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className={`p-3 text-right font-medium ${pos.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {pos.lucro >= 0 ? '+' : ''}R$ {Math.abs(pos.lucro).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className={`p-3 text-right text-sm ${pos.percentual_lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {pos.percentual_lucro >= 0 ? '+' : ''}{pos.percentual_lucro.toFixed(2)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t-2 bg-muted/50 font-bold">
                                <tr>
                                    <td className="p-3" colSpan={4}>TOTAL</td>
                                    <td className="p-3 text-right">
                                        R$ {totalInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-3 text-right">
                                        R$ {totalAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className={`p-3 text-right ${lucroTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {lucroTotal >= 0 ? '+' : ''}R$ {Math.abs(lucroTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className={`p-3 text-right ${percentualLucroTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {percentualLucroTotal >= 0 ? '+' : ''}{percentualLucroTotal.toFixed(2)}%
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Histórico de Movimentações */}
            <HistoricoCarteira
                transacoes={transacoes || []}
                proventos={proventos || []}
            />
        </div>
    )
}
