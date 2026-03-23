'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import api from '@/lib/api'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const tokenValue = Cookies.get('token')
    const userData = Cookies.get('user')
    setToken(tokenValue || null)
    if (tokenValue && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error('Error parsing user data:', error)
        logout()
      }
    }
    setLoading(false)
  }

  const login = async (username, password) => {
    try {
      const response = await api.post(`${process.env.NEXT_PUBLIC_API_USER_SERVICE}/api/users/login`, {
        username,
        password
      })

      const { token: loginToken, user: userData } = response.data
      // Store in cookies
      Cookies.set('token', loginToken, { expires: 7 })
      Cookies.set('user', JSON.stringify(userData), { expires: 7 })
      setUser(userData)
      setToken(loginToken)
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.post(`${process.env.NEXT_PUBLIC_API_USER_SERVICE}/api/users/register`, userData)
      const { token: regToken, user: newUser } = response.data
      // Store in cookies
      Cookies.set('token', regToken, { expires: 7 })
      Cookies.set('user', JSON.stringify(newUser), { expires: 7 })
      setUser(newUser)
      setToken(regToken)
      return { success: true }
    } catch (error) {
      console.error('Registration error:', error)
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      }
    }
  }

  const logout = () => {
    Cookies.remove('token')
    Cookies.remove('user')
    setUser(null)
    setToken(null)
    router.push('/login')
  }

  const updateUser = (updatedData) => {
    const merged = { ...user, ...updatedData }
    setUser(merged)
    Cookies.set('user', JSON.stringify(merged), { expires: 7 })
  }

  return (
    <AuthContext.Provider value={{ user, loading, token, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
