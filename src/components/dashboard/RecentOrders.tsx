
import { Link } from "@tanstack/react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { Order } from "@/types"
import { cn, formatCurrency } from "@/lib/utils"

interface RecentOrdersProps {
    orders: Order[]
}

const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    preparing: "bg-orange-100 text-orange-800",
    ready: "bg-green-100 text-green-800",
    out_for_delivery: "bg-purple-100 text-purple-800",
    delivered: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
}

export function RecentOrders({ orders }: RecentOrdersProps) {
    // Take only top 5 recent orders
    const recentOrders = orders.slice(0, 5)

    return (
        <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <Link to="/orders">
                    <Button variant="ghost" size="sm" className="gap-1">
                        View All <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {recentOrders.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No orders yet.
                        </p>
                    ) : (
                        recentOrders.map((order) => (
                            <div
                                key={order.id}
                                className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                            >
                                <div className="space-y-1">
                                    <p className="font-medium text-sm">
                                        {order.order_number} <span className="text-muted-foreground mx-1">•</span> {order.customer_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {order.items.map(i => `${i.quantity}x ${i.pizza_name}`).join(', ')}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="font-medium text-sm">{formatCurrency(order.total)}</div>
                                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", statusColors[order.status] || "bg-gray-100 text-gray-800")}>
                                        {order.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
