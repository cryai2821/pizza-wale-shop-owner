import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getShopOrders, updateOrderStatus } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Search, RefreshCw, Clock, CheckCircle, Package, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import OrderCard from '@/components/orders/OrderCard';
import { Order } from '@/types';

const statusFilters = [
    { value: 'all', label: 'All Orders' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'completed', label: 'Completed' },
];

export default function Orders() {
    const user = useAuthStore((state) => state.user);
    const shopId = user?.id || "";
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

    const queryClient = useQueryClient();

    const { data: orders = [], isLoading, refetch } = useQuery<Order[]>({
        queryKey: ['shop-orders', shopId],
        queryFn: () => getShopOrders(shopId),
        enabled: !!shopId,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => updateOrderStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shop-orders', shopId] });
        },
    });

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        await updateMutation.mutateAsync({ id: orderId, status: newStatus });
    };

    // Filter orders
    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesStatus = true;
        if (statusFilter === 'active') {
            matchesStatus = !['completed', 'cancelled'].includes(order.status);
        } else if (statusFilter !== 'all') {
            matchesStatus = order.status === statusFilter;
        }

        return matchesSearch && matchesStatus;
    });

    // Stats
    const activeCount = orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length;
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const preparingCount = orders.filter(o => o.status === 'preparing').length;
    const readyCount = orders.filter(o => o.status === 'ready').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Order Management</h1>
                    <p className="text-muted-foreground mt-1">Track and manage customer orders</p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => refetch()}
                    className="gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Active Orders</p>
                            <p className="text-2xl font-bold text-slate-800">{activeCount}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Pending</p>
                            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                        </div>
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Action Needed</Badge>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-purple-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Preparing</p>
                            <p className="text-2xl font-bold text-purple-600">{preparingCount}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Timer className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Ready</p>
                            <p className="text-2xl font-bold text-green-600">{readyCount}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search by order # or customer name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                        <TabsList className="bg-slate-100 flex-wrap h-auto">
                            {statusFilters.map(filter => (
                                <TabsTrigger
                                    key={filter.value}
                                    value={filter.value}
                                    className="data-[state=active]:bg-white"
                                >
                                    {filter.label}
                                    {filter.value === 'pending' && pendingCount > 0 && (
                                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-500 text-white rounded-full">
                                            {pendingCount}
                                        </span>
                                    )}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {/* Orders List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-24 rounded-2xl" />
                    ))}
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                    <div className="flex justify-center mb-4">
                        <Package className="h-12 w-12 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-input">No orders found</h3>
                    <p className="text-muted-foreground mt-2">
                        {searchQuery || statusFilter !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Orders will appear here when customers place them'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onStatusChange={handleStatusChange}
                            expanded={expandedOrder === order.id}
                            onToggleExpand={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
