
import { createFileRoute } from '@tanstack/react-router'
import Promotions from '../pages/Promotions'

export const Route = createFileRoute('/_layout/promotions')({
    component: Promotions,
})
