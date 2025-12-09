// Interface padronizada para cotações
export interface Quote {
    symbol: string
    regularMarketPrice: number
    regularMarketChangePercent?: number
    currency?: string
}

/**
 * Serviço centralizado para buscar cotações com fallback automático
 * Tenta Brapi primeiro, se falhar usa Yahoo Finance
 */
export class QuotesService {
    private static readonly BRAPI_URL = 'https://brapi.dev/api/quote'
    private static readonly YAHOO_URL = 'https://query1.finance.yahoo.com/v8/finance/chart'
    private static readonly BRAPI_TIMEOUT = 8000 // 8 segundos
    private static readonly YAHOO_TIMEOUT = 10000 // 10 segundos

    /**
     * Busca cotações com fallback automático e complementação
     * Tenta Brapi primeiro. Se falhar ou retornar parcial, busca o restante no Yahoo Finance.
     * @param tickers Lista de tickers (ex: ['PETR4', 'AAPL'])
     * @returns Array de cotações normalizadas
     */
    static async getQuotes(tickers: string[]): Promise<Quote[]> {
        if (!tickers || tickers.length === 0) {
            return []
        }

        // Normaliza tickers de entrada para maiúsculo para comparação segura
        const requestTickers = tickers.map(t => t.toUpperCase())
        let finalQuotes: Quote[] = []
        let failedTickers: Set<string> = new Set(requestTickers)

        // 1. Tentar Brapi
        try {
            console.log(`[QuotesService] Tentando Brapi para ${tickers.length} tickers...`)
            const brapiQuotes = await this.fetchFromBrapi(requestTickers)

            brapiQuotes.forEach(q => {
                // Remove do conjunto de falhas se encontrou (ignorando sufixos retornados pela API)
                // A Brapi pode retornar PETR4 ou PETR4.SA, precisamos ser flexíveis no match
                const symbolUpper = q.symbol.toUpperCase()

                // Tenta match exato ou match parcial se tiver .SA
                const originalTicker = requestTickers.find(t =>
                    symbolUpper === t ||
                    symbolUpper === `${t}.SA` ||
                    symbolUpper.replace('.SA', '') === t
                )

                if (originalTicker) {
                    failedTickers.delete(originalTicker)
                    finalQuotes.push(q)
                }
            })

            console.log(`[QuotesService] ✓ Brapi retornou ${finalQuotes.length}/${tickers.length} cotações`)

        } catch (brapiError) {
            console.warn(`[QuotesService] ⚠ Brapi falhou totalmente:`, brapiError)
            // Se falhar tudo, failedTickers continua cheio, tentaremos tudo no Yahoo
        }

        // 2. Se houver tickers faltando, tentar Yahoo Finance
        if (failedTickers.size > 0) {
            const missingTickers = Array.from(failedTickers)
            console.log(`[QuotesService] Buscando ${missingTickers.length} tickers restantes no Yahoo Finance...`)

            try {
                const yahooQuotes = await this.fetchFromYahoo(missingTickers)

                yahooQuotes.forEach(q => {
                    finalQuotes.push(q)
                    // Não precisamos remover de failedTickers pois é a última tentativa
                })

                console.log(`[QuotesService] ✓ Yahoo retornou +${yahooQuotes.length} cotações`)
            } catch (yahooError) {
                console.error(`[QuotesService] ✗ Yahoo Finance falhou:`, yahooError)
            }
        }

        return finalQuotes
    }

    /**
     * Busca cotações EXCLUSIVAMENTE no Yahoo Finance (sem fallback)
     * Utiliza a mesma lógica de normalização e retry do serviço interno.
     */
    static async getQuotesYahoo(tickers: string[]): Promise<Quote[]> {
        // Normaliza para maiúsculo
        const requestTickers = tickers.map(t => t.toUpperCase())
        return this.fetchFromYahoo(requestTickers)
    }

    /**
     * Busca cotações da Brapi usando endpoint agrupado
     * Agrupa tickers na URL (ex: /quote/PETR4,VALE3) para economizar requisições
     */
    private static async fetchFromBrapi(tickers: string[]): Promise<Quote[]> {
        const quotes: Quote[] = []

        // Agrupa em lotes de 20 para a URL não ficar gigante
        const batchSize = 20

        for (let i = 0; i < tickers.length; i += batchSize) {
            const batch = tickers.slice(i, i + batchSize)
            const tickersString = batch.join(',')
            const token = process.env.BRAPI_API_TOKEN || process.env.NEXT_PUBLIC_BRAPI_TOKEN || ''
            const url = `${this.BRAPI_URL}/${tickersString}?token=${token}`

            try {
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), this.BRAPI_TIMEOUT)

                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: { 'Accept': 'application/json' },
                    next: { revalidate: 300 } // Cache por 5 minutos para evitar 429
                })

                clearTimeout(timeoutId)

                if (!response.ok) {
                    console.warn(`[Brapi] Erro HTTP ${response.status} para lote ${i}`)
                    continue
                }

                const data = await response.json()

                if (data.results && Array.isArray(data.results)) {
                    data.results.forEach((item: any) => {
                        quotes.push({
                            symbol: item.symbol,
                            regularMarketPrice: item.regularMarketPrice,
                            regularMarketChangePercent: item.regularMarketChangePercent,
                            currency: item.currency
                        })
                    })
                }
            } catch (error) {
                console.warn(`[Brapi] Erro no lote ${i}:`, error)
            }
        }

        if (quotes.length === 0) {
            throw new Error('Brapi não retornou nenhuma cotação válida nos lotes')
        }

        return quotes
    }

    /**
     * Busca cotações do Yahoo Finance via API pública
     * Normaliza tickers brasileiros (.SA) e internacionais
     */
    private static async fetchFromYahoo(tickers: string[]): Promise<Quote[]> {
        const quotes: Quote[] = []

        // Buscar um por vez para melhor controle de erros
        for (const ticker of tickers) {
            try {
                const yahooTicker = this.normalizeTickerForYahoo(ticker)
                const url = `${this.YAHOO_URL}/${yahooTicker}?interval=1d&range=1d`

                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), this.YAHOO_TIMEOUT)

                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'Mozilla/5.0',
                        'Accept': 'application/json'
                    }
                })

                clearTimeout(timeoutId)

                if (!response.ok) {
                    console.warn(`[Yahoo] HTTP ${response.status} para ${ticker}`)
                    continue
                }

                const data = await response.json()
                const result = data?.chart?.result?.[0]

                if (!result) {
                    console.warn(`[Yahoo] Sem dados para ${ticker}`)
                    continue
                }

                const meta = result.meta
                const quote = result.indicators?.quote?.[0]

                if (meta?.regularMarketPrice) {
                    // Calcular variação percentual se possível
                    let changePercent = 0
                    if (quote?.close && quote.close.length > 1) {
                        const current = meta.regularMarketPrice
                        const previous = quote.close[quote.close.length - 2]
                        if (previous && previous > 0) {
                            changePercent = ((current - previous) / previous) * 100
                        }
                    }

                    quotes.push({
                        symbol: ticker, // Retorna o ticker original
                        regularMarketPrice: meta.regularMarketPrice,
                        regularMarketChangePercent: changePercent,
                        currency: meta.currency || 'BRL'
                    })
                }
            } catch (error: any) {
                if (error.name === 'AbortError') {
                    console.warn(`[Yahoo] Timeout para ${ticker}`)
                } else {
                    console.warn(`[Yahoo] Erro para ${ticker}:`, error.message)
                }
                // Continua tentando os outros tickers
            }
        }

        if (quotes.length === 0) {
            throw new Error('Yahoo Finance não retornou nenhuma cotação válida')
        }

        return quotes
    }

    /**
     * Normaliza ticker para formato do Yahoo Finance
     * Exemplos:
     * - PETR4 → PETR4.SA (ações brasileiras)
     * - AAPL → AAPL (ações americanas)
     * - ^BVSP → ^BVSP (índices)
     */
    private static normalizeTickerForYahoo(ticker: string): string {
        // Se já tem sufixo ou é índice, mantém
        if (ticker.includes('.') || ticker.startsWith('^')) {
            return ticker
        }

        // Se parece com ticker brasileiro (4 letras + número), adiciona .SA
        if (/^[A-Z]{4}\d{1,2}$/.test(ticker)) {
            return `${ticker}.SA`
        }

        // Caso contrário, assume que é internacional
        return ticker
    }
}
