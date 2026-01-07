import axios, { AxiosError } from "axios"
import { refreshTokens } from "./auth"
import dotenv from "dotenv"
dotenv.config()

const API_BASE_URL = process.env.VITE_API_BASE_URL || "/api/v1"
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

const PUBLIC_ENDPOINTS = ["/auth/login", "/auth/register"]

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken")
    const url = config.url || ""
    const isPublic = PUBLIC_ENDPOINTS.some((u) => url.includes(u))

    if (token && !isPublic) {
      config.headers = config.headers || {}
      // allow TS to set header on possibly unknown headers shape
      ;(config.headers as any).Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    return response
  },
  async (err: AxiosError | any) => {
    const originalRequest: any = err?.config || {}

    // Network / no-response case
    if (!err.response) {
      console.error(
        "Network Error: Unable to connect to the server. Please check if the backend is running."
      )
      return Promise.reject(
        new Error(
          "Unable to connect to the server. Please ensure the backend is running at " +
            api.defaults.baseURL
        )
      )
    }

    const isPublic = PUBLIC_ENDPOINTS.some((u) =>
      originalRequest?.url?.includes(u)
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