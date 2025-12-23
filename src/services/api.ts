// axiosConfig.ts
// apiService.ts
// api.ts
import axios, { AxiosError } from "axios"
import { refreshTokens } from "./auth"

const api = axios.create({
  baseURL: "http://localhost:5000/api/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

const PUBLIC_ENDPOINTS = ["/auth/login", "/auth/register"]

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken")
    const isPublic = PUBLIC_ENDPOINTS.some((url) => config.url?.includes(url))

    if (token && !isPublic) {
      config.headers.Authorization = `Bearer ${token}`
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
  async (err: AxiosError) => {
    const originalRequest: any = err.config

    if (err.message === "Network Error") {
      console.error("Network Error: Unable to connect to the server. Please check if the backend is running.")
      return Promise.reject(new Error("Unable to connect to the server. Please ensure the backend is running at " + api.defaults.baseURL))
    }

    const isPublic = PUBLIC_ENDPOINTS.some((url) =>
      originalRequest?.url?.includes(url)
    )

    if (err.response?.status === 401 && !isPublic && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem("refreshToken")
        if (!refreshToken) {
          throw new Error("No refresh token available")
        }
        const res = await refreshTokens(refreshToken)
        localStorage.setItem("accessToken", res.accessToken)

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