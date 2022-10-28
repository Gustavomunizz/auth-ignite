import axios from 'axios'
import { parseCookies } from 'nookies'

const cookies = parseCookies()

export const api = axios.create({
  baseURL: 'http://localhost:3333',
  headers: {
    Authorization: `Bearer ${cookies['nextauth.token']}`
  }
})

// credencias validas: diego@rocketseat.team, 123456

// headers -> com isso nós estamos passando este token para todas as requisições, isso vai mostrar que nós estamos logado. Só que está dando um 401 dizendo que o cookie está expira, isso aconteceu porque ele inspira em 5s então vamos na API aumentar para 60s
