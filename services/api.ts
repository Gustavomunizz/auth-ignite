import axios, { AxiosError } from 'axios'
import { parseCookies, setCookie } from 'nookies'
import { signOut } from '../contexts/authContext'
import { AuthTokenError } from './errors/AuthTokenError'

interface AxiosErrorResponse {
  code?: string
}

let isRefreshing = false
let failedRequestQueue = []

export function setupAPIClient(ctx = undefined) {
  let cookies = parseCookies(ctx)

  const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
      Authorization: `Bearer ${cookies['nextauth.token']}`
    }
  })

  api.interceptors.response.use(
    response => {
      return response
    },
    (error: AxiosError<AxiosErrorResponse>) => {
      if (error.response?.status === 401) {
        if (error.response.data?.code === 'token.expired') {
          cookies = parseCookies(ctx)

          const { 'nextauth.refreshToken': refreshToken } = cookies
          const originalConfig = error.config

          if (!isRefreshing) {
            isRefreshing = true // isso vai impedir que aconteca um refresh de token para cada requisição requisição chamada, e sim aconteça o refresh do Token uma unica vez.

            api
              .post('/refresh', {
                refreshToken
              })
              .then(response => {
                const { token } = response.data

                setCookie(ctx, 'nextauth.token', token, {
                  maxAge: 60 * 60 * 24 * 30, // 30 days
                  path: '/' // Quando colocamos '/' quer dizer que qualquer endereço da nossa aplicação vai ter acesso a esse cookie.
                })
                setCookie(ctx, 'nextauth.refreshToken', response.data.refreshToken, {
                  maxAge: 60 * 60 * 24 * 30, // 30 days
                  path: '/'
                })

                api.defaults.headers['Authorization'] = `Bearer ${token}`

                failedRequestQueue.forEach(request => request.onSuccess(token))
                failedRequestQueue = []
              })
              .catch(err => {
                failedRequestQueue.forEach(request => request.onFailure(err))
                failedRequestQueue = []
                if (process.browser) {
                  signOut()
                } else {
                  return Promise.reject(err)
                }
              })
              .finally(() => {
                isRefreshing = false
              })
          }

          return new Promise((resolve, reject) => {
            failedRequestQueue.push({
              onSuccess: (token: string) => {
                if (!originalConfig?.headers) {
                  return
                }

                originalConfig.headers['Authorization'] = `Bearer ${token}`

                resolve(api(originalConfig)) //
              },
              onFailure: (err: AxiosError) => {
                reject(err)
              }
            })
          })
        } else {
          if (process.browser) {
            signOut()
          } else {
            return Promise.reject(new AuthTokenError())
          }
        }
      }
      return Promise.reject(error)
    }
  )
  return api
}

// credencias validas: diego@rocketseat.team, 123456

// headers -> com isso nós estamos passando este token para todas as requisições, isso vai mostrar que nós estamos logado. Só que está dando um 401 dizendo que o cookie está expira, isso aconteceu porque ele inspira em 5s então vamos na API aumentar para 60s

// interceptors -> como o nome diz nós podemos interceptar  request e response
// request -> ele vai interceptar antes de alguma requisição ser feita ao back-end
// response -> significa que eu quero fazer algum tipo de funcionalidade depois de eu receber uma resposta do back-end

// use -> recebe duas funções como parâmetro
// 1) -> O que fazer quando a resposta der sucesso
// 2) -> O que fazer quando der errado

// Lógica para fazer o refresh token, nós atualizamos o cookie com parseCookies() pegamos o refreshToken de dentro de cookies e fazer uma chamada para rota '/refresh' da nossa API passando o refreshToken depois pegamos a resposta e token que está dentro dela e configuramos o cookie novamente com setCookie() passando o token e o novo refresh token.

// Obs: A estrátegia de atualizar os cookies funcionaram, mas tivemos 2 problemas
// 1) O token foi atualizado, mas as requisições que ja tinham sido feitas antes elas foram feitas com o token antigo e acabou dando erro
// 2) Nós tinhamos 2 requisições acontecendo ao mesmo tempo na rota '/me', uma acontecendo no authContent e outra no dashboard, então ele tentou 2 vezes fazer o refresh token, a primeiro deu certo a segunda deu errado, as duas deveriam usar da mesma atualização do token

// Então o que vamos fazer é uma fila de requisições no Axios, quando o interceptor detectar que o token está expirado ele vai automaticamente pausar todas as requisições até o token está realmente atualizado e depois ele vai pegar todas aquelas requisições que não foram feitas porque o token não estava atualizado e vai executar ela dnv com o token atualizado
// Resumo: a fila vai armazenar todas as requisições feitas ao back enquanto o token está tendo o refresh, e quando o refresh terminar vamos refazer as requisições com as novas infos do token.

// error.config -> Neste config tem todas as informações necessárias para repetirmos uma requisição ao back-end, ele basicamente é a config das requisições
