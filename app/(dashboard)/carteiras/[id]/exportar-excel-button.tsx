'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'

interface ExportarExcelButtonProps {
    carteira: any
    posicoes: any[]
    proventos: any[]
    transacoes: any[]
}

export function ExportarExcelButton({ carteira, posicoes, proventos, transacoes }: ExportarExcelButtonProps) {
    const handleExport = () => {
        // Criar workbook
        const wb = XLSX.utils.book_new()

        // ABA 1: Resumo
        const resumoData = [
            ['RESUMO DA CARTEIRA'],
            [''],
            ['Nome', carteira.nome],
            ['Perfil', carteira.perfis?.nome || 'N/A'],
            ['Data de Criação', new Date(carteira.created_at).toLocaleDateString('pt-BR')],
            ['Status', carteira.ativa ? 'Ativa' : 'Encerrada'],
            [''],
            ['VALORES'],
            ['Valor Inicial', carteira.valor_inicial],
            ['Valor Investido', posicoes.reduce((sum, p) => sum + (p.quantidade * p.preco_medio), 0)],
            ['Valor Atual', posicoes.reduce((sum, p) => sum + (p.quantidade * p.preco_atual), 0)],
            ['Lucro/Prejuízo', posicoes.reduce((sum, p) => sum + ((p.preco_atual - p.preco_medio) * p.quantidade), 0)],
            [''],
            ['PROVENTOS'],
            ['Total Recebido', proventos.reduce((sum, p) => sum + p.valor, 0)],
        ]
        const wsResumo = XLSX.utils.aoa_to_sheet(resumoData)
        XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo')

        // ABA 2: Posições
        const posicoesData = posicoes.map(p => ({
            'Ticker': p.ticker,
            'Tipo': p.tipo,
            'Quantidade': p.quantidade,
            'Preço Médio': p.preco_medio,
            'Preço Atual': p.preco_atual,
            'Valor Investido': p.quantidade * p.preco_medio,
            'Valor Atual': p.quantidade * p.preco_atual,
            'Lucro/Prejuízo': (p.preco_atual - p.preco_medio) * p.quantidade,
            'Rentabilidade %': ((p.preco_atual / p.preco_medio - 1) * 100).toFixed(2),
        }))
        const wsPosicoes = XLSX.utils.json_to_sheet(posicoesData)
        XLSX.utils.book_append_sheet(wb, wsPosicoes, 'Posições')

        // ABA 3: Proventos
        if (proventos.length > 0) {
            const proventosData = proventos.map(p => ({
                'Data': new Date(p.data).toLocaleDateString('pt-BR'),
                'Ticker': p.ticker,
                'Valor': p.valor,
                'Reinvestido': p.reinvestido ? 'Sim' : 'Não',
            }))
            const wsProventos = XLSX.utils.json_to_sheet(proventosData)
            XLSX.utils.book_append_sheet(wb, wsProventos, 'Proventos')
        }

        // ABA 4: Transações
        if (transacoes.length > 0) {
            const transacoesData = transacoes.map(t => ({
                'Data': new Date(t.data).toLocaleDateString('pt-BR'),
                'Tipo': t.tipo,
                'Ticker': t.ticker,
                'Quantidade': t.quantidade,
                'Preço Unitário': t.preco_unitario,
                'Valor Total': t.valor_total,
                'Observações': t.observacoes || '',
            }))
            const wsTransacoes = XLSX.utils.json_to_sheet(transacoesData)
            XLSX.utils.book_append_sheet(wb, wsTransacoes, 'Transações')
        }

        // Gerar arquivo
        const fileName = `${carteira.nome.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
        XLSX.writeFile(wb, fileName)
    }

    return (
        <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
        </Button>
    )
}
