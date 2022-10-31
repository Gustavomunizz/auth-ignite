import { createContext, ReactNode, useEffect, useState } from 'react'
import { api } from '../services/apiClient'
import Router from 'next/router'
import { destroyCookie, parseCookies, setCookie } from 'nookies'

type SignInCredentials = {
  email: string
  password: string
}

type AuthContextData = {
  signIn(credentials: SignInCredentials): Promise<void>
  isAuthenticated: boolean
  user: User | undefined
}

type AuthProviderProps = {
  children: ReactNode
}

type User = {
  email: string
  permissions: string[]
  roles: string[]
}

export const AuthContext = createContext({} as AuthContextData)

export function signOut() {
  destroyCookie(undefined, 'nextauth.token')
  destroyCookie(undefined, 'nextauth.refreshToken')

  Router.push('/')
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>()
  const isAuthenticated = !!user // se estiver vazio vai retornar false, se tiver algo true

  useEffect(() => {
    const { 'nextauth.token': token } = parseCookies()

    if (token) {
      api
        .get('/me')
        .then(response => {
          const { email, permissions, roles } = response.data

          setUser({ email, permissions, roles })
        })
        .catch(() => {
          signOut()
        })
    }
  }, [])

  async function signIn({ email, password }: SignInCredentials) {
    try {
      const response = await api.post('sessions', {
        email,
        password
      })

      const { token, refreshToken, permissions, roles } = response.data

      setCookie(undefined, 'nextauth.token', token, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/' // Quando colocamos '/' quer dizer que qualquer endereço da nossa aplicação vai ter acesso a esse cookie.
      })
      setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      })

      api.defaults.headers['Authorization'] = `Bearer ${token}`

      setUser({
        email,
        permissions,
        roles
      })

      Router.push('/dashboard')
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <AuthContext.Provider value={{ signIn, isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  )
}

// setCookie -> recebe 3 parâmetros,
// 1) Contexto da requisição. eEla não vai existir quando estivermos rodando pelo browser que é o nosso caso, então nós passamos ele como undefined
// 2) Nome do cookie
// 3) O valor do token o token em si
// 4) Tbm temos um 4 parametro, nele nós passamos algumas opções(configs).

// Agr toda vez que o usuário acessar a aplicação pela primeira vez nós devemos carregar o estado user com as informações, nós vamos fazer isso usando o useEffect com ele nós vamos fazer uma requisição a API e buscar os dados do usuário
