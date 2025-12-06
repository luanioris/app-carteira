import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { NovoProventoForm } from './novo-provento-form'

export default async function NovoProventoPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient()

    // Buscar carteira e posições para preencher o select de ativos
    const { data: carteira } = await supabase
        .from('carteiras')
        .select(`
            id,
            nome,
            posicoes (
                ticker,
                tipo
            )
        `)
        .eq('id', params.id)
        .single()

    if (!carteira) {
        notFound()
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Registrar Provento</h1>
                <p className="text-muted-foreground">
                    Lance dividendos, JCP ou rendimentos recebidos na carteira {carteira.nome}
                </p>
            </div>

            <NovoProventoForm carteira={carteira} />
        </div>
    )
}
