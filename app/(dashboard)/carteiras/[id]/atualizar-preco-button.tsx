'use client'

import { useState } from 'react'
import { Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { atualizarPrecoManual } from '../actions'
import { toast } from 'sonner'

interface AtualizarPrecoButtonProps {
    carteiraId: string
    ticker: string
    precoAtual: number
}

export function AtualizarPrecoButton({ carteiraId, ticker, precoAtual }: AtualizarPrecoButtonProps) {
    const [open, setOpen] = useState(false)
    const [preco, setPreco] = useState(precoAtual.toFixed(2))
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const novoPreco = parseFloat(preco)

        if (isNaN(novoPreco) || novoPreco <= 0) {
            toast.error('Preço inválido')
            return
        }

        setLoading(true)
        try {
            await atualizarPrecoManual(carteiraId, ticker, novoPreco)
            toast.success('Preço atualizado com sucesso!')
            setOpen(false)
        } catch (error) {
            toast.error('Erro ao atualizar preço')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Atualizar Preço - {ticker}</DialogTitle>
                        <DialogDescription>
                            Este ativo não possui cotação automática. Informe o preço atual manualmente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="preco" className="text-right">
                                Preço (R$)
                            </Label>
                            <Input
                                id="preco"
                                type="number"
                                step="0.01"
                                value={preco}
                                onChange={(e) => setPreco(e.target.value)}
                                className="col-span-3"
                                disabled={loading}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Atualizando...' : 'Atualizar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
