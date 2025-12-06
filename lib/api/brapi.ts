import { BrapiResponse, BrapiQuote } from '@/types/brapi'
import { QuotesService } from '@/lib/services/quotes-service'

const BRAPI_BASE_URL = 'https://brapi.dev/api'

/**
 * Busca cotação de um ou mais ativos
 * Usa QuotesService com fallback automático (Brapi → Yahoo Finance)
 * @param tickers - Lista de tickers (ex: ['PETR4', 'VALE3'])
 * @returns Dados de cotação dos ativos
 */
export async function getQuotes(tickers: string[]): Promise<BrapiQuote[]> {
    try {
        const quotes = await QuotesService.getQuotes(tickers)

        // Converte para o formato BrapiQuote (compatibilidade com código existente)
        return quotes.map(q => ({
            symbol: q.symbol,
            regularMarketPrice: q.regularMarketPrice,
            regularMarketChangePercent: q.regularMarketChangePercent || 0,
            currency: q.currency || 'BRL',
            // Campos opcionais que podem não existir no Yahoo
            shortName: q.symbol,
            longName: q.symbol,
        })) as BrapiQuote[]
    } catch (error) {
        console.error('Erro ao buscar cotações:', error)
        return []
    }
}

/**
 * Busca cotação de um único ativo
 * @param ticker - Ticker do ativo (ex: 'PETR4')
 * @returns Dados de cotação do ativo
 */
export async function getQuote(ticker: string): Promise<BrapiQuote | null> {
    const quotes = await getQuotes([ticker])
    return quotes[0] || null
}

/**
 * Busca lista de ações disponíveis na B3
 * @returns Lista de tickers disponíveis
 */
export async function getAvailableStocks(): Promise<string[]> {
    try {
        const token = process.env.BRAPI_API_TOKEN
        const response = await fetch(`${BRAPI_BASE_URL}/available?token=${token}`, {
            next: { revalidate: 86400 }, // Cache por 24 horas
        })

        if (!response.ok) {
            throw new Error(`Erro ao buscar ações disponíveis: ${response.statusText}`)
        }

        const data = await response.json()
        return data.stocks || []
    } catch (error) {
        console.error('Erro na API brapi.dev:', error)
        throw error
    }
}

/**
 * Valida se um ticker existe na B3
 * @param ticker - Ticker a validar
 * @returns true se o ticker existe
 */
export async function validateTicker(ticker: string): Promise<boolean> {
    try {
        const quote = await getQuote(ticker)
        return quote !== null
    } catch {
        return false
    }
}
