import axios from "axios"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  // Cookies (httpOnly accessToken / refreshToken) are forwarded automatically
  withCredentials: true,
})

export default api
