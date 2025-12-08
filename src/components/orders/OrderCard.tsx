import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, formatCurrency } from '@/lib/utils';
import { Order } from '@/types';
import { Clock, User, ChevronDown, ChevronUp, Phone, MapPin } from 'lucide-react';

interface OrderCardProps {
    order: Order;
    onStatusChange: (orderId: string, newStatus: string) => Promise<void>;
    expanded: boolean;
    onToggleExpand: () => void;
}

const statusConfig: Record<string, { label: string; color: string; next?: string }> = {
    pending: {
        label: 'Pending',
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        next: 'confirmed'
    },
    confirmed: {
        label: 'Confirmed',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        next: 'preparing'
    },
    preparing: {
        label: 'Preparing',
        color: 'bg-purple-100 text-purple-700 border-purple-200',
        next: 'ready'
    },
    ready: {
        label: 'Ready',
        color: 'bg-green-100 text-green-700 border-green-200',
        next: 'completed'
    },
    completed: {
        label: 'Completed',
        color: 'bg-slate-100 text-slate-700 border-slate-200',
        // next: null
    },
    cancelled: {
        label: 'Cancelled',
        color: 'bg-red-100 text-red-700 border-red-200',
        // next: null
    },
};

export default function OrderCard({ order, onStatusChange, expanded, onToggleExpand }: OrderCardProps) {
    const status = statusConfig[order.status] || statusConfig.pending;
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStatusUpdate = async (newStatus: string) => {
        setIsUpdating(true);
        try {
            await onStatusChange(order.id, newStatus);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className={cn(
            "bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300",
            expanded && "ring-2 ring-primary/20"
        )}>
            {/* Header */}
            <div
                className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={onToggleExpand}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-lg text-foreground">#{order.order_number}</span>
                                <Badge className={status.color} variant="outline">{status.label}</Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {order.customer_name}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(order.created_date).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="font-bold text-xl text-foreground">{formatCurrency(order.total)}</p>
                        </div>
                        {expanded ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded content */}
            {expanded && (
                <div className="border-t border-slate-100">
                    {/* Customer Info */}
                    <div className="p-4 bg-slate-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            <div>
                                <p className="text-xs text-muted-foreground">Customer</p>
                                <p className="font-medium text-foreground">{order.customer_name}</p>
                            </div>
                        </div>
                        {order.customer_phone && (
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-primary" />
                                <div className='flex flex-col'>
                                    <p className="text-xs text-muted-foreground">Phone</p>
                                    <p className="font-medium text-foreground">{order.customer_phone}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Items */}
                    <div className="p-4">
                        <h4 className="font-semibold text-foreground mb-3">Order Items</h4>
                        <div className="space-y-3">
                            {order.items?.map((item, index) => (
                                <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-lg">
                                            🍕
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{item.pizza_name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {item.size} × {item.quantity}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-semibold text-foreground">
                                        {formatCurrency(item.price * item.quantity)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                            <div className="flex justify-between font-bold text-lg">
                                <span className="text-foreground">Total</span>
                                <span className="text-primary">{formatCurrency(order.total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">Update status:</span>
                            <Select
                                value={order.status}
                                onValueChange={(value) => handleStatusUpdate(value)}
                                disabled={isUpdating}
                            >
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(statusConfig).map(([key, config]) => (
                                        <SelectItem key={key} value={key}>
                                            {config.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {status.next && order.status !== 'cancelled' && (
                            <Button
                                onClick={() => handleStatusUpdate(status.next!)}
                                disabled={isUpdating}
                                className="bg-gradient-to-r from-green-600 to-green-500 hover:opacity-90 text-white"
                            >
                                Mark as {statusConfig[status.next]?.label}
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
