'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { realizarAporte } from './actions'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

interface Posicao {
    ticker: string
    tipo: string
    quantidade: number
    preco_medio: number
}

interface Carteira {
    id: string
    nome: string
    posicoes: Posicao[]
}

interface NovoAporteFormProps {
    carteira: Carteira
    cotacoesAtuais: Record<string, number>
}

interface ItemAporte {
    ticker: string
    quantidade: number
    preco: number
}

export function NovoAporteForm({ carteira, cotacoesAtuais }: NovoAporteFormProps) {
    const router = useRouter()
    const [valorAporte, setValorAporte] = useState<string>('')
    const [loading, setLoading] = useState(false)

    // Estado dos itens do aporte (inicialmente vazio)
    const [itens, setItens] = useState<Record<string, ItemAporte>>({})

    // Inicializar itens com preço atual
    useEffect(() => {
        const initialItens: Record<string, ItemAporte> = {}
        carteira.posicoes.forEach(pos => {
            initialItens[pos.ticker] = {
                ticker: pos.ticker,
                quantidade: 0,
                preco: cotacoesAtuais[pos.ticker] || pos.preco_medio
            }
        })
        setItens(initialItens)
    }, [carteira, cotacoesAtuais])

    const handleQuantidadeChange = (ticker: string, qtd: string) => {
        const quantidade = parseFloat(qtd) || 0
        setItens(prev => ({
            ...prev,
            [ticker]: { ...prev[ticker], quantidade }
        }))
    }

    const handlePrecoChange = (ticker: string, prc: string) => {
        const preco = parseFloat(prc) || 0
        setItens(prev => ({
            ...prev,
            [ticker]: { ...prev[ticker], preco }
        }))
    }

    // Cálculos
    const totalAporte = parseFloat(valorAporte) || 0
    const totalAlocado = Object.values(itens).reduce((sum, item) => sum + (item.quantidade * item.preco), 0)
    const restante = totalAporte - totalAlocado

    const handleSubmit = async () => {
        if (totalAporte <= 0) {
            toast.error('Informe o valor do aporte')
            return
        }

        if (totalAlocado <= 0) {
            toast.error('Aloque o valor em pelo menos um ativo')
            return
        }

        if (Math.abs(restante) > 0.01) { // Margem de erro de 1 centavo
            toast.error(`O valor alocado (R$ ${totalAlocado.toFixed(2)}) deve ser igual ao valor do aporte (R$ ${totalAporte.toFixed(2)})`)
            return
        }

        setLoading(true)
        try {
            // Filtrar apenas itens com quantidade > 0
            const itensValidos = Object.values(itens).filter(i => i.quantidade > 0)

            await realizarAporte(carteira.id, totalAporte, itensValidos)
            toast.success('Aporte realizado com sucesso!')
            router.push(`/carteiras/${carteira.id}`)
        } catch (error) {
            toast.error('Erro ao realizar aporte')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Valor do Aporte</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="valor">Valor Total (R$)</Label>
                            <Input
                                id="valor"
                                type="number"
                                placeholder="0,00"
                                value={valorAporte}
                                onChange={(e) => setValorAporte(e.target.value)}
                                className="text-lg font-bold"
                            />
                        </div>
                        <div className="flex-1 text-right">
                            <div className="text-sm text-muted-foreground">Restante a alocar</div>
                            <div className={`text-2xl font-bold ${restante < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                R$ {restante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Alocação nos Ativos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {carteira.posicoes.map((pos) => (
                            <div key={pos.ticker} className="flex items-center gap-4 p-4 border rounded-lg">
                                <div className="w-24 font-bold">{pos.ticker}</div>
                                <div className="w-24">
                                    <Badge variant="outline">
                                        {pos.tipo === 'ETF_INTER' ? 'ETF Inter' :
                                            pos.tipo === 'ETF_RF' ? 'ETF RF' : 'Ação'}
                                    </Badge>
                                </div>

                                <div className="flex-1 grid grid-cols-3 gap-4">
                                    <div>
                                        <Label className="text-xs">Qtd Atual</Label>
                                        <div className="text-sm font-medium">{pos.quantidade}</div>
                                    </div>
                                    <div>
                                        <Label className="text-xs" htmlFor={`qtd-${pos.ticker}`}>Qtd a Comprar</Label>
                                        <Input
                                            id={`qtd-${pos.ticker}`}
                                            type="number"
                                            min="0"
                                            step="1" // Assumindo mercado fracionário ou padrão, mas permitindo inteiros por enquanto. Se for fracionário, mudar step.
                                            value={itens[pos.ticker]?.quantidade || ''}
                                            onChange={(e) => handleQuantidadeChange(pos.ticker, e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs" htmlFor={`preco-${pos.ticker}`}>Preço Compra</Label>
                                        <Input
                                            id={`preco-${pos.ticker}`}
                                            type="number"
                                            step="0.01"
                                            value={itens[pos.ticker]?.preco || ''}
                                            onChange={(e) => handlePrecoChange(pos.ticker, e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="w-32 text-right">
                                    <Label className="text-xs">Total</Label>
                                    <div className="font-bold">
                                        R$ {((itens[pos.ticker]?.quantidade || 0) * (itens[pos.ticker]?.preco || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
                <Link href={`/carteiras/${carteira.id}`}>
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Cancelar
                    </Button>
                </Link>
                <Button onClick={handleSubmit} disabled={loading}>
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? 'Processando...' : 'Confirmar Aporte'}
                </Button>
            </div>
        </div>
    )
}
