import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { Edit, Trash2, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface Product {
    id: string;
    name: string;
    description?: string;
    basePrice: number | string;
    imageUrl?: string;
    isAvailable: boolean;
    categoryId?: string;
    category?: {
        name: string;
        id: string;
    };
    optionConfigs?: any[];
}

interface ProductCardProps {
    pizza: Product;
    onEdit: (pizza: Product) => void;
}

export default function ProductCard({ pizza, onEdit }: ProductCardProps) {
    const { token, user } = useAuthStore();
    const shopId = user?.id;
    const queryClient = useQueryClient();

    const headers = { Authorization: `Bearer ${token}` };

    const toggleMutation = useMutation({
        mutationFn: async () => {
            await axios.put(
                `${API_URL}/shops/${shopId}/product/${pizza.id}`,
                { isAvailable: !pizza.isAvailable },
                { headers }
            );
        },
        onSuccess: () => {
            // Manually update cache on success to avoid refetching
            queryClient.setQueryData(['menu', shopId], (old: any[]) => {
                if (!old) return old;
                return old.map(category => ({
                    ...category,
                    products: category.products.map((p: Product) =>
                        p.id === pizza.id ? { ...p, isAvailable: !p.isAvailable } : p
                    )
                }));
            });
        },
        onError: (error) => {
            console.error("Failed to toggle availability", error);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            // Mock delete for now as previously implemented
            console.warn('Delete API not implemented yet for id:', pizza.id);
            // await axios.delete(`${API_URL}/shops/${shopId}/product/${pizza.id}`, { headers });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menu', shopId] });
        }
    });

    const isUpdating = toggleMutation.isPending;
    const isDeleting = deleteMutation.isPending;

    const handleToggle = () => toggleMutation.mutate();
    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete "${pizza.name}"?`)) {
            deleteMutation.mutate();
        }
    };

    if (!pizza) return null;

    return (
        <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg border-slate-100 ${!pizza.isAvailable ? 'opacity-75' : ''}`}>
            {/* Image Section */}
            <div className="relative h-48 overflow-hidden bg-slate-100">
                <img
                    src={pizza.imageUrl || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop'}
                    alt={pizza.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Overlay Actions */}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 bg-white/90 hover:bg-white text-slate-700"
                        onClick={() => onEdit(pizza)}
                        title="Edit Pizza"
                        disabled={isDeleting || isUpdating}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8 bg-red-500/90 hover:bg-red-600"
                        onClick={handleDelete}
                        title="Delete Pizza"
                        disabled={isDeleting || isUpdating}
                    >
                        {isDeleting ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                {/* Status Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-2">
                    {!pizza.isAvailable && (
                        <Badge variant="destructive" className="shadow-sm">
                            Unavailable
                        </Badge>
                    )}
                </div>
            </div>

            {/* Content */}
            <CardContent className="p-4">
                <div className="mb-2 flex justify-between items-start gap-2">
                    <h3 className="font-bold text-lg text-[#2F4F4F] truncate" title={pizza.name}>
                        {pizza.name}
                    </h3>
                    <span className="font-semibold text-[#D2691E] whitespace-nowrap">
                        ₹{Number(pizza.basePrice).toFixed(2)}
                    </span>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2 h-10 mb-3">
                    {pizza.description || 'No description available'}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="capitalize px-2 py-1 bg-slate-50 rounded-full">
                        {pizza.category?.name || 'Uncategorized'}
                    </span>
                </div>
            </CardContent>

            {/* Footer Actions */}
            <CardFooter className="p-4 pt-0 flex gap-2">
                <Button
                    variant={pizza.isAvailable ? "outline" : "default"}
                    className={`w-full ${!pizza.isAvailable ? 'bg-slate-800' : 'hover:bg-slate-50'}`}
                    onClick={handleToggle}
                    disabled={isUpdating}
                >
                    {isUpdating && (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    )}
                    {pizza.isAvailable ? (
                        <>
                            <PowerOff className="w-4 h-4 mr-2" />
                            Mark Unavailable
                        </>
                    ) : (
                        <>
                            <Power className="w-4 h-4 mr-2" />
                            Mark Available
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
