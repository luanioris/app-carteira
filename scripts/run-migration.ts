import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
    console.log('🚀 Executando migration de rebalanceamento...')

    const migration = `
        -- Adicionar campos para controle de migração/rebalanceamento na tabela carteiras
        ALTER TABLE carteiras 
        ADD COLUMN IF NOT EXISTS carteira_origem_id UUID REFERENCES carteiras(id),
        ADD COLUMN IF NOT EXISTS migrada_para_id UUID REFERENCES carteiras(id),
        ADD COLUMN IF NOT EXISTS data_encerramento TIMESTAMPTZ;

        -- Adicionar campo para congelar preço na tabela posicoes
        ALTER TABLE posicoes
        ADD COLUMN IF NOT EXISTS preco_fechamento DECIMAL(15,2);

        -- Criar índice para performance
        CREATE INDEX IF NOT EXISTS idx_carteiras_ativa ON carteiras(ativa);
        
        -- Adicionar tipo de transação para transferências
        ALTER TABLE transacoes DROP CONSTRAINT IF EXISTS transacoes_tipo_check;
        ALTER TABLE transacoes ADD CONSTRAINT transacoes_tipo_check CHECK (tipo IN (
            'COMPRA_INICIAL', 
            'COMPRA_ADICIONAL', 
            'PROVENTO_REINVESTIDO', 
            'REBALANCEAMENTO_COMPRA',
            'REBALANCEAMENTO_VENDA',
            'TRANSFERENCIA_ENTRADA',
            'TRANSFERENCIA_SAIDA'
        ));
    `

    try {
        const { error } = await supabase.rpc('exec_sql', { sql: migration })

        if (error) {
            console.error('❌ Erro na migration:', error)
            process.exit(1)
        }

        console.log('✅ Migration executada com sucesso!')
    } catch (err) {
        console.error('❌ Erro:', err)
        process.exit(1)
    }
}

runMigration()
