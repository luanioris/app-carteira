import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function AnalyticsSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                </div>
            </div>

            {/* Cards de Métricas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-[100px]" />
                            <Skeleton className="h-4 w-4 rounded" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-7 w-[80px] mb-2" />
                            <Skeleton className="h-3 w-[60px]" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Gráficos */}
            <div className="grid gap-6 md:grid-cols-2">
                {[1, 2].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-5 w-[180px] mb-2" />
                            <Skeleton className="h-4 w-[220px]" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-[300px] w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Gráfico Grande */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-[200px] mb-2" />
                    <Skeleton className="h-4 w-[250px]" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[400px] w-full" />
                </CardContent>
            </Card>
        </div>
    )
}
