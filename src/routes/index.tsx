import { lazy, Suspense, type ReactNode } from "react"
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom"
import { useAuth } from "../context/authContext"
import Layout from "../components/Layout"

const Home = lazy(() => import("../pages/Home"))
const Login = lazy(() => import("../pages/Login"))
const Register = lazy(() => import("../pages/Register"))
const FindPets = lazy(() => import("../pages/FindPet.tsx"))
const PetDetail = lazy(() => import("../pages/PetDetail.tsx"))
const SuccessStory = lazy(() => import("../pages/SuccessStory.tsx"))
const AddPetPost = lazy(() => import("../pages/AddPetPost.tsx"))
const AddSuccessStory = lazy(() => import("../pages/AddSuccessStory.tsx"))
const UserProfile = lazy(() => import("../pages/UserProfile.tsx"))
const Admin = lazy(() => import("../pages/Admin.tsx"))

type RequireAuthTypes = { children: ReactNode; roles?: string[] }

const RequireAuth = ({ children, roles }: RequireAuthTypes) => {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />
    }

    // Check if user is admin
    const isAdmin = (user.role || []).includes("admin")

    if (roles && !roles.some((role) => (user.role || []).includes(role))) {
        return <Navigate to="/home" replace />
    }

    if (!roles && isAdmin) {
        return <Navigate to="/admin/dashboard" replace />
    }

    return <>{children}</>
}

export default function Router() {
    return (
        <BrowserRouter>
            <Suspense
                fallback={
                    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-4">
                                <svg className="w-10 h-10 text-orange-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                            <p className="text-orange-600 font-semibold text-lg">Loading AdoptSmart...</p>
                        </div>
                    </div>
                }
            >
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route
                        element={
                            <RequireAuth>
                                <Layout />
                            </RequireAuth>
                        }
                    >
                        <Route path="/" element={<Navigate to="/home" replace />} />
                        <Route path="/home" element={<Home />} />
                        <Route path="/pets" element={<FindPets />} />
                        <Route path="/pets/:id" element={<PetDetail />} />
                        <Route path="/success-stories" element={<SuccessStory />} />
                        <Route path="/success-stories/add" element={<AddSuccessStory />} />
                        <Route path="/add-pet" element={<AddPetPost />} />
                        <Route path="/profile" element={<UserProfile />} />
                    </Route>

                    <Route
                        path="/admin/dashboard"
                        element={
                            <RequireAuth roles={["admin"]}>
                                <Admin />
                            </RequireAuth>
                        }
                    />
                </Routes>
            </Suspense>
        </BrowserRouter>
    )
}
