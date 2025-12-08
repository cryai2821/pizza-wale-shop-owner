export type PizzaCategory = 'classic' | 'specialty' | 'vegetarian' | 'meat_lovers' | 'seafood' | 'custom';

export interface PizzaSize {
    size: string;
    price: number;
}

export interface Pizza {
    id: string; // Added ID
    name: string;
    description?: string;
    category: PizzaCategory;
    base_price: number;
    sizes: PizzaSize[];
    toppings: string[];
    image_url?: string;
    is_available: boolean;
    is_featured: boolean;
    prep_time?: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface OrderItem {
    pizza_id: string;
    pizza_name: string;
    size: string;
    quantity: number;
    price: number;
    special_instructions?: string;
}

export interface Order {
    id: string; // Added ID
    order_number: string;
    customer_name: string;
    customer_phone?: string;
    customer_address?: string;
    order_type?: 'dine_in' | 'takeout' | 'delivery';
    items: OrderItem[];
    subtotal?: number;
    tax?: number;
    total: number;
    status: OrderStatus;
    created_date: string; // ISO Date
    estimated_ready_time?: string;
    notes?: string;
}
