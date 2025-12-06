'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { registrarProvento } from '../actions'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

interface NovoProventoFormProps {
    carteira: {
        id: string
        nome: string
        posicoes: { ticker: string, tipo: string }[]
    }
}

export function NovoProventoForm({ carteira }: NovoProventoFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const [ticker, setTicker] = useState('')
    const [valor, setValor] = useState('')
    const [data, setData] = useState(new Date().toISOString().split('T')[0])
    const [reinvestido, setReinvestido] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!ticker) {
            toast.error('Selecione um ativo')
            return
        }
        if (!valor || parseFloat(valor) <= 0) {
            toast.error('Informe um valor válido')
            return
        }
        if (!data) {
            toast.error('Informe a data')
            return
        }

        setLoading(true)
        try {
            await registrarProvento({
                carteiraId: carteira.id,
                ticker,
                valor: parseFloat(valor),
                data,
                reinvestido
            })
            toast.success('Provento registrado com sucesso!')
            router.push(`/carteiras/${carteira.id}/proventos`)
        } catch (error) {
            toast.error('Erro ao registrar provento')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="ativo">Ativo</Label>
                            <Select value={ticker} onValueChange={setTicker}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o ativo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {carteira.posicoes.map((pos) => (
                                        <SelectItem key={pos.ticker} value={pos.ticker}>
                                            {pos.ticker}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="valor">Valor Recebido (R$)</Label>
                            <Input
                                id="valor"
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                value={valor}
                                onChange={(e) => setValor(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="data">Data do Recebimento</Label>
                            <Input
                                id="data"
                                type="date"
                                value={data}
                                onChange={(e) => setData(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="reinvestido"
                                checked={reinvestido}
                                onCheckedChange={(checked) => setReinvestido(checked as boolean)}
                            />
                            <Label htmlFor="reinvestido" className="font-normal cursor-pointer">
                                Este valor foi reinvestido? (Apenas informativo)
                            </Label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <Link href={`/carteiras/${carteira.id}/proventos`}>
                            <Button variant="outline" type="button">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Cancelar
                            </Button>
                        </Link>
                        <Button type="submit" disabled={loading}>
                            <Save className="mr-2 h-4 w-4" />
                            {loading ? 'Salvando...' : 'Registrar'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
