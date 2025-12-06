import Link from 'next/link'
import { PlusCircle, Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CarteirasList } from './carteiras-list'

export default async function CarteirasPage() {
    const supabase = await createClient()

    // Buscar TODAS as carteiras do usuário (ativas e inativas)
    const { data: carteiras } = await supabase
        .from('carteiras')
        .select(`
      *,
      perfis (nome),
      posicoes (
        quantidade,
        preco_medio
      )
    `)
        .order('ativa', { ascending: false }) // Ativas primeiro
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Minhas Carteiras</h1>
                    <p className="text-muted-foreground">
                        Gerencie suas carteiras de investimento aqui.
                    </p>
                </div>
                <Link href="/carteiras/nova">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nova Carteira
                    </Button>
                </Link>
            </div>

            {!carteiras || carteiras.length === 0 ? (
                <Card className="flex flex-col items-center justify-center border-dashed p-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Wallet className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">Nenhuma carteira encontrada</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground">
                        Você ainda não criou nenhuma carteira de investimentos.
                    </p>
                    <Link href="/carteiras/nova">
                        <Button variant="outline">Criar primeira carteira</Button>
                    </Link>
                </Card>
            ) : (
                <CarteirasList carteiras={carteiras} />
            )}
        </div>
    )
}
