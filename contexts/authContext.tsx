import { createContext, ReactNode, useEffect, useState } from 'react'
import { api } from '../services/apiClient'
import Router from 'next/router'
import { destroyCookie, parseCookies, setCookie } from 'nookies'

type SignInCredentials = {
  email: string
  password: string
}

type AuthContextData = {
  signIn: (credentials: SignInCredentials) => Promise<void>
  signOut: () => void
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

let authChannel: BroadcastChannel

export function signOut() {
  destroyCookie(undefined, 'nextauth.token')
  destroyCookie(undefined, 'nextauth.refreshToken')

  authChannel.postMessage('signOut')

  Router.push('/')
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>()
  const isAuthenticated = !!user // se estiver vazio vai retornar false, se tiver algo true

  useEffect(() => {
    authChannel = new BroadcastChannel('auth')

    authChannel.onmessage = message => {
      switch (message.data) {
        case 'signOut':
          Router.push('/')
          break
        default:
          break
      }
    }
  }, [])

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
        path: '/' // Quando colocamos '/' quer dizer que qualquer endere??o da nossa aplica????o vai ter acesso a esse cookie.
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
    <AuthContext.Provider value={{ signIn, signOut, isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  )
}

// setCookie -> recebe 3 par??metros,
// 1) Contexto da requisi????o. eEla n??o vai existir quando estivermos rodando pelo browser que ?? o nosso caso, ent??o n??s passamos ele como undefined
// 2) Nome do cookie
// 3) O valor do token o token em si
// 4) Tbm temos um 4 parametro, nele n??s passamos algumas op????es(configs).

// Agr toda vez que o usu??rio acessar a aplica????o pela primeira vez n??s devemos carregar o estado user com as informa????es, n??s vamos fazer isso usando o useEffect com ele n??s vamos fazer uma requisi????o a API e buscar os dados do usu??rio

// BroadcastChannel -> Ele permite a comunica????o entre abas, guias ou janelas, n??s vamos usar ele para quando a pessoa tiver mais de duas abas da nossa aplica????o aberta no momento que ele fizer logout em uma a outra tbm far??.
