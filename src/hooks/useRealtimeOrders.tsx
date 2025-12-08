import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useNavigate } from '@tanstack/react-router';

// Audio context for sound
const playNotificationSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const audioContext = new AudioContext();

        // Resume context if suspended (browser autoplay policy)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Pleasant notification sound
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.error('Error playing notification sound:', error);
    }
};

export function useRealtimeOrders() {
    const user = useAuthStore((state) => state.user);
    const shopId = user?.id;
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const navigate = useNavigate();
    const processedOrdersRef = useRef<Set<string>>(new Set());
    const isFirstLoadRef = useRef(true);

    useEffect(() => {
        if (!shopId) return;

        console.log('Setting up Firebase listener for shop:', shopId);

        // Correct path as per backend FirestoreService: shops/{shopId}/orders
        const q = query(
            collection(db, 'shops', shopId, 'orders')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                const orderData = change.doc.data();
                const orderId = change.doc.id;

                // Sync with React Query cache
                queryClient.invalidateQueries({ queryKey: ['shop-orders', shopId] });

                if (change.type === 'added') {
                    if (isFirstLoadRef.current) {
                        processedOrdersRef.current.add(orderId);
                        return;
                    }

                    if (!processedOrdersRef.current.has(orderId)) {
                        // New Order!
                        console.log('New order received:', orderData);

                        // Check if sound is enabled
                        const soundEnabled = localStorage.getItem('notifications_sound') !== 'false';
                        if (soundEnabled) {
                            playNotificationSound();
                        }

                        toast({
                            title: `New Order #${orderData.shortId || orderId.slice(0, 4)}`,
                            description: `New order received for $${orderData.totalAmount}`,
                            onClick: () => navigate({ to: '/orders' }),
                            action: (
                                <ToastAction altText="View Order" onClick={(e) => {
                                    e.stopPropagation();
                                    navigate({ to: '/orders' });
                                }}>
                                    View
                                </ToastAction>
                            ),
                        });
                        processedOrdersRef.current.add(orderId);
                    }
                } else if (change.type === 'modified') {
                    console.log('Order modified:', orderData);
                }
            });

            isFirstLoadRef.current = false;
        }, (error) => {
            console.error('Firebase snapshot error:', error);
            if (error.code === 'permission-denied') {
                console.error('⚠️ PERMISSION DENIED: Your Firestore Security Rules are blocking access. Please update rules in Firebase Console.');
                toast({
                    variant: "destructive",
                    title: "Connection Error",
                    description: "Cannot connect to orders. Check Firebase Rules."
                });
            }
        });

        return () => unsubscribe();
    }, [shopId, queryClient, toast, navigate]);
}
