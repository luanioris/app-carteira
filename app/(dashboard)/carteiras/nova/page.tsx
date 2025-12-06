'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { Perfil, NovaCarteiraStep1, NovaCarteiraStep2, NovaCarteiraStep3, CalculoDistribuicao } from '@/types/carteira'
import { getPerfis, getPerfil, criarCarteira, buscarCotacoesAction } from '../actions'
import { calcularDistribuicao, calcularValorTotalInvestido } from '@/lib/calculations/distribuicao'
import { ArrowLeft, ArrowRight, Check, Loader2, RefreshCw, Calculator, AlertTriangle } from 'lucide-react'

type Step = 1 | 2 | 3

const ETF_INTERNACIONAL_OPTIONS = [
    { value: 'IVVB11', label: 'IVVB11 - iShares S&P 500' },
    { value: 'WRLD11', label: 'WRLD11 - MSCI World' },
    { value: 'NASD11', label: 'NASD11 - NASDAQ' },
]

const ETF_RENDA_FIXA_OPTIONS = [
    { value: 'LFTB11', label: 'LFTB11 - Tesouro Prefixado' },
    { value: 'B5P211', label: 'B5P211 - Renda Fixa' },
    { value: 'FIXA11', label: 'FIXA11 - Renda Fixa' },
    { value: 'LFT2029', label: 'LFT2029 - Tesouro Selic 2029' },
    { value: 'LFT2031', label: 'LFT2031 - Tesouro Selic 2031' },
]

export default function NovaCarteiraPage() {
    const [step, setStep] = useState<Step>(1)
    const [perfis, setPerfis] = useState<Perfil[]>([])
    const [loading, setLoading] = useState(false)

    const [step1Data, setStep1Data] = useState<NovaCarteiraStep1>({
        nome: '',
        perfil_id: '',
        valor_inicial: 0,
    })
    const [step2Data, setStep2Data] = useState<NovaCarteiraStep2>({
        etf_internacional: 'IVVB11',
        etf_renda_fixa: 'LFTB11',
        acoes_selecionadas: [],
    })
    const [step3Data, setStep3Data] = useState<NovaCarteiraStep3>({
        precos: {},
    })
    const [distribuicao, setDistribuicao] = useState<CalculoDistribuicao[]>([])

    useEffect(() => {
        async function loadPerfis() {
            try {
                const data = await getPerfis()
                setPerfis(data)
            } catch (error) {
                toast.error('Erro ao carregar perfis')
            }
        }
        loadPerfis()
    }, [])

    const handleStep1Next = () => {
        if (!step1Data.nome.trim()) {
            toast.error('Digite um nome para a carteira')
            return
        }
        if (!step1Data.perfil_id) {
            toast.error('Selecione um perfil de investimento')
            return
        }
        if (step1Data.valor_inicial <= 0) {
            toast.error('Digite um valor inicial maior que zero')
            return
        }
        setStep(2)
    }

    const [novaAcao, setNovaAcao] = useState('')

    const adicionarAcao = () => {
        const input = novaAcao.trim().toUpperCase()
        if (!input) return

        const tickers = input
            .split(/[\s,\n\t]+/)
            .map(t => t.trim())
            .filter(t => t.length > 0)

        if (tickers.length === 0) return

        const novosValidos: string[] = []
        const jaExistentes: string[] = []
        const etfsIgnorados: string[] = []

        tickers.forEach(ticker => {
            if (ticker === step2Data.etf_internacional || ticker === step2Data.etf_renda_fixa) {
                etfsIgnorados.push(ticker)
                return
            }

            if (step2Data.acoes_selecionadas.includes(ticker)) {
                jaExistentes.push(ticker)
                return
            }

            novosValidos.push(ticker)
        })

        if (novosValidos.length > 0) {
            setStep2Data({
                ...step2Data,
                acoes_selecionadas: [...step2Data.acoes_selecionadas, ...novosValidos],
            })
            toast.success(`${novosValidos.length} ação(ões) adicionada(s)!`)
        }

        if (etfsIgnorados.length > 0) {
            toast.warning(`${etfsIgnorados.join(', ')} já selecionado(s) como ETF`)
        }
        if (jaExistentes.length > 0) {
            toast.info(`${jaExistentes.join(', ')} já adicionado(s)`)
        }

        setNovaAcao('')
    }

    const removerAcao = (ticker: string) => {
        setStep2Data({
            ...step2Data,
            acoes_selecionadas: step2Data.acoes_selecionadas.filter((t) => t !== ticker),
        })
    }

    const handleStep2Next = async () => {
        if (step2Data.acoes_selecionadas.length === 0) {
            toast.error('Adicione pelo menos uma ação')
            return
        }

        setLoading(true)
        try {
            const tickers = [
                step2Data.etf_internacional,
                step2Data.etf_renda_fixa,
                ...step2Data.acoes_selecionadas
            ]

            const quotes = await buscarCotacoesAction(tickers)
            const precosAtualizados: Record<string, number> = { ...step3Data.precos }

            tickers.forEach(t => {
                if (!precosAtualizados[t]) precosAtualizados[t] = 0
            })

            if (quotes && quotes.length > 0) {
                quotes.forEach((quote) => {
                    if (quote.regularMarketPrice > 0) {
                        precosAtualizados[quote.symbol] = quote.regularMarketPrice
                    }
                })
                if (step === 2) toast.success(`${quotes.length} cotações obtidas.`)
            } else {
                toast.warning('Não foi possível buscar cotações automaticamente. Insira manualmente.')
            }

            setStep3Data({ precos: precosAtualizados })

            const perfil = perfis.find(p => p.id === step1Data.perfil_id)
            if (perfil) {
                const dist = calcularDistribuicao(
                    perfil,
                    step1Data.valor_inicial,
                    step2Data.etf_internacional,
                    step2Data.etf_renda_fixa,
                    step2Data.acoes_selecionadas,
                    precosAtualizados
                )
                setDistribuicao(dist)
            } else {
                toast.error('Perfil não encontrado.')
                return
            }

            setStep(3)
        } catch (error) {
            console.error(error)
            toast.error('Erro ao processar dados. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateDistribuicaoItem = (ticker: string, novaQtd: number, novoPreco: number) => {
        const novaDist = distribuicao.map(item => {
            if (item.ticker === ticker) {
                return {
                    ...item,
                    quantidade_calculada: novaQtd,
                    preco_unitario: novoPreco,
                    valor_investido: novaQtd * novoPreco
                }
            }
            return item
        })
        setDistribuicao(novaDist)

        setStep3Data(prev => ({
            precos: { ...prev.precos, [ticker]: novoPreco }
        }))
    }

    const handleAtualizarCotacoes = async () => {
        await handleStep2Next()
        toast.success('Cotações e distribuição atualizadas!')
    }

    const handleCriarCarteira = async () => {
        setLoading(true)
        try {
            await criarCarteira(
                step1Data.nome,
                step1Data.perfil_id,
                step1Data.valor_inicial,
                distribuicao
            )
            toast.success('Carteira criada com sucesso!')
        } catch (error) {
            toast.error('Erro ao criar carteira')
            setLoading(false)
        }
    }

    return (
        <div className="mx-auto max-w-5xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Criar Nova Carteira</h1>
                <p className="text-muted-foreground">Etapa {step} de 3</p>
            </div>

            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Configuração Inicial</CardTitle>
                        <CardDescription>Escolha um nome e o perfil de risco para sua nova carteira.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nome">Nome da Carteira</Label>
                            <Input
                                id="nome"
                                placeholder="Ex: Aposentadoria, Viagem..."
                                value={step1Data.nome}
                                onChange={(e) => setStep1Data({ ...step1Data, nome: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="perfil">Perfil de Investimento</Label>
                            <Select
                                value={step1Data.perfil_id}
                                onValueChange={(value) => setStep1Data({ ...step1Data, perfil_id: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um perfil" />
                                </SelectTrigger>
                                <SelectContent>
                                    {perfis.map((perfil) => (
                                        <SelectItem key={perfil.id} value={perfil.id}>
                                            {perfil.nome} ({perfil.percentual_acoes}% Ações / {perfil.percentual_ivvb}% ETF Inter / {perfil.percentual_lftb}% Renda Fixa)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="valor">Valor Inicial (R$)</Label>
                            <Input
                                id="valor"
                                type="number"
                                placeholder="0,00"
                                min="0"
                                step="0.01"
                                value={step1Data.valor_inicial || ''}
                                onChange={(e) => setStep1Data({ ...step1Data, valor_inicial: parseFloat(e.target.value) || 0 })}
                            />
                        </div>

                        <Button className="w-full" onClick={handleStep1Next}>
                            Próximo <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            )}

            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Seleção de Ativos</CardTitle>
                        <CardDescription>Escolha os ETFs e ações que farão parte da sua carteira.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="etf-inter">🌎 ETF Internacional</Label>
                            <Select
                                value={step2Data.etf_internacional}
                                onValueChange={(value) => setStep2Data({ ...step2Data, etf_internacional: value })}
                            >
                                <SelectTrigger id="etf-inter">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ETF_INTERNACIONAL_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="etf-rf">💰 ETF Renda Fixa</Label>
                            <Select
                                value={step2Data.etf_renda_fixa}
                                onValueChange={(value) => setStep2Data({ ...step2Data, etf_renda_fixa: value })}
                            >
                                <SelectTrigger id="etf-rf">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ETF_RENDA_FIXA_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>📈 Ações Nacionais (B3)</Label>
                            <p className="text-xs text-muted-foreground">
                                💡 Cole múltiplos tickers separados por espaço ou vírgula (ex: BRAP4 COCE5 GOAU4)
                            </p>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Digite ou cole os tickers (ex: PETR4 VALE3 BBAS3)"
                                    value={novaAcao}
                                    onChange={(e) => setNovaAcao(e.target.value.toUpperCase())}
                                    onKeyPress={(e) => e.key === 'Enter' && adicionarAcao()}
                                />
                                <Button onClick={adicionarAcao}>Adicionar</Button>
                            </div>

                            <div className="rounded-lg border bg-muted/50 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <Label className="text-base font-semibold">Ações Selecionadas</Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Total:</span>
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                                            {step2Data.acoes_selecionadas.length}
                                        </div>
                                    </div>
                                </div>

                                {step2Data.acoes_selecionadas.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        Nenhuma ação adicionada ainda
                                    </p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {step2Data.acoes_selecionadas.map((ticker) => (
                                            <div
                                                key={ticker}
                                                className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 shadow-sm"
                                            >
                                                <span className="font-medium">{ticker}</span>
                                                <button
                                                    onClick={() => removerAcao(ticker)}
                                                    className="text-red-500 hover:text-red-700 font-bold"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep(1)}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                            </Button>
                            <Button className="flex-1" onClick={handleStep2Next} disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Calcular e Distribuir <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 3 && (
                <div className="space-y-6">
                    <Card className="border-none shadow-none bg-transparent">
                        <div className="flex flex-row items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">Revisão e Ajustes</h2>
                                <p className="text-muted-foreground">Confira os valores, ajuste quantidades ou preços se necessário.</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleAtualizarCotacoes} disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                Atualizar Cotações
                            </Button>
                        </div>

                        {/* Dashboard Financeiro (Modelo Anterior: Barra de Progresso + Cards) */}
                        <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 shadow-sm mb-6 space-y-4">
                            {(() => {
                                const totalInvestido = calcularValorTotalInvestido(distribuicao)
                                const sobra = step1Data.valor_inicial - totalInvestido
                                const percentualInvestido = step1Data.valor_inicial > 0 ? (totalInvestido / step1Data.valor_inicial) * 100 : 0

                                // Agrupamento por categoria para o resumo
                                const perfil = perfis.find(p => p.id === step1Data.perfil_id)
                                const alocacao = distribuicao.reduce((acc, item) => {
                                    if (item.tipo === 'ACAO') acc.ACAO += item.valor_investido
                                    if (item.tipo === 'ETF_INTER') acc.ETF_INTER += item.valor_investido
                                    if (item.tipo === 'ETF_RF') acc.ETF_RF += item.valor_investido
                                    return acc
                                }, { ACAO: 0, ETF_INTER: 0, ETF_RF: 0 })

                                const getPercent = (val: number) => totalInvestido > 0 ? (val / totalInvestido) * 100 : 0

                                return (
                                    <>
                                        {/* Linha 1: Saldo e Patrimônio */}
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-sm font-medium text-slate-500">Saldo em Caixa (Sobra)</p>
                                                <p className={`text-3xl font-bold ${sobra >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    R$ {sobra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-500">Valor Disponível</p>
                                                <p className="text-lg font-bold text-slate-700">R$ {step1Data.valor_inicial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                        </div>

                                        {/* Linha 2: Barra de Progresso */}
                                        <div className="space-y-1">
                                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden flex">
                                                <div
                                                    className={`h-full transition-all duration-300 ${sobra >= 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                                                    style={{ width: `${Math.min(percentualInvestido, 100)}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[10px] font-medium text-slate-500">
                                                <span>Investindo: {percentualInvestido.toFixed(1)}% do total</span>
                                                <span>{sobra >= 0 ? 'Dentro do orçamento' : 'Estourou o orçamento'}</span>
                                            </div>
                                        </div>

                                        {/* Linha 3: Resumo de Alocação */}
                                        {perfil && (
                                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                                                <div className="text-center">
                                                    <p className="text-[10px] text-slate-500 uppercase font-bold">Ações</p>
                                                    <p className={`text-sm font-bold ${Math.abs(getPercent(alocacao.ACAO) - perfil.percentual_acoes) < 5 ? 'text-green-600' : 'text-yellow-600'}`}>
                                                        {getPercent(alocacao.ACAO).toFixed(1)}%
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">Meta: {perfil.percentual_acoes}%</p>
                                                </div>
                                                <div className="text-center border-l border-slate-200">
                                                    <p className="text-[10px] text-slate-500 uppercase font-bold">Exterior</p>
                                                    <p className={`text-sm font-bold ${Math.abs(getPercent(alocacao.ETF_INTER) - perfil.percentual_ivvb) < 5 ? 'text-green-600' : 'text-yellow-600'}`}>
                                                        {getPercent(alocacao.ETF_INTER).toFixed(1)}%
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">Meta: {perfil.percentual_ivvb}%</p>
                                                </div>
                                                <div className="text-center border-l border-slate-200">
                                                    <p className="text-[10px] text-slate-500 uppercase font-bold">Renda Fixa</p>
                                                    <p className={`text-sm font-bold ${Math.abs(getPercent(alocacao.ETF_RF) - perfil.percentual_lftb) < 5 ? 'text-green-600' : 'text-yellow-600'}`}>
                                                        {getPercent(alocacao.ETF_RF).toFixed(1)}%
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">Meta: {perfil.percentual_lftb}%</p>
                                                </div>
                                            </div>
                                        )}

                                        {sobra < 0 && (
                                            <div className="bg-red-50 border border-red-200 p-3 rounded-md flex items-center gap-2 text-red-800 text-sm mt-2">
                                                <div className="bg-red-100 p-1 rounded-full flex-shrink-0">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                                                </div>
                                                <div>
                                                    <strong>Saldo Negativo:</strong> O valor das compras excede o caixa disponível em R$ {Math.abs(sobra).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.
                                                    Certifique-se de ter esse valor extra na corretora.
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )
                            })()}
                        </div>

                        {/* Title Section for Orders */}
                        <div className="flex items-center gap-2 mb-4">
                            <span className="bg-blue-100 p-1.5 rounded-md">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
                            </span>
                            <h3 className="font-semibold text-blue-900">Configuração de Ordens <span className="text-slate-400 font-normal text-sm ml-2">(Ajuste quantidade e preço conforme execução real)</span></h3>
                        </div>

                        {/* Lista de Ativos - Estilo Compra Premium */}
                        <div className="space-y-3 mb-8">
                            {distribuicao.map((item) => (
                                <AtivoCard
                                    key={item.ticker}
                                    item={item}
                                    totalInvestido={calcularValorTotalInvestido(distribuicao)}
                                    onChangeQtd={(novaQtd) => handleUpdateDistribuicaoItem(item.ticker, novaQtd, item.preco_unitario)}
                                    onChangePreco={(novoPreco) => handleUpdateDistribuicaoItem(item.ticker, item.quantidade_calculada, novoPreco)}
                                />
                            ))}
                        </div>

                        {/* Aviso Final */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3 text-yellow-800 mb-6">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold text-sm">Atenção</h4>
                                <p className="text-sm opacity-90">
                                    Ao confirmar, a carteira será criada e essas posições serão registradas como saldo inicial.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t">
                            <Button variant="outline" onClick={() => setStep(2)}>
                                Voltar
                            </Button>
                            <Button
                                size="lg"
                                className="bg-slate-900 hover:bg-slate-800 text-white min-w-[200px]"
                                onClick={handleCriarCarteira}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Confirmar e Finalizar
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}

function AtivoCard({
    item,
    totalInvestido,
    onChangeQtd,
    onChangePreco
}: {
    item: CalculoDistribuicao,
    totalInvestido: number,
    onChangeQtd: (q: number) => void,
    onChangePreco: (p: number) => void
}) {
    // Estado para Calculadora
    const [openCalc, setOpenCalc] = useState(false)
    const [calcLoteQtd, setCalcLoteQtd] = useState(100)
    const [calcLotePreco, setCalcLotePreco] = useState(0)
    const [calcFracQtd, setCalcFracQtd] = useState(0)
    const [calcFracPreco, setCalcFracPreco] = useState(0)

    const aplicarCalculo = () => {
        const tQtd = Number(calcLoteQtd) + Number(calcFracQtd)
        const tVal = (Number(calcLoteQtd) * Number(calcLotePreco)) + (Number(calcFracQtd) * Number(calcFracPreco))

        if (tQtd > 0) {
            const pm = tVal / tQtd
            onChangePreco(Number(pm.toFixed(2)))
            setOpenCalc(false)
            toast.success(`Preço médio R$ ${pm.toFixed(2)} aplicado!`)
        } else {
            toast.error("Quantidade total deve ser maior que zero")
        }
    }

    return (
        <div className="border border-blue-100 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 bg-blue-50/50 hover:bg-blue-50 transition-colors">

            {/* Esquerda: Ticker e Badges */}
            <div className="flex-1 w-full md:w-auto flex items-center gap-3">
                <span className="font-bold text-xl text-slate-900">{item.ticker}</span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${item.tipo === 'ACAO' ? 'bg-white text-blue-700 border-blue-200' : 'bg-white text-green-700 border-green-200'}`}>
                    {item.tipo === 'ACAO' ? 'Ação' : item.tipo === 'ETF_INTER' ? 'Exterior' : 'Renda Fixa'}
                </span>
                <span className="text-xs text-slate-400">
                    {(totalInvestido > 0 ? (item.valor_investido / totalInvestido) * 100 : 0).toFixed(1)}% do portfólio
                </span>
            </div>

            {/* Centro/Direita: Controles */}
            <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">

                {/* Quantidade */}
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Qtd. Compra</span>
                    <div className="flex items-center gap-1 bg-white rounded-lg border shadow-sm p-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-slate-100 text-slate-400"
                            onClick={() => onChangeQtd(Math.max(0, item.quantidade_calculada - 1))}
                        >
                            -
                        </Button>
                        <Input
                            type="number"
                            min="0"
                            value={item.quantidade_calculada}
                            onChange={(e) => onChangeQtd(parseInt(e.target.value) || 0)}
                            className="h-7 w-14 text-center border-none bg-transparent font-bold text-blue-600 focus-visible:ring-0 p-0"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-slate-100 text-slate-400"
                            onClick={() => onChangeQtd(item.quantidade_calculada + 1)}
                        >
                            +
                        </Button>
                    </div>
                </div>

                {/* Preço Pago + Calculadora */}
                <div className="flex flex-col items-start gap-1">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Preço Pago (R$)</span>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                className="h-9 w-32 bg-white font-bold text-slate-900 border-slate-300 pr-2 shadow-sm"
                                value={item.preco_unitario}
                                onChange={(e) => onChangePreco(parseFloat(e.target.value) || 0)}
                            />
                        </div>

                        {/* Dialog da Calculadora */}
                        <Dialog open={openCalc} onOpenChange={setOpenCalc}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9 bg-white text-slate-500 border-slate-300 hover:bg-slate-50" title="Calcular PM (Lote + Fracionário)">
                                    <Calculator className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Calcular Preço Médio</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <Card className="bg-slate-50">
                                        <CardContent className="pt-4">
                                            <Label className="font-bold text-slate-700">Lote Padrão (100)</Label>
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Quant.</Label>
                                                    <Input type="number" value={calcLoteQtd} onChange={(e) => setCalcLoteQtd(Number(e.target.value))} />
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Preço</Label>
                                                    <Input type="number" step="0.01" value={calcLotePreco} onChange={(e) => setCalcLotePreco(Number(e.target.value))} />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-slate-50">
                                        <CardContent className="pt-4">
                                            <Label className="font-bold text-slate-700">Fracionário (1-99)</Label>
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Quant.</Label>
                                                    <Input type="number" value={calcFracQtd} onChange={(e) => setCalcFracQtd(Number(e.target.value))} />
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Preço</Label>
                                                    <Input type="number" step="0.01" value={calcFracPreco} onChange={(e) => setCalcFracPreco(Number(e.target.value))} />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <div className="text-center p-2 bg-blue-50 rounded-lg text-blue-800 font-medium">
                                        PM Estimado: R$ {(() => {
                                            const tQtd = Number(calcLoteQtd) + Number(calcFracQtd)
                                            const tVal = (Number(calcLoteQtd) * Number(calcLotePreco)) + (Number(calcFracQtd) * Number(calcFracPreco))
                                            return tQtd > 0 ? (tVal / tQtd).toFixed(2) : '0.00'
                                        })()}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={aplicarCalculo}>Aplicar Preço Médio</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Total */}
                <div className="flex flex-col items-end min-w-[100px]">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Total</span>
                    <span className="text-xl font-bold text-blue-600">
                        R$ {item.valor_investido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                </div>

            </div>
        </div>
    )
}
