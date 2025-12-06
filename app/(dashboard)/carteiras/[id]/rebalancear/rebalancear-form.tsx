'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowRight, AlertTriangle, Calculator } from 'lucide-react'
import { migrarCarteira } from './actions'
import { toast } from 'sonner'

interface AtivoInput {
    ticker: string
    tipo: 'ETF_INTER' | 'ETF_RF' | 'ACAO'
    preco: number
    quantidade?: number
    quantidadeAtual?: number
    isNovo?: boolean
}

interface VendaInput {
    ticker: string
    quantidade: number
    precoUnitario: number
    valorTotal: number
}

export function RebalancearForm({ carteiraAtual, perfis, cotacoesIniciais }: any) {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [novoAporte, setNovoAporte] = useState<string>('')
    const [novoPerfilId, setNovoPerfilId] = useState<string>(carteiraAtual.perfil_id)
    const [ativos, setAtivos] = useState<AtivoInput[]>([])
    const [vendas, setVendas] = useState<VendaInput[]>([])

    const handleNext = () => setStep(s => s + 1)
    const handleBack = () => setStep(s => s - 1)

    // Calcular ativos a vender quando avança para step 4
    const calcularVendas = () => {
        const ativosAntigos = carteiraAtual.posicoes.map((p: any) => p.ticker)
        const ativosNovos = ativos.map((a: any) => a.ticker)
        const ativosAVender = carteiraAtual.posicoes.filter((p: any) => !ativosNovos.includes(p.ticker))

        setVendas(ativosAVender.map((p: any) => ({
            ticker: p.ticker,
            quantidade: p.quantidade,
            precoUnitario: 0, // Usuário vai preencher
            valorTotal: 0
        })))
    }

    const steps = [
        { num: 1, label: 'Definições' },
        { num: 2, label: 'Novos Ativos' },
        { num: 3, label: 'Preços' },
        { num: 4, label: 'Vendas' },
        { num: 5, label: 'Quantidades' },
        { num: 6, label: 'Confirmação' }
    ]

    return (
        <div className="space-y-6">
            {/* Indicador de Progresso */}
            <div className="flex justify-between mb-8 overflow-x-auto">
                {steps.map((s) => (
                    <div key={s.num} className={`flex items-center gap-2 ${step >= s.num ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${step >= s.num ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                            {s.num}
                        </div>
                        <span className="hidden md:inline text-xs font-medium whitespace-nowrap">{s.label}</span>
                    </div>
                ))}
            </div>

            {step === 1 && (
                <StepDefinicoes
                    novoAporte={novoAporte}
                    setNovoAporte={setNovoAporte}
                    novoPerfilId={novoPerfilId}
                    setNovoPerfilId={setNovoPerfilId}
                    perfis={perfis}
                    onNext={handleNext}
                />
            )}

            {step === 2 && (
                <StepSelecaoAtivos
                    ativos={ativos}
                    setAtivos={setAtivos}
                    onNext={handleNext}
                    onBack={handleBack}
                />
            )}

            {step === 3 && (
                <StepPrecos
                    ativos={ativos}
                    setAtivos={setAtivos}
                    cotacoesIniciais={cotacoesIniciais}
                    onNext={() => {
                        calcularVendas()
                        handleNext()
                    }}
                    onBack={handleBack}
                />
            )}

            {step === 4 && (
                <StepVendas
                    vendas={vendas}
                    setVendas={setVendas}
                    onNext={handleNext}
                    onBack={handleBack}
                />
            )}

            {step === 5 && (
                <StepQuantidades
                    carteiraAtual={carteiraAtual}
                    ativos={ativos}
                    setAtivos={setAtivos}
                    vendas={vendas}
                    novoAporte={parseFloat(novoAporte) || 0}
                    novoPerfil={perfis.find((p: any) => p.id === novoPerfilId)}
                    onNext={handleNext}
                    onBack={handleBack}
                />
            )}

            {step === 6 && (
                <StepConfirmacao
                    carteiraAtual={carteiraAtual}
                    novoAporte={parseFloat(novoAporte) || 0}
                    novoPerfil={perfis.find((p: any) => p.id === novoPerfilId)}
                    ativos={ativos}
                    setAtivos={setAtivos}
                    vendas={vendas}
                    loading={loading}
                    cotacoesIniciais={cotacoesIniciais}
                    onConfirm={async () => {
                        setLoading(true)
                        try {
                            const totalVendas = vendas.reduce((sum, v) => sum + v.valorTotal, 0)

                            // Calcular Vendas Parciais (Redução de Posição no Step 5)
                            const vendasParciais = ativos.map((a: any) => {
                                const quantidadeAVender = Math.max(0, (a.quantidadeAtual || 0) - a.quantidade)
                                return {
                                    ...a,
                                    quantidadeAVender,
                                    valorVenda: quantidadeAVender * a.preco
                                }
                            }).filter((a: any) => a.quantidadeAVender > 0)

                            const totalVendasParciais = vendasParciais.reduce((sum: number, a: any) => sum + a.valorVenda, 0)

                            const novosItens = ativos.map((a: any) => ({
                                ticker: a.ticker,
                                tipo: a.tipo,
                                percentual_alvo: 0,
                                quantidade_calculada: a.quantidade || 0,
                                preco_estimado: a.preco
                            }))

                            await migrarCarteira({
                                carteiraAntigaId: carteiraAtual.id,
                                novoAporte: parseFloat(novoAporte) || 0,
                                novoPerfilId: novoPerfilId,
                                novosItens,
                                cotacoesAtuais: cotacoesIniciais
                            })
                            toast.success('Carteira migrada com sucesso!')
                        } catch (error: any) {
                            if (error.message?.includes('NEXT_REDIRECT')) {
                                return // Redirecionamento normal
                            }
                            toast.error('Erro na migração')
                            console.error(error)
                        } finally {
                            setLoading(false)
                        }
                    }}
                    onBack={handleBack}
                />
            )}
        </div>
    )
}

function StepDefinicoes({ novoAporte, setNovoAporte, novoPerfilId, setNovoPerfilId, perfis, onNext }: any) {
    return (
        <Card>
            <CardHeader><CardTitle>Definições Iniciais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label>Novo Aporte (R$)</Label>
                    <Input
                        type="number"
                        value={novoAporte}
                        onChange={e => setNovoAporte(e.target.value)}
                        placeholder="0,00"
                    />
                    <p className="text-sm text-muted-foreground mt-1">Valor adicional que entrará na nova carteira.</p>
                </div>
                <div>
                    <Label>Novo Perfil</Label>
                    <Select value={novoPerfilId} onValueChange={setNovoPerfilId}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {perfis.map((p: any) => (
                                <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex justify-end">
                    <Button onClick={onNext}>Próximo <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
            </CardContent>
        </Card>
    )
}

function StepSelecaoAtivos({ ativos, setAtivos, onNext, onBack }: any) {
    const [inputTicker, setInputTicker] = useState('')

    const addAtivo = (tipo: 'ACAO' | 'ETF_INTER' | 'ETF_RF') => {
        const tickersInput = inputTicker.trim().toUpperCase()
        if (!tickersInput) {
            toast.error('Digite um ou mais tickers')
            return
        }

        // Separar por espaço e filtrar vazios
        const tickers = tickersInput.split(' ').filter(t => t.length > 0)

        let adicionados = 0
        let duplicados = 0

        tickers.forEach(ticker => {
            if (ativos.some((a: any) => a.ticker === ticker)) {
                duplicados++
            } else {
                setAtivos((prev: any) => [...prev, { ticker, tipo, preco: 0 }])
                adicionados++
            }
        })

        setInputTicker('')

        if (adicionados > 0) {
            toast.success(`${adicionados} ativo(s) adicionado(s)`)
        }
        if (duplicados > 0) {
            toast.warning(`${duplicados} ativo(s) já estava(m) na lista`)
        }
    }

    return (
        <Card>
            <CardHeader><CardTitle>Novos Ativos</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Adicionar Ativo(s)</Label>
                    <div className="flex gap-2">
                        <Input
                            value={inputTicker}
                            onChange={e => setInputTicker(e.target.value.toUpperCase())}
                            onKeyPress={(e) => { if (e.key === 'Enter') addAtivo('ACAO') }}
                            placeholder="Ticker (ex: VALE3 PETR4 BBAS3)"
                        />
                        <Button onClick={() => addAtivo('ACAO')}>Add Ação</Button>
                        <Button variant="outline" onClick={() => addAtivo('ETF_INTER')}>Add ETF Inter</Button>
                        <Button variant="outline" onClick={() => addAtivo('ETF_RF')}>Add ETF RF</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Digite um ou mais tickers separados por espaço e clique no tipo correto</p>
                </div>

                <div className="border rounded-md p-4 min-h-[200px]">
                    {ativos.length === 0 && <p className="text-muted-foreground text-center py-8">Nenhum ativo selecionado.</p>}
                    <ul className="space-y-2">
                        {ativos.map((a: any, idx: number) => (
                            <li key={idx} className="flex justify-between items-center bg-muted p-2 rounded">
                                <span className="font-bold">{a.ticker}</span>
                                <span className="text-xs bg-background px-2 py-1 rounded border">
                                    {a.tipo === 'ACAO' ? 'Ação' : a.tipo === 'ETF_INTER' ? 'ETF Inter' : 'ETF RF'}
                                </span>
                                <Button variant="ghost" size="sm" onClick={() => setAtivos(ativos.filter((_: any, i: number) => i !== idx))}>X</Button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex justify-between">
                    <Button variant="outline" onClick={onBack}>Voltar</Button>
                    <Button onClick={onNext} disabled={ativos.length === 0}>Próximo <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
            </CardContent>
        </Card>
    )
}

function StepPrecos({ ativos, setAtivos, cotacoesIniciais, onNext, onBack }: any) {
    const [initialized, setInitialized] = useState(false)
    const [loading, setLoading] = useState(false)

    // Inicializar preços com useEffect
    useState(() => {
        if (!initialized && ativos.length > 0) {
            const novos = ativos.map((a: any) => ({
                ...a,
                preco: a.preco || cotacoesIniciais[a.ticker] || 0
            }))
            setAtivos(novos)
            setInitialized(true)
        }
    })

    // Buscar cotações faltantes
    const buscarCotacoes = async () => {
        const tickersSemPreco = ativos.filter((a: any) => a.preco === 0).map((a: any) => a.ticker)

        if (tickersSemPreco.length === 0) return

        setLoading(true)
        try {
            const response = await fetch(`/api/quotes?tickers=${tickersSemPreco.join(',')}`)
            const data = await response.json()

            if (data.quotes) {
                const novos = ativos.map((a: any) => {
                    if (a.preco === 0) {
                        const quote = data.quotes.find((q: any) => q.symbol === a.ticker)
                        return { ...a, preco: quote?.regularMarketPrice || 0 }
                    }
                    return a
                })
                setAtivos(novos)
                toast.success('Cotações atualizadas!')
            }
        } catch (error) {
            console.error('Erro ao buscar cotações:', error)
            toast.error('Erro ao buscar cotações. Preencha manualmente.')
        } finally {
            setLoading(false)
        }
    }

    const updatePreco = (idx: number, val: string) => {
        const novos = [...ativos]
        novos[idx].preco = parseFloat(val) || 0
        setAtivos(novos)
    }

    const todosPreenchidos = ativos.every((a: any) => a.preco > 0)

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Preços de Compra dos Novos Ativos</CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={buscarCotacoes}
                        disabled={loading}
                    >
                        {loading ? 'Buscando...' : 'Buscar Cotações'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Informe o preço que você pretende pagar por cada ativo</p>
                {ativos.map((a: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4">
                        <div className="w-24 font-bold">{a.ticker}</div>
                        <div className="w-32 text-xs text-muted-foreground">
                            {a.tipo === 'ACAO' ? 'Ação' : a.tipo === 'ETF_INTER' ? 'ETF Inter' : 'ETF RF'}
                        </div>
                        <Input
                            type="number"
                            step="0.01"
                            value={a.preco || ''}
                            onChange={e => updatePreco(idx, e.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                ))}
                {!todosPreenchidos && (
                    <p className="text-sm text-yellow-600">⚠️ Preencha todos os preços antes de continuar</p>
                )}
                <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={onBack}>Voltar</Button>
                    <Button onClick={onNext} disabled={!todosPreenchidos}>Próximo <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
            </CardContent>
        </Card>
    )
}

function StepVendas({ vendas, setVendas, onNext, onBack }: any) {
    const updatePrecoUnitario = (idx: number, val: string) => {
        const novos = [...vendas]
        const preco = parseFloat(val) || 0
        novos[idx].precoUnitario = preco
        novos[idx].valorTotal = preco * novos[idx].quantidade
        setVendas(novos)
    }

    const todosPreenchidos = vendas.length === 0 || vendas.every((v: any) => v.precoUnitario > 0)
    const totalVendas = vendas.reduce((sum: number, v: any) => sum + v.valorTotal, 0)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="text-red-600">🔴</span> Ativos a Vender
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {vendas.length === 0 ? (
                    <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-green-800 font-medium">✅ Nenhum ativo será vendido</p>
                        <p className="text-sm text-green-600 mt-1">Todos os ativos serão mantidos na nova carteira</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="font-bold text-red-900 mb-2">⚠️ Atenção: Ativos que serão VENDIDOS</p>
                            <p className="text-sm text-red-700">
                                Os ativos abaixo não fazem parte da nova carteira e precisam ser vendidos.
                                Informe o <strong>preço unitário</strong> de venda de cada ativo.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {vendas.map((v: any, idx: number) => (
                                <div key={idx} className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-2xl font-bold text-red-900">{v.ticker}</span>
                                                <span className="bg-red-200 text-red-900 px-2 py-1 rounded text-xs font-medium">
                                                    VENDER
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-red-700">
                                                <span className="font-medium">Quantidade a vender:</span>
                                                <span className="bg-white px-3 py-1 rounded font-bold border border-red-300">
                                                    {v.quantidade} {v.quantidade === 1 ? 'unidade' : 'unidades'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="w-64">
                                                <Label className="text-sm font-bold text-red-900">Preço Unitário (R$)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={v.precoUnitario || ''}
                                                    onChange={e => updatePrecoUnitario(idx, e.target.value)}
                                                    placeholder="0,00"
                                                    className="mt-1 text-lg font-bold border-red-300 focus:border-red-500"
                                                />
                                                <p className="text-xs text-red-600 mt-1">Preço por ação vendida</p>
                                            </div>
                                            <div className="w-64 bg-white rounded-lg p-3 border-2 border-green-600">
                                                <p className="text-xs text-green-700 font-medium">Valor Total Recebido</p>
                                                <p className="text-xl font-bold text-green-900">
                                                    R$ {v.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                                <p className="text-xs text-green-600 mt-1">
                                                    {v.quantidade} x R$ {v.precoUnitario.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t-2 border-green-600 pt-4 bg-green-50 rounded-lg p-4">
                            <p className="text-sm text-green-700 font-medium mb-1">💰 Total em Caixa (Vendas):</p>
                            <p className="text-3xl font-bold text-green-900">
                                R$ {totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-green-600 mt-1">Este valor + seu novo aporte = capital para a nova carteira</p>
                        </div>

                        {!todosPreenchidos && (
                            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                <p className="text-sm text-yellow-800 font-medium">
                                    Preencha o preço unitário de venda de todos os ativos antes de continuar
                                </p>
                            </div>
                        )}
                    </>
                )}
                <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={onBack}>Voltar</Button>
                    <Button onClick={onNext} disabled={!todosPreenchidos}>Próximo <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
            </CardContent>
        </Card>
    )
}

function StepQuantidades({ carteiraAtual, ativos, setAtivos, vendas, novoAporte, novoPerfil, onNext, onBack }: any) {
    const [initialized, setInitialized] = useState(false)

    // Calcular capital total disponível (Caixa)
    const totalVendas = vendas.reduce((sum: number, v: any) => sum + v.valorTotal, 0)
    const capitalTotal = totalVendas + novoAporte

    // Inicialização Inteligente (Executa apenas uma vez)
    if (!initialized) {
        // Verificar se já passou pela distribuição inicial (se quantidadeAtual já foi definida)
        const jaFoiInicializado = ativos.some((a: any) => typeof a.quantidadeAtual !== 'undefined')

        if (jaFoiInicializado) {
            setInitialized(true)
        } else {
            // 1. Identificar ativos mantidos vs novos
            ativos.forEach((a: any) => {
                const posicaoAntiga = carteiraAtual.posicoes.find((p: any) => p.ticker === a.ticker)
                a.quantidadeAtual = posicaoAntiga?.quantidade || 0
                a.isNovo = !posicaoAntiga
            })

            // 2. Calcular metas financeiras
            const valorAtualMantidos = ativos.reduce((sum: number, a: any) => sum + (a.quantidadeAtual * a.preco), 0)
            const patrimonioTotalMeta = valorAtualMantidos + capitalTotal

            const metas = {
                ACAO: patrimonioTotalMeta * (novoPerfil.percentual_acoes / 100),
                ETF_INTER: patrimonioTotalMeta * (novoPerfil.percentual_ivvb / 100),
                ETF_RF: patrimonioTotalMeta * (novoPerfil.percentual_lftb / 100)
            }

            // 3. PRIMEIRA PASSADA: Distribuição Igualitária (todos os ativos da categoria com mesmo peso)
            const distribuirPorCategoria = (tipo: 'ACAO' | 'ETF_INTER' | 'ETF_RF', meta: number) => {
                const lista = ativos.filter((a: any) => a.tipo === tipo)
                if (lista.length === 0) return

                // Distribuir o valor da meta IGUALMENTE entre todos os ativos da categoria
                const valorPorAtivo = meta / lista.length

                lista.forEach((a: any) => {
                    // Calcular quantidade ideal para atingir esse valor
                    const quantidadeIdeal = Math.floor(valorPorAtivo / a.preco)
                    a.quantidade = quantidadeIdeal
                })
            }

            distribuirPorCategoria('ACAO', metas.ACAO)
            distribuirPorCategoria('ETF_INTER', metas.ETF_INTER)
            distribuirPorCategoria('ETF_RF', metas.ETF_RF)

            // 4. SEGUNDA PASSADA: Greedy Fill - Consome saldo restante
            let iteracoes = 0
            const MAX_ITERACOES = 200

            while (iteracoes < MAX_ITERACOES) {
                let custoCompras = 0
                let receitaVendas = 0

                ativos.forEach((a: any) => {
                    const diff = a.quantidade - a.quantidadeAtual
                    if (diff > 0) custoCompras += diff * a.preco
                    if (diff < 0) receitaVendas += Math.abs(diff) * a.preco
                })

                const caixaDisponivel = capitalTotal + receitaVendas - custoCompras
                if (caixaDisponivel < 5) break

                const statusCategorias = [
                    { tipo: 'ACAO' as const, meta: metas.ACAO },
                    { tipo: 'ETF_INTER' as const, meta: metas.ETF_INTER },
                    { tipo: 'ETF_RF' as const, meta: metas.ETF_RF }
                ].map(({ tipo, meta }) => {
                    const lista = ativos.filter((a: any) => a.tipo === tipo)
                    const valorAtual = lista.reduce((sum: number, a: any) => sum + (a.quantidade * a.preco), 0)
                    const percentualAtingido = meta > 0 ? (valorAtual / meta) : 1
                    return { tipo, meta, valorAtual, percentualAtingido, lista }
                })

                statusCategorias.sort((a, b) => a.percentualAtingido - b.percentualAtingido)

                let comprouNessaIteracao = false

                for (const categoria of statusCategorias) {
                    if (categoria.percentualAtingido > 1.05) continue

                    const ativosCandidatos = categoria.lista
                        .filter((a: any) => a.preco <= caixaDisponivel)
                        .sort((a: any, b: any) => {
                            const valorA = a.quantidade * a.preco
                            const valorB = b.quantidade * b.preco
                            if (Math.abs(valorA - valorB) > 10) return valorA - valorB
                            return a.preco - b.preco
                        })

                    if (ativosCandidatos.length > 0) {
                        ativosCandidatos[0].quantidade += 1
                        comprouNessaIteracao = true
                        break
                    }
                }

                if (!comprouNessaIteracao) break
                iteracoes++
            }

            // 5. Verificação Final de Segurança
            let custoFinal = 0
            let receitaFinal = 0
            ativos.forEach((a: any) => {
                const diff = a.quantidade - a.quantidadeAtual
                if (diff > 0) custoFinal += diff * a.preco
                if (diff < 0) receitaFinal += Math.abs(diff) * a.preco
            })

            while (custoFinal > (capitalTotal + receitaFinal)) {
                const ativosComprados = ativos.filter((a: any) => a.quantidade > a.quantidadeAtual)
                if (ativosComprados.length === 0) break

                ativosComprados.sort((a: any, b: any) => b.preco - a.preco)
                ativosComprados[0].quantidade -= 1

                custoFinal = 0
                receitaFinal = 0
                ativos.forEach((a: any) => {
                    const diff = a.quantidade - a.quantidadeAtual
                    if (diff > 0) custoFinal += diff * a.preco
                    if (diff < 0) receitaFinal += Math.abs(diff) * a.preco
                })
            }

            setAtivos([...ativos])
            setInitialized(true)
        }
    }

    const updateQuantidade = (idx: number, val: string) => {
        const novos = [...ativos]
        novos[idx].quantidade = parseInt(val) || 0
        setAtivos(novos)
    }

    // Cálculos Reativos (Atualizam a cada render/mudança)
    const totalInvestimento = ativos.reduce((sum: number, a: any) => {
        const compras = Math.max(0, a.quantidade - (a.quantidadeAtual || 0))
        return sum + (compras * a.preco)
    }, 0)

    const totalVendasExtras = ativos.reduce((sum: number, a: any) => {
        const vendas = Math.max(0, (a.quantidadeAtual || 0) - a.quantidade)
        return sum + (vendas * a.preco)
    }, 0)

    const caixaDisponivelReal = capitalTotal + totalVendasExtras
    const saldoFinalCaixa = caixaDisponivelReal - totalInvestimento

    const valorTotalCarteiraProjetado = ativos.reduce((sum: number, a: any) => sum + (a.quantidade * a.preco), 0) + saldoFinalCaixa

    const alocacao = ativos.reduce((acc: any, a: any) => {
        const valor = a.quantidade * a.preco
        if (a.tipo === 'ACAO') acc.ACAO += valor
        if (a.tipo === 'ETF_INTER') acc.ETF_INTER += valor
        if (a.tipo === 'ETF_RF') acc.ETF_RF += valor
        return acc
    }, { ACAO: 0, ETF_INTER: 0, ETF_RF: 0 })

    const getPercentual = (valor: number) => valorTotalCarteiraProjetado > 0 ? (valor / valorTotalCarteiraProjetado * 100) : 0

    const ativosManutencao = ativos.filter((a: any) => !a.isNovo)
    const ativosNovos = ativos.filter((a: any) => a.isNovo)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Distribuição da Nova Carteira</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Painel de Controle Financeiro */}
                <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 shadow-sm sticky top-4 z-10 space-y-4">

                    {/* Linha 1: Saldo e Patrimônio */}
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Saldo em Caixa (Projetado)</p>
                            <p className={`text-3xl font-bold ${saldoFinalCaixa >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                R$ {saldoFinalCaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-500">Patrimônio Total</p>
                            <p className="text-lg font-bold text-slate-700">R$ {valorTotalCarteiraProjetado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>

                    {/* Linha 2: Barra de Progresso do Caixa */}
                    <div className="space-y-1">
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden flex">
                            <div
                                className="bg-blue-500 h-full transition-all duration-300"
                                style={{ width: `${Math.min((totalInvestimento / caixaDisponivelReal) * 100, 100)}%` }}
                            />
                            {saldoFinalCaixa < 0 && <div className="bg-red-500 h-full flex-1 animate-pulse" />}
                        </div>
                        <div className="flex justify-between text-[10px] font-medium text-slate-500">
                            <span>Investindo: {((totalInvestimento / caixaDisponivelReal) * 100).toFixed(1)}% do caixa</span>
                            <span>{saldoFinalCaixa >= 0 ? 'Dentro do orçamento' : 'Estourou o orçamento'}</span>
                        </div>
                    </div>

                    {/* Linha 3: Resumo de Alocação */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                        <div className="text-center">
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Ações</p>
                            <p className={`text-sm font-bold ${Math.abs(getPercentual(alocacao.ACAO) - novoPerfil.percentual_acoes) < 5 ? 'text-green-600' : 'text-yellow-600'}`}>
                                {getPercentual(alocacao.ACAO).toFixed(1)}%
                            </p>
                            <p className="text-[10px] text-slate-400">Meta: {novoPerfil.percentual_acoes}%</p>
                        </div>
                        <div className="text-center border-l border-slate-200">
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Ações Americanas</p>
                            <p className={`text-sm font-bold ${Math.abs(getPercentual(alocacao.ETF_INTER) - novoPerfil.percentual_ivvb) < 5 ? 'text-green-600' : 'text-yellow-600'}`}>
                                {getPercentual(alocacao.ETF_INTER).toFixed(1)}%
                            </p>
                            <p className="text-[10px] text-slate-400">Meta: {novoPerfil.percentual_ivvb}%</p>
                        </div>
                        <div className="text-center border-l border-slate-200">
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Renda Fixa</p>
                            <p className={`text-sm font-bold ${Math.abs(getPercentual(alocacao.ETF_RF) - novoPerfil.percentual_lftb) < 5 ? 'text-green-600' : 'text-yellow-600'}`}>
                                {getPercentual(alocacao.ETF_RF).toFixed(1)}%
                            </p>
                            <p className="text-[10px] text-slate-400">Meta: {novoPerfil.percentual_lftb}%</p>
                        </div>
                    </div>

                    {saldoFinalCaixa < 0 && (
                        <div className="bg-red-100 text-red-800 text-xs font-bold p-2 rounded text-center">
                            ⚠️ Faltam R$ {Math.abs(saldoFinalCaixa).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                    )}
                </div>

                {/* Lista de Ativos */}
                <div className="space-y-6">
                    {/* Ativos Mantidos */}
                    {ativosManutencao.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="font-bold text-lg flex items-center gap-2"><span className="text-blue-500">●</span> Ativos Mantidos</h3>
                            {ativosManutencao.map((a: any, idx: number) => {
                                const ativoIdx = ativos.findIndex((at: any) => at.ticker === a.ticker)
                                const diferenca = a.quantidade - a.quantidadeAtual
                                const valorOperacao = Math.abs(diferenca) * a.preco
                                const percentual = getPercentual(a.quantidade * a.preco)

                                return (
                                    <AtivoCard
                                        key={idx}
                                        ativo={a}
                                        diferenca={diferenca}
                                        valorOperacao={valorOperacao}
                                        percentual={percentual}
                                        onChange={(val: string) => updateQuantidade(ativoIdx, val)}
                                    />
                                )
                            })}
                        </div>
                    )}

                    {/* Ativos Novos */}
                    {ativosNovos.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="font-bold text-lg flex items-center gap-2"><span className="text-green-500">●</span> Novos Ativos</h3>
                            {ativosNovos.map((a: any, idx: number) => {
                                const ativoIdx = ativos.findIndex((at: any) => at.ticker === a.ticker)
                                const diferenca = a.quantidade
                                const valorOperacao = diferenca * a.preco
                                const percentual = getPercentual(a.quantidade * a.preco)

                                return (
                                    <AtivoCard
                                        key={idx}
                                        ativo={a}
                                        diferenca={diferenca}
                                        valorOperacao={valorOperacao}
                                        isNovo={true}
                                        percentual={percentual}
                                        onChange={(val: string) => updateQuantidade(ativoIdx, val)}
                                    />
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="flex justify-between mt-6 pt-4 border-t">
                    <Button variant="outline" onClick={onBack}>Voltar</Button>
                    <Button
                        onClick={onNext}
                        disabled={saldoFinalCaixa < -10}
                        className={saldoFinalCaixa < -10 ? "opacity-50 cursor-not-allowed" : ""}
                    >
                        Próximo <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}



function StepConfirmacao({ carteiraAtual, novoAporte, novoPerfil, ativos, setAtivos, vendas, loading, onConfirm, onBack }: any) {
    const totalVendasIniciais = vendas.reduce((sum: number, v: any) => sum + v.valorTotal, 0)

    const compras = ativos.map((a: any) => {
        const quantidadeAComprar = Math.max(0, a.quantidade - (a.quantidadeAtual || 0))
        return {
            ...a,
            quantidadeAComprar,
            valorCompra: quantidadeAComprar * a.preco
        }
    }).filter((a: any) => a.quantidadeAComprar > 0)

    const vendasParciais = ativos.map((a: any) => {
        const quantidadeAVender = Math.max(0, (a.quantidadeAtual || 0) - a.quantidade)
        return {
            ...a,
            quantidadeAVender,
            valorVenda: quantidadeAVender * a.preco
        }
    }).filter((a: any) => a.quantidadeAVender > 0)

    const totalInvestimento = compras.reduce((sum: number, a: any) => sum + a.valorCompra, 0)
    const totalVendasParciais = vendasParciais.reduce((sum: number, a: any) => sum + a.valorVenda, 0)

    const saldoFinal = (totalVendasIniciais + novoAporte + totalVendasParciais) - totalInvestimento

    const updatePrecoFinal = (ticker: string, val: string) => {
        const novos = ativos.map((a: any) => {
            if (a.ticker === ticker) {
                return { ...a, preco: parseFloat(val) || 0 }
            }
            return a
        })
        setAtivos(novos)
    }

    const updateQuantidadeCompra = (ticker: string, novaQtdCompra: number) => {
        if (novaQtdCompra < 0) return

        const novos = ativos.map((a: any) => {
            if (a.ticker === ticker) {
                // A nova quantidade total será a quantidade atual (mantida) + a nova compra
                const novaQuantidadeTotal = (a.quantidadeAtual || 0) + novaQtdCompra
                return { ...a, quantidade: novaQuantidadeTotal }
            }
            return a
        })
        setAtivos(novos)
    }

    const updateQuantidadeVenda = (ticker: string, novaQtdVenda: number) => {
        if (novaQtdVenda < 0) return

        const novos = ativos.map((a: any) => {
            if (a.ticker === ticker) {
                // A nova quantidade total será a quantidade atual - a venda
                const novaQuantidadeTotal = (a.quantidadeAtual || 0) - novaQtdVenda
                // Garantir que não fique negativo
                return { ...a, quantidade: Math.max(0, novaQuantidadeTotal) }
            }
            return a
        })
        setAtivos(novos)
    }

    // Estado para calculadora de PM
    const [calculadoraAberta, setCalculadoraAberta] = useState<string | null>(null)
    const [lotePadrao, setLotePadrao] = useState({ qtd: 0, preco: 0 })
    const [fracionario, setFracionario] = useState({ qtd: 0, preco: 0 })

    const abrirCalculadora = (ticker: string, quantidadeTotal: number, precoAtual: number) => {
        setCalculadoraAberta(ticker)
        // Sugerir divisão inteligente: múltiplos de 100 no lote padrão
        const qtdPadrao = Math.floor(quantidadeTotal / 100) * 100
        const qtdFrac = quantidadeTotal - qtdPadrao
        setLotePadrao({ qtd: qtdPadrao, preco: precoAtual })
        setFracionario({ qtd: qtdFrac, preco: precoAtual })
    }

    const calcularPM = () => {
        const totalQtd = lotePadrao.qtd + fracionario.qtd
        if (totalQtd === 0) return 0
        const valorTotal = (lotePadrao.qtd * lotePadrao.preco) + (fracionario.qtd * fracionario.preco)
        return valorTotal / totalQtd
    }

    const aplicarPM = (ticker: string) => {
        const pm = calcularPM()
        updatePrecoFinal(ticker, pm.toFixed(2))
        setCalculadoraAberta(null)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Confirmação e Ajuste Final</CardTitle>
                <CardDescription>
                    Confira as operações e ajuste os valores reais executados se necessário.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Resumo Financeiro */}
                <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                        <p className="text-xs text-muted-foreground">Caixa Inicial + Aporte</p>
                        <p className="text-lg font-bold text-slate-700">
                            R$ {(totalVendasIniciais + novoAporte).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Gerado com Vendas</p>
                        <p className="text-lg font-bold text-green-600">
                            + R$ {totalVendasParciais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Total em Compras</p>
                        <p className="text-lg font-bold text-blue-700">
                            - R$ {totalInvestimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Saldo Final (Caixa)</p>
                        <p className={`text-lg font-bold ${saldoFinal >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            R$ {saldoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {saldoFinal < 0 && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-md flex items-center gap-2 text-red-800 text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        <p>
                            <strong>Saldo Negativo:</strong> O valor das compras excede o caixa disponível em R$ {Math.abs(saldoFinal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.
                            Certifique-se de aportar esse valor extra na corretora.
                        </p>
                    </div>
                )}

                {/* Lista de Vendas Parciais */}
                {vendasParciais.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="font-bold flex items-center gap-2 text-red-700">
                            📉 Ordens de Venda (Rebalanceamento)
                            <span className="text-xs font-normal text-muted-foreground text-black">(Ajuste quantidade e preço conforme execução real)</span>
                        </h3>
                        <div className="space-y-2">
                            {vendasParciais.map((a: any) => (
                                <div key={a.ticker} className="flex items-center gap-4 p-3 border border-red-200 bg-red-50 rounded-lg">
                                    <div className="w-20 font-bold text-lg">{a.ticker}</div>

                                    {/* Controle de Quantidade */}
                                    <div className="flex-1 flex flex-col justify-center">
                                        <Label className="text-xs text-muted-foreground mb-1">Qtd. Venda</Label>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => updateQuantidadeVenda(a.ticker, a.quantidadeAVender - 1)}
                                            >
                                                -
                                            </Button>
                                            <span className="font-bold text-red-700 w-12 text-center text-lg">{a.quantidadeAVender}</span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => updateQuantidadeVenda(a.ticker, a.quantidadeAVender + 1)}
                                            >
                                                +
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Controle de Preço */}
                                    <div className="w-32">
                                        <Label className="text-xs text-muted-foreground">Preço Venda (R$)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={a.preco || ''}
                                            onChange={e => updatePrecoFinal(a.ticker, e.target.value)}
                                            className="h-9 font-bold bg-white mt-1"
                                        />
                                    </div>

                                    <div className="w-32 text-right">
                                        <div className="text-xs text-muted-foreground">Total</div>
                                        <div className="font-bold text-red-700 text-lg">
                                            R$ {a.valorVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Lista de Compras */}
                <div className="space-y-4">
                    <h3 className="font-bold flex items-center gap-2 text-blue-700">
                        🛒 Ordens de Compra
                        <span className="text-xs font-normal text-muted-foreground text-black">(Ajuste quantidade e preço conforme execução real)</span>
                    </h3>

                    {compras.length === 0 ? (
                        <p className="text-muted-foreground text-sm italic">Nenhuma compra necessária.</p>
                    ) : (
                        <div className="space-y-2">
                            {compras.map((a: any) => (
                                <div key={a.ticker} className="flex items-center gap-4 p-3 border border-blue-200 bg-blue-50 rounded-lg">
                                    <div className="w-20 font-bold text-lg">{a.ticker}</div>

                                    {/* Controle de Quantidade */}
                                    <div className="flex-1 flex flex-col justify-center">
                                        <Label className="text-xs text-muted-foreground mb-1">Qtd. Compra</Label>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => updateQuantidadeCompra(a.ticker, a.quantidadeAComprar - 1)}
                                            >
                                                -
                                            </Button>
                                            <span className="font-bold text-blue-700 w-12 text-center text-lg">{a.quantidadeAComprar}</span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => updateQuantidadeCompra(a.ticker, a.quantidadeAComprar + 1)}
                                            >
                                                +
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Controle de Preço com Calculadora */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1">
                                                <Label className="text-xs text-muted-foreground">Preço Pago (R$)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={a.preco || ''}
                                                    onChange={e => updatePrecoFinal(a.ticker, e.target.value)}
                                                    className="h-9 font-bold bg-white mt-1"
                                                />
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-9 w-9 mt-5"
                                                onClick={() => calculadoraAberta === a.ticker
                                                    ? setCalculadoraAberta(null)
                                                    : abrirCalculadora(a.ticker, a.quantidadeAComprar, a.preco)}
                                                title="Calcular PM (Lote + Fracionário)"
                                            >
                                                <Calculator className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* Calculadora Expandida */}
                                        {calculadoraAberta === a.ticker && (
                                            <div className="mt-3 p-3 bg-white border border-blue-300 rounded-lg space-y-2">
                                                <p className="text-xs font-bold text-blue-900">Calculadora de PM</p>

                                                {/* Lote Padrão */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <Label className="text-[10px] text-muted-foreground">Qtd. Padrão</Label>
                                                        <Input
                                                            type="number"
                                                            value={lotePadrao.qtd}
                                                            onChange={e => setLotePadrao({ ...lotePadrao, qtd: parseInt(e.target.value) || 0 })}
                                                            className="h-8 text-xs"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px] text-muted-foreground">Preço Padrão</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={lotePadrao.preco}
                                                            onChange={e => setLotePadrao({ ...lotePadrao, preco: parseFloat(e.target.value) || 0 })}
                                                            className="h-8 text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Fracionário */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <Label className="text-[10px] text-muted-foreground">Qtd. Fracionário</Label>
                                                        <Input
                                                            type="number"
                                                            value={fracionario.qtd}
                                                            onChange={e => setFracionario({ ...fracionario, qtd: parseInt(e.target.value) || 0 })}
                                                            className="h-8 text-xs"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px] text-muted-foreground">Preço Fracionário</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={fracionario.preco}
                                                            onChange={e => setFracionario({ ...fracionario, preco: parseFloat(e.target.value) || 0 })}
                                                            className="h-8 text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                {/* PM Calculado */}
                                                <div className="pt-2 border-t">
                                                    <p className="text-xs text-muted-foreground">Preço Médio:</p>
                                                    <p className="text-lg font-bold text-blue-700">R$ {calcularPM().toFixed(2)}</p>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    className="w-full h-8 text-xs"
                                                    onClick={() => aplicarPM(a.ticker)}
                                                >
                                                    Aplicar PM
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="w-32 text-right">
                                        <div className="text-xs text-muted-foreground">Total</div>
                                        <div className="font-bold text-blue-700 text-lg">
                                            R$ {(a.quantidadeAComprar * a.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 text-yellow-800 text-sm flex gap-2">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <div>
                        <p className="font-bold">Atenção</p>
                        <p>Ao confirmar, a carteira antiga será arquivada e a nova carteira será criada com esses ativos e preços.</p>
                    </div>
                </div>

                <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={onBack} disabled={loading}>Voltar</Button>
                    <Button onClick={onConfirm} disabled={loading}>
                        {loading ? 'Processando...' : 'Confirmar e Finalizar'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

function AtivoCard({ ativo, diferenca, valorOperacao, isNovo, percentual, onChange }: any) {
    return (
        <div className={`border rounded-lg p-3 flex items-center justify-between gap-4 ${diferenca > 0 ? 'bg-green-50 border-green-200' : diferenca < 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50'}`}>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{ativo.ticker}</span>
                    <span className="text-xs bg-white px-2 py-0.5 rounded border font-medium text-slate-600">
                        {percentual?.toFixed(2)}%
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs mt-1">
                    <span className="text-muted-foreground">R$ {ativo.preco.toFixed(2)}</span>
                    <span className="text-slate-300">|</span>
                    {diferenca > 0 ? (
                        <span className="text-green-700 font-bold">Comprar +{diferenca} (R$ {valorOperacao.toFixed(2)})</span>
                    ) : diferenca < 0 ? (
                        <span className="text-red-700 font-bold">Vender {diferenca} (R$ {valorOperacao.toFixed(2)})</span>
                    ) : (
                        <span className="text-slate-500">Manter posição</span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 bg-white rounded-lg border p-1 shadow-sm">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-slate-100"
                    onClick={() => onChange(String(Math.max(0, ativo.quantidade - 1)))}
                >
                    -
                </Button>
                <Input
                    type="number"
                    value={ativo.quantidade}
                    onChange={e => onChange(e.target.value)}
                    className="w-16 text-center border-none h-8 font-bold text-lg focus-visible:ring-0"
                />
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-slate-100"
                    onClick={() => onChange(String(ativo.quantidade + 1))}
                >
                    +
                </Button>
            </div>
        </div>
    )
}
