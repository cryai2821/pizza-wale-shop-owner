
import { createFileRoute } from '@tanstack/react-router'
import MenuCatalog from '../pages/MenuCatalog'

export const Route = createFileRoute('/_layout/menu-catalog')({
    component: MenuCatalog,
})
