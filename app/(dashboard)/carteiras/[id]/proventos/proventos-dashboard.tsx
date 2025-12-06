'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, TrendingUp, Calendar, DollarSign, Percent, ArrowLeft } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Provento {
    id: string
    ticker: string
    valor: number
    data: string
    reinvestido: boolean
}

interface Posicao {
    ticker: string
    quantidade: number
    preco_medio: number
}

interface ProventosDashboardProps {
    carteira: any
    proventos: Provento[]
    posicoes: Posicao[]
}

export function ProventosDashboard({ carteira, proventos, posicoes }: ProventosDashboardProps) {
    const hoje = new Date()
    const mesAtual = hoje.getMonth()
    const anoAtual = hoje.getFullYear()

    // Calcular totais
    const totalMes = useMemo(() => {
        return proventos
            .filter(p => {
                const data = new Date(p.data)
                return data.getMonth() === mesAtual && data.getFullYear() === anoAtual
            })
            .reduce((sum, p) => sum + p.valor, 0)
    }, [proventos, mesAtual, anoAtual])

    const totalAno = useMemo(() => {
        return proventos
            .filter(p => new Date(p.data).getFullYear() === anoAtual)
            .reduce((sum, p) => sum + p.valor, 0)
    }, [proventos, anoAtual])

    const totalGeral = useMemo(() => {
        return proventos.reduce((sum, p) => sum + p.valor, 0)
    }, [proventos])

    // Calcular patrimônio investido
    const patrimonioInvestido = useMemo(() => {
        return posicoes.reduce((sum, p) => sum + (p.quantidade * p.preco_medio), 0)
    }, [posicoes])

    // Calcular Dividend Yield da carteira (anualizado)
    const dividendYieldCarteira = useMemo(() => {
        if (patrimonioInvestido === 0) return 0
        return (totalAno / patrimonioInvestido) * 100
    }, [totalAno, patrimonioInvestido])

    // Calcular DY por ativo
    const dividendYieldPorAtivo = useMemo(() => {
        const proventosPorTicker = proventos
            .filter(p => new Date(p.data).getFullYear() === anoAtual)
            .reduce((acc, p) => {
                acc[p.ticker] = (acc[p.ticker] || 0) + p.valor
                return acc
            }, {} as Record<string, number>)

        return posicoes.map(pos => {
            const totalProventos = proventosPorTicker[pos.ticker] || 0
            const valorInvestido = pos.quantidade * pos.preco_medio
            const dy = valorInvestido > 0 ? (totalProventos / valorInvestido) * 100 : 0

            return {
                ticker: pos.ticker,
                totalProventos,
                valorInvestido,
                dy
            }
        }).filter(item => item.totalProventos > 0)
            .sort((a, b) => b.dy - a.dy)
    }, [proventos, posicoes, anoAtual])

    // Dados para o gráfico (últimos 12 meses)
    const dadosGrafico = useMemo(() => {
        const meses = []
        for (let i = 11; i >= 0; i--) {
            const data = new Date(anoAtual, mesAtual - i, 1)
            const mes = data.getMonth()
            const ano = data.getFullYear()

            const total = proventos
                .filter(p => {
                    const pData = new Date(p.data)
                    return pData.getMonth() === mes && pData.getFullYear() === ano
                })
                .reduce((sum, p) => sum + p.valor, 0)

            meses.push({
                mes: data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
                valor: total
            })
        }
        return meses
    }, [proventos, mesAtual, anoAtual])

    // Projeção anual (média dos últimos 12 meses * 12)
    const projecaoAnual = useMemo(() => {
        const mediaMensal = dadosGrafico.reduce((sum, d) => sum + d.valor, 0) / 12
        return mediaMensal * 12
    }, [dadosGrafico])

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
                        <h1 className="text-3xl font-bold tracking-tight">Proventos</h1>
                        <p className="text-muted-foreground">{carteira.nome}</p>
                    </div>
                </div>
                <Link href={`/carteiras/${carteira.id}/proventos/novo`}>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Registrar Provento
                    </Button>
                </Link>
            </div>

            {/* Cards de Resumo */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total no Mês</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            R$ {totalMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total no Ano</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            R$ {totalAno.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {anoAtual}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dividend Yield</CardTitle>
                        <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {dividendYieldCarteira.toFixed(2)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Anualizado ({anoAtual})
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Projeção Anual</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            R$ {projecaoAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Baseado nos últimos 12 meses
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Gráfico de Evolução */}
            <Card>
                <CardHeader>
                    <CardTitle>Evolução Mensal</CardTitle>
                    <CardDescription>Proventos recebidos nos últimos 12 meses</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dadosGrafico}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mes" />
                            <YAxis />
                            <Tooltip
                                formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            />
                            <Bar dataKey="valor" fill="#22c55e" name="Proventos" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Dividend Yield por Ativo */}
            {dividendYieldPorAtivo.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Dividend Yield por Ativo</CardTitle>
                        <CardDescription>Rendimento de cada ativo em {anoAtual}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {dividendYieldPorAtivo.map(item => (
                                <div key={item.ticker} className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="font-medium">{item.ticker}</p>
                                        <p className="text-sm text-muted-foreground">
                                            R$ {item.totalProventos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} recebidos
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-green-600">
                                            {item.dy.toFixed(2)}%
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            DY {anoAtual}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Mensagem se não houver proventos */}
            {proventos.length === 0 && (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Nenhum provento registrado</h3>
                        <p className="text-sm text-muted-foreground mb-4 text-center">
                            Comece registrando seus dividendos, JCP e rendimentos
                        </p>
                        <Link href={`/carteiras/${carteira.id}/proventos/novo`}>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Registrar Primeiro Provento
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
