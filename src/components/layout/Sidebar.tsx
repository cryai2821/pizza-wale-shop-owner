

import { Link } from '@tanstack/react-router';
import {
    LayoutDashboard,
    Pizza,
    ClipboardList,
    Menu,
    X,
    ChefHat,
    Tag,
    Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, to: '/' },
    { name: 'Products', icon: Pizza, to: '/products' },
    { name: 'Menu Catalog', icon: Menu, to: '/menu-catalog' },
    { name: 'Orders', icon: ClipboardList, to: '/orders' },
    { name: 'Promotions', icon: Tag, to: '/promotions' },
    { name: 'Settings', icon: Settings, to: '/settings' },
];

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={cn(
                "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out",
                "lg:transform-none",
                isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D2691E] to-[#8B4513] flex items-center justify-center">
                                <ChefHat className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-[#2F4F4F]">PizzaHub</h1>
                                <p className="text-xs text-slate-500">Owner Portal</p>
                            </div>
                        </Link>
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2">
                        {navItems.map((item) => {
                            return (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    onClick={onClose}
                                    activeProps={{
                                        className: "bg-gradient-to-r from-[#D2691E] to-[#FF6347] text-white shadow-lg shadow-orange-200"
                                    }}
                                    inactiveProps={{
                                        className: "text-[#2F4F4F] hover:bg-orange-50"
                                    }}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200"
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-200">
                        <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl">
                            <p className="text-sm font-medium text-[#8B4513]">Need help?</p>
                            <p className="text-xs text-slate-500 mt-1">Contact support anytime</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
