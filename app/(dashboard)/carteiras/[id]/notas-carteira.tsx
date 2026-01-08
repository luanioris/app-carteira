'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { StickyNote, Save } from 'lucide-react'
import { atualizarNotas } from '../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface NotasCarteiraProps {
    carteiraId: string
    notasIniciais: string | null
}

export function NotasCarteira({ carteiraId, notasIniciais }: NotasCarteiraProps) {
    const [notas, setNotas] = useState(notasIniciais || '')
    const [loading, setLoading] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)
    const router = useRouter()

    // Atualiza o estado local se vierem novas props (ex: revalidate)
    useEffect(() => {
        setNotas(notasIniciais || '')
        setHasChanges(false)
    }, [notasIniciais])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotas(e.target.value)
        setHasChanges(e.target.value !== (notasIniciais || ''))
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            await atualizarNotas(carteiraId, notas)
            toast.success('Notas salvas com sucesso!')
            setHasChanges(false)
            router.refresh()
        } catch (error) {
            toast.error('Erro ao salvar notas')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <StickyNote className="h-4 w-4" />
                        Anotações
                    </CardTitle>
                    <CardDescription>
                        Registre observações, estratégias ou lembretes sobre esta carteira.
                    </CardDescription>
                </div>
                {hasChanges && (
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={loading}
                        className="animate-fade-in"
                    >
                        <Save className="mr-2 h-4 w-4" />
                        {loading ? 'Salvando...' : 'Salvar'}
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                <Textarea
                    placeholder="Escreva suas anotações aqui..."
                    className="min-h-[120px] resize-y"
                    value={notas}
                    onChange={handleChange}
                />
            </CardContent>
        </Card>
    )
}
