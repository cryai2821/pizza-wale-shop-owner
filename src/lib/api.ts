import axios from 'axios';
import { Order } from '../types';

// Use environment variable or default to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

import { useAuthStore } from '@/store/authStore';

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getShopMenu = async (shopId: string): Promise<any[]> => {
    const response = await api.get(`/shops/${shopId}/menu`);
    const categories = response.data;
    // Transform or just return categories. Dashboard expects categories to extract products.
    // The previous code in Dashboard handled `cat.products`.
    // Let's just return categories as is, but maybe we should type it.
    // Ideally we should have a BackendTypes vs FrontendTypes.
    return categories;
};

export const getShopOrders = async (shopId: string): Promise<Order[]> => {
    const response = await api.get(`/shops/${shopId}/orders`);
    // Transform backend order to frontend Order interface
    return response.data.map((o: any) => ({
        id: o.id,
        order_number: o.shortId || o.id.substring(0, 8),
        customer_name: o.user?.name || "Guest",
        customer_phone: o.guestPhone,
        total: Number(o.totalAmount),
        status: o.status.toLowerCase(),
        created_date: o.createdAt,
        items: o.items.map((i: any) => ({
            pizza_id: i.productId,
            pizza_name: i.product?.name || "Unknown",
            size: "Medium", // Backend might not have size derived easily in top level list
            quantity: i.quantity,
            price: Number(i.price || 0),
        }))
    }));
};

export const updateOrderStatus = async (orderId: string, status: string): Promise<any> => {
    // Backend uses POST and expects uppercase status
    const response = await api.post(`/orders/${orderId}/status`, { status: status.toUpperCase() });
    return response.data;
};

// Deprecated: kept for backward compatibility if needed, but should be removed
export const base44 = {
    entities: {
        Pizza: {
            list: async () => {
                // This is legacy. Dashboard calling this expects Pizza[].
                // We shouldn't use this anymore.
                return [];
            }
        },
        Order: {
            list: async () => {
                return [];
            }
        }
    },
    auth: {
        me: async () => {
             return { name: "Pizza Owner", email: "owner@pizzahub.com" };
        }
    }
};
