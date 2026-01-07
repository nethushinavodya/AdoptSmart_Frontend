// axiosConfig.ts
// apiService.ts
// api.ts
import axios, { AxiosError } from "axios"
import { refreshTokens } from "./auth"
import dotenv from "dotenv";
dotenv.config();

const base = (process.env.REACT_APP_API_BASE_URL || "https://adoptsmartbackend-production.up.railway.app")
  .replace(/\/+$/, "")
const api = axios.create({
  baseURL: base + "/api/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

const PUBLIC_ENDPOINTS = ["/auth/login", "/auth/register"]

api.interceptors.request.use(
  (config) => {
    // guard config and headers to avoid runtime errors
    config = config || {}
    config.headers = config.headers || {}

    const token = localStorage.getItem("accessToken")
    const url = config.url || ""
    const isPublic = PUBLIC_ENDPOINTS.some((u) => url.includes(u))

    if (token && !isPublic) {
      ;(config.headers as any).Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  async (err: AxiosError | any) => {
    const originalRequest: any = err?.config || {}

    // Network / no-response case
    if (!err?.response) {
      // Provide clearer guidance when server is unreachable (could be backend down or DB failure)
      const msg =
        "Network Error: Unable to connect to the server. Check backend is running and DB (MongoDB Atlas) allows connections from your host. See backend logs for MongooseServerSelectionError."
      console.error(msg, err?.message || err)
      return Promise.reject(new Error(msg))
    }

    const isPublic = PUBLIC_ENDPOINTS.some((u) =>
      (originalRequest?.url || "").includes(u)
    )

    if (err.response?.status === 401 && !isPublic && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem("refreshToken")
        if (!refreshToken) throw new Error("No refresh token available")

        const res = await refreshTokens(refreshToken)
        if (!res || !res.accessToken) throw new Error("Invalid refresh response")

        localStorage.setItem("accessToken", res.accessToken)

        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${res.accessToken}`

        return axios(originalRequest)
      } catch (error) {
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")
        window.location.href = "/login"
        console.error(error)
        return Promise.reject(error)
      }
    }

    return Promise.reject(err)
  }
)

export default api