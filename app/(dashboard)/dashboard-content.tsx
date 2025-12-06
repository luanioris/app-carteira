import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PlusCircle, TrendingUp, Wallet, PieChart } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export async function DashboardContent() {
    const supabase = await createClient()

    // Buscar todas as carteiras ativas
    const { data: carteiras } = await supabase
        .from('carteiras')
        .select(`
        *,
        perfis (nome),
        posicoes (
            ticker,
            quantidade,
            preco_medio,
            tipo
        )
    `)
        .eq('ativa', true)
        .order('created_at', { ascending: false })

    // Calcular totais consolidados
    const totalInvestido = carteiras?.reduce((sum, c) => {
        const valorCarteira = c.posicoes?.reduce((s: number, p: any) =>
            s + (p.quantidade * p.preco_medio), 0) || 0
        return sum + valorCarteira
    }, 0) || 0

    // Calcular distribuição por categoria (consolidado)
    const distribuicaoPorCategoria = carteiras?.reduce((acc: any, c) => {
        c.posicoes?.forEach((p: any) => {
            const tipo = p.tipo || 'OUTRO'
            if (!acc[tipo]) acc[tipo] = 0
            acc[tipo] += p.quantidade * p.preco_medio
        })
        return acc
    }, {}) || {}

    const categorias = Object.entries(distribuicaoPorCategoria).map(([tipo, valor]: [string, any]) => ({
        tipo: tipo === 'ACAO' ? 'Ações' : tipo === 'ETF_INTER' ? 'ETF Internacional' : 'ETF Renda Fixa',
        valor: valor,
        percentual: totalInvestido > 0 ? (valor / totalInvestido) * 100 : 0
    }))

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Visão geral consolidada do seu patrimônio</p>
                </div>
                <Link href="/carteiras/nova">
                    <Button className="hover:scale-105 transition-transform">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nova Carteira
                    </Button>
                </Link>
            </div>

            {/* Cards de Resumo */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="hover:scale-[1.02] hover:shadow-lg transition-all duration-300 animate-slide-up" style={{ animationDelay: '0s' }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Investido
                        </CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            R$ {totalInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {carteiras?.length || 0} carteira(s) ativa(s)
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:scale-[1.02] hover:shadow-lg transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Ativos Únicos
                        </CardTitle>
                        <PieChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(() => {
                                const tickers = new Set()
                                carteiras?.forEach(c => {
                                    c.posicoes?.forEach((p: any) => tickers.add(p.ticker))
                                })
                                return tickers.size
                            })()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Diferentes ativos na carteira
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:scale-[1.02] hover:shadow-lg transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Categoria Dominante
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {categorias.length > 0 ? categorias.sort((a, b) => b.valor - a.valor)[0].tipo : 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {categorias.length > 0 ? `${categorias[0].percentual.toFixed(1)}% do total` : 'Sem dados'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Distribuição por Categoria - Ocupa 3 colunas */}
                <Card className="col-span-3 hover:shadow-lg transition-shadow duration-300 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    <CardHeader>
                        <CardTitle>Distribuição Geral</CardTitle>
                        <CardDescription>Alocação por classe de ativo</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {categorias.map((cat, index) => (
                                <div key={index} className="space-y-2 animate-scale-in" style={{ animationDelay: `${0.4 + (index * 0.1)}s` }}>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{cat.tipo}</span>
                                        <span className="text-muted-foreground">
                                            R$ {cat.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({cat.percentual.toFixed(1)}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-1000 ease-out"
                                            style={{ width: `${cat.percentual}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {categorias.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Nenhuma posição encontrada.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Lista de Carteiras - Ocupa 4 colunas */}
                <Card className="col-span-4 hover:shadow-lg transition-shadow duration-300 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                    <CardHeader>
                        <CardTitle>Suas Carteiras</CardTitle>
                        <CardDescription>Detalhamento por carteira ativa</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {!carteiras || carteiras.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <Wallet className="h-10 w-10 text-muted-foreground mb-2" />
                                    <p className="text-sm font-medium leading-none">
                                        Nenhuma carteira ativa encontrada
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Crie sua primeira carteira para começar
                                    </p>
                                </div>
                            ) : (
                                carteiras.map((carteira, idx) => {
                                    const valorCarteira = carteira.posicoes?.reduce((s: number, p: any) =>
                                        s + (p.quantidade * p.preco_medio), 0) || 0
                                    const percentualDoTotal = totalInvestido > 0 ? (valorCarteira / totalInvestido) * 100 : 0

                                    return (
                                        <Link
                                            key={carteira.id}
                                            href={`/carteiras/${carteira.id}`}
                                            className="block animate-scale-in"
                                            style={{ animationDelay: `${0.5 + (idx * 0.1)}s` }}
                                        >
                                            <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent hover:scale-[1.01] hover:shadow-md transition-all duration-200 cursor-pointer">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                        <TrendingUp className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{carteira.nome}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {carteira.perfis?.nome || 'Sem perfil'} • {carteira.posicoes?.length || 0} ativos
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">
                                                        R$ {valorCarteira.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {percentualDoTotal.toFixed(1)}% do total
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
