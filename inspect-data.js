const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function inspectData() {
    // 1. Pegar ID da carteira teste
    const { data: carteiras } = await supabase
        .from('carteiras')
        .select('id, nome')
        .eq('nome', 'teste')
        .single()

    if (!carteiras) {
        console.log('Carteira teste não encontrada')
        return
    }

    console.log('Carteira:', carteiras)

    // 2. Pegar Transações
    const { data: transacoes } = await supabase
        .from('transacoes')
        .select('*')
        .eq('carteira_id', carteiras.id)
        .order('data', { ascending: true })

    console.log('\n--- Transações ---')
    console.table(transacoes.map(t => ({
        data: t.data,
        tipo: t.tipo,
        ticker: t.ticker,
        qtd: t.quantidade,
        valor: t.valor_total
    })))

    // 3. Pegar Posições
    const { data: posicoes } = await supabase
        .from('posicoes')
        .select('*')
        .eq('carteira_id', carteiras.id)

    console.log('\n--- Posições ---')
    console.table(posicoes.map(p => ({
        ticker: p.ticker,
        qtd: p.quantidade,
        pm: p.preco_medio,
        investido: p.quantidade * p.preco_medio
    })))
}

inspectData()
