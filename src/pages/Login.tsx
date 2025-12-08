
import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useMutation } from "@tanstack/react-query"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChefHat } from "lucide-react"
import { api } from "@/lib/api"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const loginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function Login() {
    const [error, setError] = useState("")

    const login = useAuthStore((state) => state.login)
    const navigate = useNavigate()

    const { mutate: loginMutation, isPending } = useMutation({
        mutationFn: async (data: LoginFormValues) => {
            const response = await api.post('/auth/shop/login', data)
            return response.data
        },
        onSuccess: (data) => {
            const { access_token, shop } = data

            console.log({ shop })
            if (access_token && shop) {
                login(access_token, shop)
                navigate({ to: '/' })
            } else {
                setError("Invalid credentials or missing shop data")
            }
        },
        onError: (err) => {
            console.error("Login failed", err)
            setError("Login failed. Please check your username and password.")
        },
    })

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = (data: LoginFormValues) => {
        setError("")
        loginMutation(data)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D2691E] to-[#8B4513] flex items-center justify-center">
                            <ChefHat className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                    <CardDescription>
                        Enter your credentials to access the owner portal
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                placeholder="admin"
                                {...register("username")}
                            />
                            {errors.username && (
                                <p className="text-sm text-red-500">{errors.username.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                {...register("password")}
                            />
                            {errors.password && (
                                <p className="text-sm text-red-500">{errors.password.message}</p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? "Signing in..." : "Sign in"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
