import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TrendingUp, TrendingDown, Wallet, PieChart } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function ConsolidadoPage() {
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Visão Consolidada</h1>
                    <p className="text-muted-foreground">Todas as suas carteiras ativas em um só lugar</p>
                </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
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

                <Card>
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

                <Card>
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

            {/* Distribuição por Categoria */}
            <Card>
                <CardHeader>
                    <CardTitle>Distribuição por Categoria</CardTitle>
                    <CardDescription>Alocação consolidada de todas as carteiras</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {categorias.map((cat, index) => (
                            <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">{cat.tipo}</span>
                                    <span className="text-muted-foreground">
                                        R$ {cat.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({cat.percentual.toFixed(1)}%)
                                    </span>
                                </div>
                                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all"
                                        style={{ width: `${cat.percentual}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Lista de Carteiras */}
            <Card>
                <CardHeader>
                    <CardTitle>Suas Carteiras</CardTitle>
                    <CardDescription>Todas as carteiras ativas</CardDescription>
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
                            carteiras.map((carteira) => {
                                const valorCarteira = carteira.posicoes?.reduce((s: number, p: any) =>
                                    s + (p.quantidade * p.preco_medio), 0) || 0
                                const percentualDoTotal = totalInvestido > 0 ? (valorCarteira / totalInvestido) * 100 : 0

                                return (
                                    <Link
                                        key={carteira.id}
                                        href={`/carteiras/${carteira.id}`}
                                        className="block"
                                    >
                                        <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                                            <div className="flex-1">
                                                <p className="font-medium">{carteira.nome}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {carteira.perfis?.nome || 'Sem perfil'} • {carteira.posicoes?.length || 0} ativos
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">
                                                    R$ {valorCarteira.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
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
    )
}
