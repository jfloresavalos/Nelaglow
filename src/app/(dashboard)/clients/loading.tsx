
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function Loading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
                    <Skeleton className="h-4 w-60 mt-2" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>

            <div className="space-y-4">
                {/* Filters */}
                <div className="relative max-w-sm">
                    <Skeleton className="h-10 w-full" />
                </div>

                {/* Clients List Skeleton */}
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
                                        <div className="flex gap-2">
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-full max-w-md" />
                                        <div className="flex gap-4">
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-4 w-32" />
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
