
import { createClient } from '@supabase/supabase-js'
import { QuotesService } from '../lib/services/quotes-service'

// Ensure we have the necessary environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

// Initialize Supabase with Service Role Key (Bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
    console.log('🚀 Starting daily quote update...')

    try {
        // 1. Fetch all unique tickers from active portfolios
        const { data: carteiras, error: carteirasError } = await supabase
            .from('carteiras')
            .select('posicoes(ticker)')
            .eq('ativa', true)

        if (carteirasError) throw carteirasError
        if (!carteiras) {
            console.log('⚠️ No active portfolios found.')
            return
        }

        // Extract unique tickers
        const allTickers = new Set<string>()
        carteiras.forEach((c: any) => {
            c.posicoes.forEach((p: any) => allTickers.add(p.ticker))
        })

        const tickersList = Array.from(allTickers)
        console.log(`📋 Found ${tickersList.length} unique tickers to update.`)

        if (tickersList.length === 0) {
            console.log('✅ Nothing to update.')
            return
        }

        // 2. Fetch prices from Yahoo Finance
        console.log('🌍 Fetching prices from Yahoo Finance...')
        const quotes = await QuotesService.getQuotesYahoo(tickersList)
        console.log(`📉 Retrieved ${quotes.length} quotes.`)

        // 3. Prepare data for Upsert
        const upsertData = quotes.map(q => ({
            ticker: q.symbol,
            preco: q.regularMarketPrice,
            updated_at: new Date().toISOString(),
            source: 'YAHOO_AUTOMATION'
        }))

        // 4. Update Database
        const { error: upsertError } = await supabase
            .from('cotacoes_cache')
            .upsert(upsertData, { onConflict: 'ticker' })

        if (upsertError) throw upsertError

        console.log('✅ Database updated successfully!')
    } catch (error) {
        console.error('❌ Error updating quotes:', error)
        process.exit(1)
    }
}

main()
