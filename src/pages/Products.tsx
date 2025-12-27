import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard, { Product } from '@/components/products/ProductCard';
import ProductForm from '@/components/products/ProductForm';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Products() {
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPizza, setEditingPizza] = useState<Product | null>(null);

    const queryClient = useQueryClient();

    // Auth Store Access
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const shopId = user?.id;

    // Helper for headers
    const getHeaders = () => ({ Authorization: `Bearer ${token}` });

    // 1. Fetch Menu (Categories + Products)
    // We expect the backend to return an array of Categories, each with a products array.
    const { data: menu = [], isLoading } = useQuery({
        queryKey: ['menu', shopId],
        queryFn: async () => {
            if (!shopId) return [];
            if (!shopId) return [];
            // Use admin endpoint which includes unavailable products
            const res = await axios.get(
                `${API_URL}/shops/${shopId}/admin/menu`,
                { headers: getHeaders() } // Needs auth now
            );
            // Cast response to expected structure
            return res.data as { id: string; name: string; products: any[] }[];
        },
        enabled: !!shopId,
    });

    // Flatten products for display, attaching category info
    const allProducts = React.useMemo(() => {
        if (!menu) return [];
        return menu.flatMap(category =>
            (category.products || []).map(product => ({
                ...product,
                category: { id: category.id, name: category.name }
            }))
        );
    }, [menu]);

    // 2. Mutations
    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const payload = { ...data, basePrice: Number(data.basePrice) };
            const res = await axios.post(
                `${API_URL}/shops/${shopId}/product`,
                payload,
                { headers: getHeaders() }
            );
            return res.data;
        },
        onSuccess: (newProduct) => {
            // Manually update cache to avoid refetching
            queryClient.setQueryData(['menu', shopId], (old: any[]) => {
                if (!old) return [];
                return old.map(category => {
                    if (category.id === newProduct.categoryId) {
                        return {
                            ...category,
                            products: [...(category.products || []), newProduct]
                        };
                    }
                    return category;
                });
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            // Include categoryId connection if changed (backend handles this logic usually, 
            // but ensure we return the full updated object)
            const res = await axios.put(
                `${API_URL}/shops/${shopId}/product/${id}`,
                data,
                { headers: getHeaders() }
            );
            return res.data;
        },
        onSuccess: (updatedProduct) => {
            // Manually update cache
            queryClient.setQueryData(['menu', shopId], (old: any[]) => {
                if (!old) return [];

                // If category changed, we need to remove from old and add to new
                // For simplicity, we'll map through all and ensure it's in the right place

                // First: Remove from all categories just in case (to handle moves)
                const withoutProduct = old.map(cat => ({
                    ...cat,
                    products: cat.products.filter((p: any) => p.id !== updatedProduct.id)
                }));

                // Second: Add to correct category
                return withoutProduct.map(cat => {
                    if (cat.id === updatedProduct.categoryId) {
                        return {
                            ...cat,
                            products: [...cat.products, updatedProduct]
                        };
                    }
                    return cat;
                });
            });
        },
    });

    const handleSave = async (data: any) => {
        if (editingPizza) {
            await updateMutation.mutateAsync({ id: editingPizza.id, data });
        } else {
            await createMutation.mutateAsync(data);
        }
        setEditingPizza(null);
    };

    const handleEdit = (pizza: Product) => {
        setEditingPizza(pizza);
        setIsFormOpen(true); // Open the form
    };

    // Filter products
    const filteredProducts = allProducts.filter((pizza: any) => {
        const matchesSearch = pizza.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            pizza.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || pizza.category.id === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    // Unique categories for filter
    const categories = React.useMemo(() => {
        return menu.map(c => ({ value: c.id, label: c.name }));
    }, [menu]);

    // Show loading state or error if data isn't ready
    if (!shopId) {
        // Fallback if useAuthStore hasn't hydrated or user isn't logged in
        // Ideally we redirect, but showing a message is fine for now
        return <div className="p-8 text-center text-red-500">Shop context missing. Please log in.</div>;
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#2F4F4F]">Pizza Products</h1>
                    <p className="text-slate-500 mt-1">Manage your pizza menu items</p>
                </div>
                <Button
                    onClick={() => {
                        setEditingPizza(null);
                        setIsFormOpen(true);
                    }}
                    className="bg-gradient-to-r from-[#D2691E] to-[#FF6347] hover:opacity-90 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Pizza
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search pizzas..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-full sm:w-48">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>
                                    {cat.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <Skeleton key={i} className="h-80 rounded-2xl" />
                    ))}
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                    <div className="text-6xl mb-4">🍕</div>
                    <h3 className="text-xl font-semibold text-[#2F4F4F]">No pizzas found</h3>
                    <p className="text-slate-500 mt-2">
                        {searchQuery || categoryFilter !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Add your first pizza to get started'}
                    </p>
                    {!searchQuery && categoryFilter === 'all' && (
                        <Button
                            onClick={() => setIsFormOpen(true)}
                            className="mt-4 bg-gradient-to-r from-[#D2691E] to-[#FF6347]"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Your First Pizza
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map(pizza => (
                        <ProductCard
                            key={pizza.id}
                            pizza={pizza}
                            onEdit={handleEdit}
                        />
                    ))}
                </div>
            )}

            {/* Product Form */}
            {isFormOpen && (
                <ProductForm
                    shopId={shopId}
                    pizza={editingPizza}
                    isOpen={isFormOpen}
                    onClose={() => {
                        setIsFormOpen(false);
                        setEditingPizza(null);
                    }}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
