
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import Layout from '../Layout'
import { useAuthStore } from '@/store/authStore'

export const Route = createFileRoute('/_layout')({
    beforeLoad: ({ location }) => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated
        if (!isAuthenticated) {
            throw redirect({
                to: '/login',
                search: {
                    redirect: location.href,
                },
            })
        }
    },
    component: () => (
        <Layout>
            <Outlet />
        </Layout>
    ),
})
