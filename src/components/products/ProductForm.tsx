import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Product } from './ProductCard';
import { useAuthStore } from '@/store/authStore';

// Simple Modal since Dialog is missing
const Modal = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-[#2F4F4F]">{title}</h2>
                    <button onClick={onClose}><X className="w-6 h-6" /></button>
                </div>
                {children}
            </div>
        </div>
    );
};

interface Size {
    name: string;
    price: number | string;
}

interface ProductFormProps {
    pizza: Product | null;
    shopId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
}

const defaultSizes: Size[] = [
    { name: 'Small', price: 0 },
    { name: 'Medium', price: 3 },
    { name: 'Large', price: 6 },
];

const EMPTY_CATEGORIES: { id: string; name: string }[] = [];

export default function ProductForm({ pizza, shopId, isOpen, onClose, onSave }: ProductFormProps) {
    const { data: categories = EMPTY_CATEGORIES } = useQuery({
        queryKey: ['categories', shopId],
        queryFn: async () => {
            if (!shopId) return [];
            try {
                // Use admin endpoint for consistency
                const res = await axios.get(
                    `http://localhost:5000/shops/${shopId}/admin/menu`,
                    { headers: { Authorization: `Bearer ${token}` } } // Assuming token is available... wait, token is used later in handleCreateCategory. Check scope.
                );
                if (res.data && res.data.length > 0) return res.data as { id: string; name: string }[];
                return [];
            } catch (error) {
                console.error("Failed to fetch categories", error);
                return [];
            }
        },
        enabled: !!shopId && isOpen
    });

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        categoryId: '',
        basePrice: '' as string | number,
        sizes: defaultSizes,
        toppings: [] as string[],
        imageUrl: '',
        isAvailable: true,
    });

    const [newTopping, setNewTopping] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Category Creation State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const queryClient = useQueryClient();

    // Auth for upload/api token
    const token = useAuthStore((state) => state.token);

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim() || !shopId) return;

        setIsCreatingCategory(true);
        try {
            const res = await axios.post(
                `http://localhost:5000/shops/${shopId}/category`,
                { name: newCategoryName },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Refresh categories
            await queryClient.invalidateQueries({ queryKey: ['categories', shopId] });

            // Auto-select the new category
            if (res.data && res.data.id) {
                setFormData(prev => ({ ...prev, categoryId: res.data.id }));
            }

            setNewCategoryName('');
            setIsCategoryModalOpen(false);
        } catch (error) {
            console.error("Failed to create category", error);
            alert("Failed to create category");
        } finally {
            setIsCreatingCategory(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. Preview immediately
        // const previewUrl = URL.createObjectURL(file);
        // setFormData(prev => ({ ...prev, imageUrl: previewUrl })); // Optimistic preview? 
        // Better to wait for upload for the real URL, or use local preview separately.
        // Let's use the local file for preview while uploading?
        // Actually user wants "on select... it will be uploaded... on submit that URL stored"

        setIsUploading(true);
        try {
            // 2. Get Presigned URL
            const { data: presignedData } = await axios.post(
                'http://localhost:5000/uploads/presigned-url',
                {
                    filename: file.name,
                    contentType: file.type
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const { uploadUrl, publicUrl } = presignedData;

            // 3. Upload to S3
            await axios.put(uploadUrl, file, {
                headers: { 'Content-Type': file.type }
            });

            // 4. Update Form Data with Public URL
            setFormData(prev => ({ ...prev, imageUrl: publicUrl }));

        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    // Initialization Effect
    useEffect(() => {
        if (isOpen) {
            if (pizza) {
                const sizeGroup = pizza.optionConfigs?.find((c: any) => c.optionGroup.name === 'Size')?.optionGroup;
                const toppingGroup = pizza.optionConfigs?.find((c: any) => c.optionGroup.name === 'Toppings')?.optionGroup;

                setFormData({
                    name: pizza.name,
                    description: pizza.description || '',
                    categoryId: pizza.categoryId || '',
                    basePrice: pizza.basePrice?.toString() || '',
                    imageUrl: pizza.imageUrl || '',
                    isAvailable: pizza.isAvailable,
                    sizes: sizeGroup?.options.map((o: any) => ({ name: o.name, price: Number(o.price) })) || defaultSizes,
                    toppings: toppingGroup?.options.map((o: any) => o.name) || [],
                });
            } else {
                setFormData({
                    name: '',
                    description: '',
                    categoryId: '',
                    basePrice: '',
                    sizes: defaultSizes,
                    toppings: [],
                    imageUrl: '',
                    isAvailable: true,
                });
            }
        }
    }, [pizza, isOpen]);

    // Category Auto-Select Effect
    useEffect(() => {
        // Only auto-select if adding new pizza, no category selected, and we have categories
        if (!pizza && !formData.categoryId && categories.length > 0) {
            setFormData(prev => ({ ...prev, categoryId: categories[0].id }));
        }
    }, [categories, pizza, formData.categoryId]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                basePrice: parseFloat(formData.basePrice.toString()) || 0,
                categoryId: formData.categoryId,
                imageUrl: formData.imageUrl,
                isAvailable: formData.isAvailable,
                options: [
                    {
                        name: 'Size',
                        minSelect: 1, maxSelect: 1,
                        options: formData.sizes.map(s => ({
                            name: s.name, price: parseFloat(s.price.toString()) || 0,
                        })),
                    },
                    {
                        name: 'Toppings',
                        minSelect: 0, maxSelect: 10,
                        options: formData.toppings.map(t => ({ name: t, price: 0 })),
                    },
                ].filter(g => g.options.length > 0),
            };

            await onSave(payload);
            onClose();
        } catch (error) {
            console.error('Error saving pizza:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const addTopping = () => {
        if (newTopping.trim()) {
            setFormData(prev => ({ ...prev, toppings: [...prev.toppings, newTopping.trim()] }));
            setNewTopping('');
        }
    };

    const removeTopping = (index: number) => {
        setFormData(prev => ({ ...prev, toppings: prev.toppings.filter((_, i) => i !== index) }));
    };

    const updateSize = (index: number, field: keyof Size, value: string) => {
        setFormData(prev => ({
            ...prev,
            sizes: prev.sizes.map((s, i) => i === index ? { ...s, [field]: value } : s)
        }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={pizza ? 'Edit Pizza' : 'Add New Pizza'}>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Pizza Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Margherita"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <div className="flex gap-2">
                            <Select
                                value={formData.categoryId}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setIsCategoryModalOpen(true)}
                                title="Add New Category"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Sub-Modal for New Category */}
                <Modal
                    isOpen={isCategoryModalOpen}
                    onClose={() => setIsCategoryModalOpen(false)}
                    title="Add New Category"
                >
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="newCategory">Category Name</Label>
                            <Input
                                id="newCategory"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="e.g. Sides, Drinks"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsCategoryModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateCategory}
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                                disabled={!newCategoryName.trim() || isCreatingCategory}
                            >
                                {isCreatingCategory ? 'Creating...' : 'Create Category'}
                            </Button>
                        </div>
                    </div>
                </Modal>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                        id="description"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your pizza..."
                        rows={3}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="basePrice">Base Price (₹) *</Label>
                        <Input
                            id="basePrice"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.basePrice}
                            onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                            placeholder="12.99"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="imageUrl">Product Image</Label>
                        <div className="flex flex-col gap-4">
                            {/* Preview Area */}
                            {(formData.imageUrl || isUploading) && (
                                <div className="relative w-full h-48 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                    {isUploading ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/5 text-white">
                                            <div className="flex flex-col items-center text-slate-500">
                                                <div className="w-8 h-8 border-4 border-slate-300 border-t-orange-500 rounded-full animate-spin mb-2"></div>
                                                <span className="text-sm font-medium">Uploading...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <img
                                            src={formData.imageUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                            )}

                            {/* File Input */}
                            <div className="flex items-center gap-2">
                                <Input
                                    id="imageUpload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                                    disabled={isUploading}
                                />
                            </div>
                            {/* Fallback URL input (optional, hidden or read-only if strictly upload) */}
                            {/* <Input value={formData.imageUrl} readOnly placeholder="Image URL will appear here" className="bg-slate-50 text-slate-500" /> */}
                        </div>
                    </div>
                </div>

                {/* Sizes Section */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                    <Label className="text-base font-semibold">Sizes & Price Adjustments</Label>
                    <div className="space-y-2">
                        {formData.sizes.map((size, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <Input
                                    value={size.name}
                                    onChange={(e) => updateSize(index, 'name', e.target.value)}
                                    placeholder="Size Name"
                                    className="flex-1"
                                />
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500">+₹</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={size.price}
                                        onChange={(e) => updateSize(index, 'price', e.target.value)}
                                        className="w-24"
                                        placeholder="Add. Price"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Toppings Section */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                    <Label className="text-base font-semibold">Toppings (Free Add-ons)</Label>
                    <div className="flex gap-2">
                        <Input
                            value={newTopping}
                            onChange={(e) => setNewTopping(e.target.value)}
                            placeholder="Add topping..."
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTopping())}
                        />
                        <Button type="button" onClick={addTopping} variant="outline">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.toppings.map((topping, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-[#8B4513] rounded-full text-sm"
                            >
                                {topping}
                                <button
                                    type="button"
                                    onClick={() => removeTopping(index)}
                                    className="hover:text-red-500 ml-1"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between py-4 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isAvailable"
                            checked={formData.isAvailable}
                            onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="isAvailable">Available for ordering</Label>
                    </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="bg-gradient-to-r from-[#D2691E] to-[#FF6347] hover:opacity-90 text-white"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Saving...' : (pizza ? 'Update Pizza' : 'Add Pizza')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
