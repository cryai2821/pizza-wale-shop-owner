
import { createFileRoute } from '@tanstack/react-router'
import Orders from '../pages/Orders'

export const Route = createFileRoute('/_layout/orders')({
    component: Orders,
})
