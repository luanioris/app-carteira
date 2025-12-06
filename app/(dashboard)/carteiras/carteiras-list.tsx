'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TrendingUp, Archive } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface Carteira {
    id: string
    nome: string
    ativa: boolean
    created_at: string
    data_encerramento?: string
    perfis?: { nome: string }
    posicoes?: Array<{ quantidade: number; preco_medio: number }>
}

interface CarteirasListProps {
    carteiras: Carteira[]
}

export function CarteirasList({ carteiras }: CarteirasListProps) {
    const [filtro, setFiltro] = useState<'ATIVAS' | 'INATIVAS' | 'TODAS'>('ATIVAS')

    const carteirasFiltradas = carteiras.filter(c => {
        if (filtro === 'ATIVAS') return c.ativa
        if (filtro === 'INATIVAS') return !c.ativa
        return true
    })

    return (
        <div className="space-y-4">
            {/* Filtro */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {carteirasFiltradas.length} {carteirasFiltradas.length === 1 ? 'carteira' : 'carteiras'}
                </p>
                <Select value={filtro} onValueChange={(v) => setFiltro(v as any)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ATIVAS">Carteiras Ativas</SelectItem>
                        <SelectItem value="INATIVAS">Carteiras Fechadas</SelectItem>
                        <SelectItem value="TODAS">Todas</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Lista */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {carteirasFiltradas.map((carteira) => (
                    <Link key={carteira.id} href={`/carteiras/${carteira.id}`}>
                        <Card className="hover:bg-accent transition-colors cursor-pointer relative">
                            {!carteira.ativa && (
                                <div className="absolute top-3 right-3">
                                    <Badge variant="secondary" className="gap-1">
                                        <Archive className="h-3 w-3" />
                                        Fechada
                                    </Badge>
                                </div>
                            )}
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 pr-16">
                                        <CardTitle>{carteira.nome}</CardTitle>
                                        <CardDescription>
                                            {carteira.perfis?.nome || 'Sem perfil'}
                                        </CardDescription>
                                    </div>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                        <TrendingUp className="h-5 w-5 text-primary" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Valor Investido:</span>
                                        <span className="font-medium">
                                            R$ {(carteira.posicoes?.reduce((s: number, p: any) => s + (p.quantidade * p.preco_medio), 0) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            {carteira.ativa ? 'Criada em:' : 'Encerrada em:'}
                                        </span>
                                        <span className="font-medium">
                                            {new Date(carteira.ativa ? carteira.created_at : (carteira.data_encerramento || carteira.created_at)).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}
