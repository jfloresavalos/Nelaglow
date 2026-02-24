
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function Loading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Pedidos</h1>
                    <Skeleton className="h-4 w-60 mt-2" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>

            <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col gap-4 sm:flex-row">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-full sm:w-40" />
                    <Skeleton className="h-10 w-full sm:w-40" />
                </div>

                {/* Orders List Skeleton */}
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-2 w-1/3">
                                            <Skeleton className="h-5 w-32" />
                                            <Skeleton className="h-4 w-24" />
                                        </div>
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-full max-w-md" />
                                        <div className="flex gap-4">
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-4 w-20" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
