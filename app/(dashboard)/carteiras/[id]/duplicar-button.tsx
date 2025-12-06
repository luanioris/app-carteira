'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { duplicarCarteira } from '../actions'
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

interface DuplicarCarteiraButtonProps {
    carteiraId: string
}

export function DuplicarCarteiraButton({ carteiraId }: DuplicarCarteiraButtonProps) {
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const [novoNome, setNovoNome] = useState('')

    const handleDuplicar = async () => {
        if (!novoNome.trim()) {
            toast.error('Digite um nome para a nova carteira')
            return
        }

        setLoading(true)
        try {
            await duplicarCarteira(carteiraId, novoNome.trim())
            toast.success('Carteira duplicada com sucesso!')
            setOpen(false)
            setNovoNome('')
        } catch (error: any) {
            if (error.message?.includes('NEXT_REDIRECT')) {
                return // Redirecionamento normal
            }
            console.error(error)
            toast.error('Erro ao duplicar carteira')
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    title="Duplicar Carteira"
                >
                    <Copy className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Duplicar Carteira</DialogTitle>
                    <DialogDescription>
                        Crie uma cópia desta carteira para testes ou backup.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="nome">Nome da Nova Carteira</Label>
                        <Input
                            id="nome"
                            placeholder="Ex: Carteira Teste 2025"
                            value={novoNome}
                            onChange={(e) => setNovoNome(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleDuplicar()
                                }
                            }}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleDuplicar}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Duplicando...
                            </>
                        ) : (
                            'Duplicar'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
