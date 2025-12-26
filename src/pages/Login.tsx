import { useState, type FormEvent } from "react"
import { getMyDetails, login } from "../services/auth"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/authContext"

export default function Login() {
    const navigate = useNavigate()
    const { setUser } = useAuth()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault()
        setError("")

        if (!email || !password) {
            setError("Please fill in all fields.")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await login(email, password)
            if (!res?.data?.accessToken) {
                setError("Login failed. Please try again.")
                setIsSubmitting(false)
                return
            }

            localStorage.setItem("accessToken", res.data.accessToken)
            localStorage.setItem("refreshToken", res.data.refreshToken)

            const detail = await getMyDetails()
            setUser(detail.data)

            navigate("/home")
        } catch (err: any) {
            console.error(err)
            if (err.message?.includes("Unable to connect to the server")) {
                setError("Cannot connect to server. Please make sure the backend is running at http://localhost:5000")
            } else {
                setError(err?.response?.data?.message || "Login error. Please try again.")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-white to-orange-50 flex items-center justify-center p-6">
            <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="hidden md:flex flex-col items-start justify-center gap-6 px-6">
                    <div className="flex items-center gap-3">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow">
                            <path d="M12 13c-2.5 0-4.5 1.5-4.5 3.5S9.5 20 12 20s4.5-1.5 4.5-3.5S14.5 13 12 13z" fill="#FB923C"/>
                            <path d="M6.2 8.7c.9-.9 2.6-1.1 3.6-.4.9.7 1.2 2 .3 2.9-.9.9-2.6 1.1-3.6.4-.9-.7-1.2-2-.3-2.9z" fill="#FB923C"/>
                            <path d="M17.8 8.7c-.9-.9-2.6-1.1-3.6-.4-.9.7-1.2 2-.3 2.9.9.9 2.6 1.1 3.6.4.9-.7 1.2-2 .3-2.9z" fill="#FB923C"/>
                            <path d="M8.2 4.6c.6-.8 1.9-1.1 2.8-.6.9.5 1.3 1.6.7 2.4-.6.8-1.9 1.1-2.8.6-.9-.5-1.3-1.6-.7-2.4z" fill="#FB923C"/>
                            <path d="M15.8 4.6c-.6-.8-1.9-1.1-2.8-.6-.9.5-1.3 1.6-.7 2.4.6.8 1.9 1.1 2.8.6.9-.5 1.3-1.6.7-2.4z" fill="#FB923C"/>
                        </svg>
                        <div>
                            <div className="text-2xl font-bold text-orange-500">AdoptSmart</div>
                            <div className="text-xs text-gray-500 -mt-1">Find your new best friend</div>
                        </div>
                    </div>

                    <h1 className="text-4xl font-extrabold text-orange-500">Welcome back</h1>
                    <p className="text-gray-600 max-w-sm">
                        Sign in to your AdoptSmart account to continue browsing adoptable pets, manage your listings, and connect with adopters.
                    </p>

                    <div className="mt-4 p-6 rounded-lg bg-white shadow-sm w-full max-w-sm">
                        <div className="text-lg font-semibold text-orange-500">Why AdoptSmart?</div>
                        <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                            <li>Discover pets near you</li>
                            <li>Safe and simple adoption process</li>
                            <li>Support animal welfare</li>
                        </ul>
                    </div>
                </div>

                <div className="flex items-center justify-center px-4">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Sign in</h2>
                                <p className="text-sm text-gray-500 mt-1">Welcome to AdoptSmart — enter your credentials</p>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-4">
                            <label className="flex flex-col">
                                <span className="text-sm font-medium text-gray-700 mb-1">Email</span>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                                />
                            </label>

                            <label className="flex flex-col">
                                <span className="text-sm font-medium text-gray-700 mb-1">Password</span>
                                <input
                                    type="password"
                                    placeholder="Your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                                />
                            </label>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full px-4 py-2 rounded-lg text-white font-semibold transition ${isSubmitting ? "bg-orange-200" : "bg-orange-500 hover:bg-orange-600"}`}
                            >
                                {isSubmitting ? "Signing in..." : "Sign in"}
                            </button>

                            <div className="flex items-center justify-between text-sm text-gray-600">
                                <Link to="/register" className="text-orange-500 font-medium">Create account</Link>
                                <Link to="/forgot-password" className="text-gray-500 hover:text-gray-700">Forgot password?</Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
