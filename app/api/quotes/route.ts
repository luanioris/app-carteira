import { NextRequest, NextResponse } from 'next/server'
import { getQuotes } from '@/lib/api/brapi'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const tickersParam = searchParams.get('tickers')

        if (!tickersParam) {
            return NextResponse.json({ error: 'Tickers não informados' }, { status: 400 })
        }

        const tickers = tickersParam.split(',').map(t => t.trim()).filter(t => t.length > 0)

        if (tickers.length === 0) {
            return NextResponse.json({ error: 'Nenhum ticker válido' }, { status: 400 })
        }

        const quotes = await getQuotes(tickers)

        return NextResponse.json({ quotes })
    } catch (error) {
        console.error('Erro ao buscar cotações:', error)
        return NextResponse.json({ error: 'Erro ao buscar cotações' }, { status: 500 })
    }
}
