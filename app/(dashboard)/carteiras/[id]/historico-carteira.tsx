'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpCircle, Banknote, History, Wallet, Search, Filter } from "lucide-react"

interface Transacao {
    id: string
    tipo: string
    ticker: string
    quantidade: number
    preco_unitario: number
    valor_total: number
    data: string
}

interface Provento {
    id: string
    ticker: string
    valor: number
    data: string
    reinvestido: boolean
}

interface HistoricoCarteiraProps {
    transacoes: Transacao[]
    proventos: Provento[]
}

export function HistoricoCarteira({ transacoes, proventos }: HistoricoCarteiraProps) {
    const [filtroTicker, setFiltroTicker] = useState('')
    const [filtroTipo, setFiltroTipo] = useState('TODOS')

    // Unificar listas
    const itens = [
        ...transacoes.map(t => ({
            id: t.id,
            tipo: 'TRANSACAO',
            subtipo: t.tipo,
            titulo: t.tipo === 'COMPRA_INICIAL' ? 'Criação' :
                t.tipo === 'COMPRA_ADICIONAL' ? 'Aporte' : 'Transação',
            ticker: t.ticker,
            valor: t.valor_total,
            qtd: t.quantidade,
            preco: t.preco_unitario,
            detalhe: `${t.quantidade}x R$ ${t.preco_unitario.toFixed(2)}`,
            dataOriginal: t.data,
            dataObj: new Date(t.data),
            icone: t.tipo === 'COMPRA_INICIAL' ? Wallet : ArrowUpCircle,
            cor: 'text-blue-600',
            bg: 'bg-blue-50'
        })),
        ...proventos.map(p => ({
            id: p.id,
            tipo: 'PROVENTO',
            subtipo: 'DIVIDENDO',
            titulo: 'Provento',
            ticker: p.ticker,
            valor: p.valor,
            qtd: 0,
            preco: 0,
            detalhe: p.reinvestido ? 'Reinvestido' : 'Creditado',
            dataOriginal: p.data,
            dataObj: new Date(p.data),
            icone: Banknote,
            cor: 'text-green-600',
            bg: 'bg-green-50'
        }))
    ]

    // Ordenar por data (mais recente primeiro)
    itens.sort((a, b) => b.dataObj.getTime() - a.dataObj.getTime())

    // Filtrar
    const itensFiltrados = itens.filter(item => {
        const matchTicker = item.ticker.toLowerCase().includes(filtroTicker.toLowerCase())

        let matchTipo = false
        if (filtroTipo === 'TODOS') matchTipo = true
        else if (filtroTipo === 'CRIACAO') matchTipo = item.tipo === 'TRANSACAO' && item.subtipo === 'COMPRA_INICIAL'
        else if (filtroTipo === 'APORTE') matchTipo = item.tipo === 'TRANSACAO' && item.subtipo === 'COMPRA_ADICIONAL'
        else if (filtroTipo === 'PROVENTO') matchTipo = item.tipo === 'PROVENTO'
        else if (filtroTipo === 'REBALANCEAMENTO') matchTipo = item.tipo === 'TRANSACAO' && (item.subtipo === 'REBALANCEAMENTO_COMPRA' || item.subtipo === 'REBALANCEAMENTO_VENDA')
        else if (filtroTipo === 'TRANSFERENCIA') matchTipo = item.tipo === 'TRANSACAO' && item.subtipo === 'TRANSFERENCIA_ENTRADA'

        return matchTicker && matchTipo
    })

    if (itens.length === 0) {
        return null
    }

    // Função para formatar data (Padronizado apenas DD/MM/AAAA)
    const formatarData = (item: typeof itens[0]) => {
        if (item.tipo === 'PROVENTO') {
            // Proventos (UTC midnight)
            return new Date(item.dataOriginal).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
        } else {
            // Transações (Timestamp completo) - Removemos a hora para padronizar
            return new Date(item.dataOriginal).toLocaleDateString('pt-BR')
        }
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <CardTitle className="text-lg">Histórico</CardTitle>
                            <CardDescription>Movimentações da carteira</CardDescription>
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-40">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar ativo..."
                                value={filtroTicker}
                                onChange={(e) => setFiltroTicker(e.target.value)}
                                className="pl-8 h-9"
                            />
                        </div>
                        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                            <SelectTrigger className="w-[130px] h-9">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-3 w-3" />
                                    <SelectValue />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TODOS">Todos</SelectItem>
                                <SelectItem value="CRIACAO">Criação</SelectItem>
                                <SelectItem value="APORTE">Aportes</SelectItem>
                                <SelectItem value="REBALANCEAMENTO">Rebalanceamento</SelectItem>
                                <SelectItem value="TRANSFERENCIA">Transferências</SelectItem>
                                <SelectItem value="PROVENTO">Proventos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="max-h-[400px] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Data</TableHead>
                                <TableHead className="w-[100px]">Tipo</TableHead>
                                <TableHead>Ativo</TableHead>
                                <TableHead className="hidden md:table-cell">Detalhe</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {itensFiltrados.map((item) => (
                                <TableRow key={`${item.tipo}-${item.id}`}>
                                    <TableCell className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {formatarData(item)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <item.icone className={`h-4 w-4 ${item.cor}`} />
                                            <span className="text-xs font-medium">{item.titulo}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-xs">{item.ticker}</Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                                        {item.detalhe}
                                    </TableCell>
                                    <TableCell className={`text-right font-bold text-sm ${item.tipo === 'PROVENTO' ? 'text-green-600' : ''}`}>
                                        R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {itensFiltrados.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Nenhum registro encontrado
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
