import { Skeleton } from '@/components/ui/skeleton'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <TableHead key={i}>
                            <Skeleton className="h-4 w-[80px]" />
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {Array.from({ length: rows }).map((_, i) => (
                    <TableRow key={i}>
                        {[1, 2, 3, 4, 5, 6].map((j) => (
                            <TableCell key={j}>
                                <Skeleton className="h-4 w-[60px]" />
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
