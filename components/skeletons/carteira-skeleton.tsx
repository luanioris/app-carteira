import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { Loader2 } from 'lucide-react'

export function CarteiraSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Loading Indicator */}
            <div className="flex items-center justify-center py-4 text-muted-foreground bg-accent/20 rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm font-medium">Atualizando cotações em tempo real...</span>
            </div>

            {/* Header */}
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-8 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-[100px]" />
                    <Skeleton className="h-10 w-[100px]" />
                    <Skeleton className="h-10 w-[120px]" />
                </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-[80px]" />
                            <Skeleton className="h-4 w-4 rounded" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-7 w-[100px] mb-2" />
                            <Skeleton className="h-3 w-[60px]" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Distribuição */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-[200px] mb-2" />
                    <Skeleton className="h-4 w-[300px]" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-[100px]" />
                                    <Skeleton className="h-4 w-[80px]" />
                                </div>
                                <Skeleton className="h-2 w-full" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Tabela de Posições */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-[150px] mb-2" />
                    <Skeleton className="h-4 w-[250px]" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex justify-between py-2 border-b">
                                <Skeleton className="h-6 w-[100px]" />
                                <Skeleton className="h-6 w-[60px]" />
                                <Skeleton className="h-6 w-[80px]" />
                                <Skeleton className="h-6 w-[80px]" />
                                <Skeleton className="h-6 w-[80px]" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
