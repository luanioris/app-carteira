import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProventosDashboard } from './proventos-dashboard'

export default async function ProventosPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Buscar carteira
    const { data: carteira } = await supabase
        .from('carteiras')
        .select('*, perfis(nome)')
        .eq('id', params.id)
        .single()

    if (!carteira || carteira.user_id !== user.id) {
        redirect('/carteiras')
    }

    // Buscar proventos da carteira
    const { data: proventos } = await supabase
        .from('proventos')
        .select('*')
        .eq('carteira_id', params.id)
        .order('data', { ascending: false })

    // Buscar posições para calcular DY
    const { data: posicoes } = await supabase
        .from('posicoes')
        .select('*')
        .eq('carteira_id', params.id)

    return (
        <ProventosDashboard
            carteira={carteira}
            proventos={proventos || []}
            posicoes={posicoes || []}
        />
    )
}
