'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, TrendingUp, BarChart3, PieChart, Activity, AlertTriangle } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart as RePieChart, Pie, Cell } from 'recharts'

interface AnalyticsDashboardProps {
    carteira: any
    transacoes: any[]
    posicoes: any[]
    proventos: any[]
    benchmarks?: {
        ibov: number
        cdi: number
    }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
const RISK_COLORS = ['#ef4444', '#f59e0b', '#10b981'] // Alto, Médio, Baixo risco

export function AnalyticsDashboard({ carteira, transacoes, posicoes, proventos, benchmarks }: AnalyticsDashboardProps) {
    // Calcular evolução patrimonial (Simplificado)
    const evolucaoPatrimonial = useMemo(() => {
        if (transacoes.length === 0) return []

        const pontos: any[] = []
        let aporteAcumulado = 0

        const transacoesPorMes = transacoes.reduce((acc, t) => {
            const data = new Date(t.data)
            const mesAno = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`

            if (!acc[mesAno]) {
                acc[mesAno] = { aportes: 0, retiradas: 0, data: mesAno }
            }

            if (t.tipo.includes('COMPRA') || t.tipo.includes('ENTRADA') || t.tipo === 'TRANSFERENCIA_ENTRADA') {
                acc[mesAno].aportes += t.valor_total
            }

            return acc
        }, {} as Record<string, any>)

        Object.keys(transacoesPorMes).sort().forEach(mesAno => {
            const t = transacoesPorMes[mesAno]
            aporteAcumulado += t.aportes

            const [ano, mes] = mesAno.split('-')
            const dataObj = new Date(parseInt(ano), parseInt(mes) - 1, 1)

            pontos.push({
                mes: dataObj.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
                valorInvestido: aporteAcumulado,
            })
        })

        const totalAtual = posicoes.reduce((sum, p) => sum + (p.quantidade * (p.preco_atual || p.preco_medio)), 0)
        const hoje = new Date()
        const mesAtualStr = hoje.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        const ultimoPonto = pontos[pontos.length - 1]

        if (ultimoPonto && ultimoPonto.mes === mesAtualStr) {
            ultimoPonto.valorInvestido = totalAtual
            ultimoPonto.tooltip = "Valor Atual de Mercado"
        } else {
            pontos.push({
                mes: mesAtualStr,
                valorInvestido: totalAtual,
                tooltip: "Valor Atual de Mercado"
            })
        }

        return pontos
    }, [transacoes, posicoes])

    // Rentabilidade por ativo
    const rentabilidadePorAtivo = useMemo(() => {
        return posicoes
            .map(p => {
                const precoAtual = p.preco_atual || p.preco_medio || 0
                const investido = p.quantidade * p.preco_medio
                const atual = p.quantidade * precoAtual
                const lucro = atual - investido
                const rentabilidade = investido > 0 ? ((atual / investido - 1) * 100) : 0

                return {
                    ticker: p.ticker,
                    rentabilidade: rentabilidade,
                    lucro: lucro,
                    atual: atual
                }
            })
            .filter(p => p.atual > 0)
            .sort((a, b) => b.rentabilidade - a.rentabilidade)
    }, [posicoes])

    // Rentabilidade por categoria
    const rentabilidadePorCategoria = useMemo(() => {
        const categorias = posicoes.reduce((acc, p) => {
            if (!acc[p.tipo]) {
                acc[p.tipo] = { investido: 0, atual: 0 }
            }
            const precoAtual = p.preco_atual || p.preco_medio || 0
            acc[p.tipo].investido += p.quantidade * p.preco_medio
            acc[p.tipo].atual += p.quantidade * precoAtual
            return acc
        }, {} as Record<string, any>)

        return Object.keys(categorias).map(tipo => {
            const cat = categorias[tipo]
            const rentabilidade = cat.investido > 0 ? ((cat.atual / cat.investido - 1) * 100) : 0

            return {
                categoria: tipo === 'ACAO' ? 'Ações' : tipo === 'ETF_INTER' ? 'ETF Internacional' : 'ETF Renda Fixa',
                rentabilidade: rentabilidade,
                investido: cat.investido,
                atual: cat.atual,
            }
        })
    }, [posicoes])

    // Distribuição por categoria
    const distribuicaoPorCategoria = useMemo(() => {
        const total = posicoes.reduce((sum, p) => sum + (p.quantidade * (p.preco_atual || p.preco_medio)), 0)

        if (total === 0) return []

        const categorias = posicoes.reduce((acc, p) => {
            if (!acc[p.tipo]) {
                acc[p.tipo] = 0
            }
            acc[p.tipo] += p.quantidade * (p.preco_atual || p.preco_medio)
            return acc
        }, {} as Record<string, number>)

        return Object.keys(categorias).map(tipo => ({
            name: tipo === 'ACAO' ? 'Ações' : tipo === 'ETF_INTER' ? 'ETF Internacional' : 'ETF Renda Fixa',
            value: Number(categorias[tipo].toFixed(2)),
            percent: Number(((categorias[tipo] / total) * 100).toFixed(1)),
        }))
    }, [posicoes])

    // Análise de Risco (Concentração)
    const analiseRisco = useMemo(() => {
        const total = posicoes.reduce((sum, p) => sum + (p.quantidade * (p.preco_atual || p.preco_medio)), 0)
        if (total === 0) return { maiorPosicao: null, concentracao: 0 }

        const maiorPosicao = posicoes.reduce((max, p) => {
            const valor = p.quantidade * (p.preco_atual || p.preco_medio)
            return valor > max.valor ? { ticker: p.ticker, valor } : max
        }, { ticker: '', valor: 0 })

        return {
            maiorPosicao: maiorPosicao.ticker,
            concentracao: (maiorPosicao.valor / total) * 100
        }
    }, [posicoes])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/carteiras/${carteira.id}`}>
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
                        <p className="text-muted-foreground">{carteira.nome}</p>
                    </div>
                </div>
            </div>

            {/* Benchmarks e Indicadores */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Rentabilidade Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(() => {
                                const totalInvestido = posicoes.reduce((sum, p) => sum + (p.quantidade * p.preco_medio), 0)
                                const totalAtual = posicoes.reduce((sum, p) => sum + (p.quantidade * (p.preco_atual || p.preco_medio)), 0)
                                const rentabilidade = totalInvestido > 0 ? ((totalAtual / totalInvestido - 1) * 100) : 0
                                return (
                                    <span className={rentabilidade >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        {rentabilidade >= 0 ? '+' : ''}{rentabilidade.toFixed(2)}%
                                    </span>
                                )
                            })()}
                        </div>
                        <p className="text-xs text-muted-foreground">Desde o início</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">IBOV (Hoje)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${benchmarks?.ibov && benchmarks.ibov >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {benchmarks?.ibov ? (benchmarks.ibov >= 0 ? '+' : '') + benchmarks.ibov.toFixed(2) : '0.00'}%
                        </div>
                        <p className="text-xs text-muted-foreground">Variação diária</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">CDI (Anual)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {benchmarks?.cdi || '13.65'}%
                        </div>
                        <p className="text-xs text-muted-foreground">Taxa atual aproximada</p>
                    </CardContent>
                </Card>
            </div>

            {/* Gráfico de Evolução Patrimonial */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Evolução Patrimonial (Estimada)
                    </CardTitle>
                    <CardDescription>Histórico de aportes vs Valor atual</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={evolucaoPatrimonial}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mes" />
                            <YAxis />
                            <Tooltip
                                formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            />
                            <Line type="monotone" dataKey="valorInvestido" stroke="#3b82f6" strokeWidth={2} name="Valor" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Grid de 2 colunas */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Rentabilidade por Ativo */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Rentabilidade por Ativo
                        </CardTitle>
                        <CardDescription>Top 10 ativos por performance</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={rentabilidadePorAtivo.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" unit="%" />
                                <YAxis dataKey="ticker" type="category" width={60} />
                                <Tooltip
                                    formatter={(value: number) => `${value.toFixed(2)}%`}
                                    contentStyle={{ color: '#000' }}
                                />
                                <Bar dataKey="rentabilidade" fill="#3b82f6" name="Rentabilidade %" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Distribuição por Categoria */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5" />
                            Distribuição por Categoria
                        </CardTitle>
                        <CardDescription>Alocação atual da carteira</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <RePieChart>
                                <Pie
                                    data={distribuicaoPorCategoria}
                                    cx="50%"
                                    cy="50%"
                                    label={(entry) => `${entry.name} (${entry.percent}%)`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {distribuicaoPorCategoria.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                />
                            </RePieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Análise de Risco e Rentabilidade por Categoria */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Rentabilidade por Categoria
                        </CardTitle>
                        <CardDescription>Performance de cada classe</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {rentabilidadePorCategoria.map((cat, index) => (
                                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium">{cat.categoria}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Investido: R$ {cat.investido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-xl font-bold ${cat.rentabilidade >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {cat.rentabilidade >= 0 ? '+' : ''}{cat.rentabilidade.toFixed(2)}%
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            R$ {cat.atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Análise de Risco
                        </CardTitle>
                        <CardDescription>Concentração e Diversificação</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-sm font-medium mb-2">Maior Posição</h4>
                                <div className="p-4 border rounded-lg bg-muted/50">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-lg">{analiseRisco.maiorPosicao || 'N/A'}</span>
                                        <span className={`font-bold ${analiseRisco.concentracao > 20 ? 'text-red-500' : 'text-green-500'}`}>
                                            {analiseRisco.concentracao.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${analiseRisco.concentracao > 20 ? 'bg-red-500' : 'bg-green-500'}`}
                                            style={{ width: `${Math.min(analiseRisco.concentracao, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {analiseRisco.concentracao > 20
                                            ? 'Atenção: Alta concentração em um único ativo (>20%).'
                                            : 'Boa diversificação (nenhum ativo > 20%).'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
