import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { PlusCircle, TrendingUp, Wallet, PieChart, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CacheUpdater } from './cache-updater'

export async function DashboardContent() {
    const supabase = await createClient()

    // Buscar todas as carteiras ativas e suas posições
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

    // Buscar Cache de Cotações (para Mark-to-Market)
    const { data: cacheCotações } = await supabase
        .from('cotacoes_cache')
        .select('ticker, preco')

    // Mapa para acesso rápido O(1): Ticker -> Preço Atual do Cache
    const mapaPrecos = new Map(cacheCotações?.map(c => [c.ticker, c.preco]) || [])

    // Buscar Cotações Manuais (Respeitar exceções definidas pelo usuário)
    const { data: cotacoesManuais } = await supabase
        .from('cotacoes_manuais')
        .select('carteira_id, ticker, preco_atual')

    // Mapa composto para acesso rápido: "carteira_id-ticker" -> Preço Manual
    const mapaManuais = new Map(
        cotacoesManuais?.map(c => [`${c.carteira_id}-${c.ticker}`, c.preco_atual]) || []
    )

    // --- CÁLCULOS ---

    // 1. Total Investido (Custo Histórico)
    const totalInvestido = carteiras?.reduce((sum, c) => {
        const custoCarteira = c.posicoes?.reduce((s: number, p: any) =>
            s + (p.quantidade * p.preco_medio), 0) || 0
        return sum + custoCarteira
    }, 0) || 0

    // 2. Patrimônio Atual (Mark-to-Market)
    // Prioridade: Manual > Cache Yahoo (Automático) > Preço Médio
    const patrimonioTotal = carteiras?.reduce((sum, c) => {
        const valorCarteira = c.posicoes?.reduce((s: number, p: any) => {
            const precoManual = mapaManuais.get(`${c.id}-${p.ticker}`)
            const precoAtual = precoManual ?? mapaPrecos.get(p.ticker) ?? p.preco_medio
            return s + (p.quantidade * precoAtual)
        }, 0) || 0
        return sum + valorCarteira
    }, 0) || 0

    // 3. Lucro/Prejuízo Global
    const resultadoValor = patrimonioTotal - totalInvestido
    const resultadoPercentual = totalInvestido > 0 ? (resultadoValor / totalInvestido) * 100 : 0

    // 4. Distribuição por Categoria e 5. Consolidação por Ativo
    const distribuicaoPorCategoria: Record<string, number> = {}
    const ativosConsolidados = new Map<string, {
        ticker: string
        tipo: string
        quantidade: number
        valorInvestido: number
        valorAtual: number
    }>()

    carteiras?.forEach(c => {
        c.posicoes?.forEach((p: any) => {
            // Price resolution logic consistent with everywhere else
            const precoManual = mapaManuais.get(`${c.id}-${p.ticker}`)
            const precoAtual = precoManual ?? mapaPrecos.get(p.ticker) ?? p.preco_medio

            // Distribuição por Categoria
            const tipo = p.tipo || 'OUTRO'
            if (!distribuicaoPorCategoria[tipo]) distribuicaoPorCategoria[tipo] = 0
            distribuicaoPorCategoria[tipo] += p.quantidade * precoAtual

            // Consolidação por Ativo
            const existing = ativosConsolidados.get(p.ticker) || {
                ticker: p.ticker,
                tipo: p.tipo,
                quantidade: 0,
                valorInvestido: 0,
                valorAtual: 0
            }

            existing.quantidade += p.quantidade
            existing.valorInvestido += p.quantidade * p.preco_medio
            existing.valorAtual += p.quantidade * precoAtual

            ativosConsolidados.set(p.ticker, existing)
        })
    })

    const categorias = Object.entries(distribuicaoPorCategoria).map(([tipo, valor]: [string, any]) => ({
        tipo: tipo === 'ACAO' ? 'Ações' : tipo === 'ETF_INTER' ? 'ETF Internacional' : 'ETF Renda Fixa',
        valor: valor,
        percentual: patrimonioTotal > 0 ? (valor / patrimonioTotal) * 100 : 0
    })).sort((a, b) => b.valor - a.valor) // Ordenar do maior para menor

    // Lista de Ativos Ordenada para o Dashboard
    const listaAtivos = Array.from(ativosConsolidados.values()).map(a => {
        const lucro = a.valorAtual - a.valorInvestido
        const lucroPerc = a.valorInvestido > 0 ? (lucro / a.valorInvestido) * 100 : 0
        const part = patrimonioTotal > 0 ? (a.valorAtual / patrimonioTotal) * 100 : 0
        const pm = a.quantidade > 0 ? a.valorInvestido / a.quantidade : 0
        const precoAtual = a.quantidade > 0 ? a.valorAtual / a.quantidade : 0

        return { ...a, lucro, lucroPerc, part, pm, precoAtual }
    }).sort((a, b) => b.part - a.part) // Ordenar por participação (maior primeiro)

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Componente invisível que dispara a atualização do cache se necessário */}
            <CacheUpdater />

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
                {/* Card Patrimônio (Destaque) */}
                <Card className="hover:scale-[1.02] hover:shadow-lg transition-all duration-300 animate-slide-up" style={{ animationDelay: '0s' }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Patrimônio Total
                        </CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            R$ {patrimonioTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                            <div className={`text-xs font-bold flex items-center gap-1 ${resultadoValor >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {resultadoValor >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                {resultadoPercentual.toFixed(2)}% ({resultadoValor >= 0 ? '+' : ''}R$ {resultadoValor.toLocaleString('pt-BR', { maximumFractionDigits: 0 })})
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 opacity-70">
                            Custo: R$ {totalInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </CardContent>
                </Card>

                {/* Card Ativos Únicos */}
                <Card className="hover:scale-[1.02] hover:shadow-lg transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Ativos Únicos
                        </CardTitle>
                        <PieChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {listaAtivos.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Diferentes ativos na carteira
                        </p>
                    </CardContent>
                </Card>

                {/* Card Categoria Dominante */}
                <Card className="hover:scale-[1.02] hover:shadow-lg transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Categoria Dominante
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold truncate">
                            {categorias.length > 0 ? categorias[0].tipo : 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {categorias.length > 0 ? `${categorias[0].percentual.toFixed(1)}% do patrimônio` : 'Sem dados'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Distribuição por Categoria - Ocupa 3 colunas */}
                <Card className="col-span-3 hover:shadow-lg transition-shadow duration-300 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    <CardHeader>
                        <CardTitle>Alocação Atual</CardTitle>
                        <CardDescription>Baseada no valor de mercado</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {categorias.map((cat, index) => (
                                <div key={index} className="space-y-2 animate-scale-in" style={{ animationDelay: `${0.4 + (index * 0.1)}s` }}>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{cat.tipo}</span>
                                        <div className="text-right">
                                            <span className="block font-bold">
                                                R$ {cat.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {cat.percentual.toFixed(1)}%
                                            </span>
                                        </div>
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
                        <CardDescription>Rentabilidade por carteira</CardDescription>
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
                                    // Cálculo Individual por Carteira
                                    const custoCarteira = carteira.posicoes?.reduce((s: number, p: any) =>
                                        s + (p.quantidade * p.preco_medio), 0) || 0

                                    const valorAtualCarteira = carteira.posicoes?.reduce((s: number, p: any) => {
                                        const precoManual = mapaManuais.get(`${carteira.id}-${p.ticker}`)
                                        const preco = precoManual ?? mapaPrecos.get(p.ticker) ?? p.preco_medio
                                        return s + (p.quantidade * preco)
                                    }, 0) || 0

                                    const resultCarteira = valorAtualCarteira - custoCarteira
                                    const percCarteira = custoCarteira > 0 ? (resultCarteira / custoCarteira) * 100 : 0
                                    const shareTotal = patrimonioTotal > 0 ? (valorAtualCarteira / patrimonioTotal) * 100 : 0

                                    return (
                                        <Link
                                            key={carteira.id}
                                            href={`/carteiras/${carteira.id}`}
                                            className="block animate-scale-in"
                                            style={{ animationDelay: `${0.5 + (idx * 0.1)}s` }}
                                        >
                                            <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent hover:scale-[1.01] hover:shadow-md transition-all duration-200 cursor-pointer">
                                                <div className="flex items-center gap-4">
                                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${resultCarteira >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                                        {resultCarteira >= 0
                                                            ? <TrendingUp className="h-5 w-5 text-green-700" />
                                                            : <TrendingUp className="h-5 w-5 text-red-700 transform rotate-180" />
                                                        }
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{carteira.nome}</p>
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className="text-muted-foreground">{carteira.perfis?.nome}</span>
                                                            <span className={`font-bold ${resultCarteira >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {resultCarteira >= 0 ? '+' : ''}{percCarteira.toFixed(2)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">
                                                        R$ {valorAtualCarteira.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {shareTotal.toFixed(1)}% do total
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

            {/* Performance por Ativo (NOVA SEÇÃO) */}
            <Card className="hover:shadow-lg transition-shadow duration-300 animate-slide-up" style={{ animationDelay: '0.5s' }}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Layers className="h-5 w-5" />
                        Desempenho por Ativo
                    </CardTitle>
                    <CardDescription>Visão consolidada da sua exposição global por papel (Top 10)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1">
                        {listaAtivos.slice(0, 10).map((ativo, idx) => (
                            <div key={ativo.ticker} className="relative group rounded-lg overflow-hidden border border-transparent hover:border-border transition-all">
                                {/* Barra de Fundo (Exposição) */}
                                <div
                                    className="absolute inset-0 bg-secondary/30 pointer-events-none transition-all duration-1000 origin-left"
                                    style={{ width: `${Math.min(ativo.part * 2, 100)}%`, opacity: 0.5 }}
                                />

                                <div className="relative p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 z-10">
                                    {/* Esquerda: Identificação */}
                                    <div className="flex items-center gap-3 min-w-[150px]">
                                        <Badge variant="outline" className={`font-mono ${ativo.tipo === 'ACAO' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                            {ativo.ticker}
                                        </Badge>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground font-semibold">
                                                {ativo.quantidade} cotas
                                            </span>
                                        </div>
                                    </div>

                                    {/* Centro: Preços */}
                                    <div className="flex flex-col sm:items-end min-w-[120px]">
                                        <span className="text-sm font-medium">PM: R$ {ativo.pm.toFixed(2)}</span>
                                        <span className="text-xs text-muted-foreground">Atual: R$ {ativo.precoAtual.toFixed(2)}</span>
                                    </div>

                                    {/* Direita: Rentabilidade */}
                                    <div className="flex flex-col sm:items-end min-w-[120px]">
                                        <span className={`text-sm font-bold ${ativo.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {ativo.lucro >= 0 ? '+' : ''}R$ {Math.abs(ativo.lucro).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                        </span>
                                        <span className={`text-xs ${ativo.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {ativo.lucroPerc.toFixed(2)}%
                                        </span>
                                    </div>

                                    {/* Extrema Direita: Exposição Total */}
                                    <div className="flex flex-col sm:items-end min-w-[120px]">
                                        <span className="text-sm font-bold">
                                            R$ {ativo.valorAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-xs text-muted-foreground font-semibold">
                                            {ativo.part.toFixed(2)}% do Total
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {listaAtivos.length > 10 && (
                            <div className="text-center pt-4">
                                <p className="text-sm text-muted-foreground italic">
                                    + {listaAtivos.length - 10} outros ativos com menor exposição...
                                </p>
                            </div>
                        )}

                        {listaAtivos.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Nenhuma posição encontrada.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
