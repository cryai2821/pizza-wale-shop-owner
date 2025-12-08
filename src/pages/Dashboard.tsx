import { useQuery } from '@tanstack/react-query'
import { getShopMenu, getShopOrders } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/lib/utils'
import { Pizza, ClipboardList, IndianRupee, TrendingUp, AlertCircle } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { RecentOrders } from '@/components/dashboard/RecentOrders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Order } from '@/types'

export default function Dashboard() {
    const user = useAuthStore((state) => state.user)
    const shopId = user?.id || ""

    const { data: menuData = [], isLoading: pizzasLoading } = useQuery({
        queryKey: ['shop-menu', shopId],
        queryFn: () => getShopMenu(shopId),
        enabled: !!shopId,
    })

    const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
        queryKey: ['shop-orders', shopId],
        queryFn: () => getShopOrders(shopId),
        enabled: !!shopId,
    })

    // Flatten products from categories for stats
    // menuData is any[] (categories)
    const pizzas = menuData.flatMap((cat: any) => cat.products || [])

    // Calculate stats
    const totalProducts = pizzas.length
    const availableProducts = pizzas.filter((p: any) => p.isAvailable).length
    const featuredProducts = pizzas.filter((p: any) => p.isFeatured).length

    const todayOrders = orders.filter((o) => {
        const orderDate = new Date(o.created_date)
        const today = new Date()
        return orderDate.toDateString() === today.toDateString()
    })

    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0)

    // Map backend statuses to simple checks. Transformed data uses lowercase status.
    const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length
    const preparingOrders = orders.filter((o) => o.status === 'preparing').length

    const isLoading = pizzasLoading || ordersLoading

    if (isLoading) {
        return <div className="p-8">Loading dashboard...</div>
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">Overview of your shop's performance.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Products"
                    value={totalProducts}
                    icon={Pizza}
                    trend={`${availableProducts} available`}
                    trendUp={true}
                />
                <StatCard
                    title="Today's Orders"
                    value={todayOrders.length}
                    icon={ClipboardList}
                    trend={`${pendingOrders} pending`}
                    trendUp={true}
                />
                <StatCard
                    title="Today's Revenue"
                    value={formatCurrency(todayRevenue)}
                    icon={IndianRupee}
                />
                <StatCard
                    title="Preparing Now"
                    value={preparingOrders}
                    icon={TrendingUp}
                />
            </div>

            {/* Featured & Alerts - Conditional Rendering */}
            <div className="grid gap-4 md:grid-cols-2">
                {featuredProducts > 0 && (
                    <Card className="bg-orange-50/50 border-orange-100">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                <Pizza className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-medium text-orange-900">Featured Products</p>
                                <p className="text-sm text-orange-700">You have {featuredProducts} featured pizzas active.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
                {pendingOrders > 0 && (
                    <Card className="bg-amber-50/50 border-amber-100">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-medium text-amber-900">Attention Needed</p>
                                <p className="text-sm text-amber-700">You have {pendingOrders} orders waiting for action.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Content Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Orders - Span 4 */}
                <div className="col-span-4">
                    <RecentOrders orders={orders} />
                </div>

                {/* Menu Overview - Span 3 */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Menu Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {['classic', 'specialty', 'vegetarian', 'meat_lovers', 'seafood'].map(category => {
                                // Match category name against pizza Category object or string?
                                // Backend menu returns categories. We need to check logical mapping.
                                // Simplifying assumption: category name matching might need review based on backend data.
                                const count = pizzas.filter((p: any) => p.category?.name?.toLowerCase() === category || p.category?.toLowerCase() === category).length
                                const percentage = totalProducts > 0 ? (count / totalProducts) * 100 : 0

                                return (
                                    <div key={category} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="capitalize">{category.replace('_', ' ')}</span>
                                            <span className="text-muted-foreground">{count}</span>
                                        </div>
                                        <div className="h-2 w-full bg-secondary/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-300"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
