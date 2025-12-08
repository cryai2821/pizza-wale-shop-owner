import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Toaster } from '@/components/ui/toaster';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';

export default function Layout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Enable real-time updates and notifications
    useRealtimeOrders();

    return (
        <div className="h-screen bg-slate-50 flex overflow-hidden">
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col h-full lg:ml-0 overflow-hidden">
                <Header title="Dashboard" onMenuClick={() => setSidebarOpen(true)} />

                <main className="flex-1 p-4 lg:p-8 overflow-auto">
                    {children}
                </main>
            </div>
            <Toaster />
        </div>
    );
}
