import { useContext, useEffect } from 'react'
import { AuthContext } from '../contexts/authContext'
import { setupAPIClient } from '../services/api'
import { api } from '../services/apiClient'
import { withSSRAuth } from '../utils/withSSRAuth'

export default function Dashboard() {
  const { user } = useContext(AuthContext)

  useEffect(() => {
    api
      .get('/me')
      .then(response => console.log(response.data))
      .catch(err => console.log(err))
  }, [])
  return <h1>Dashboard: {user?.email}</h1>
}

export const getServerSideProps = withSSRAuth(async function name(ctx) {
  try {
    const apiClient = setupAPIClient(ctx)
    const response = await apiClient.get('/me')
    console.log(response.data)
  } catch (error) {
    console.log(error)
  }

  return {
    props: {}
  }
})

// Quando damos um F5 na página o e-mail do usuário não permanece, nós temos alguma forma de manter isso.

// sessionStorage -> Ele não fica disponivel em outras seções, ou seja se fechar o navegador e abrir denovo o sessionStorage não vai ter mais nada, os dados só fica disponivel na hora que estamos na aplicação saimos dela os dados não permanecem mais.

// localStorage -> Os dados se mantem mesmo se fecharmos o navegador, como estamos usando Next.js e ele não é só o lado do cliente a interface, nós tbm usamos o SSR o lado do servidor, e no lado do servidor nós não temos acesso ao localStorage, ele só existe no lado do browser

// Cookies -> Cookies tbm são formas de armazenar informações no browser, essas informações podem ser enviadas ou não, nós podemos escolher entre requisições que acontecem na nossa aplicação, e ele pode ser acessado tanto pelo browser quanto pelo lado do servidor.

// Nós vamos usar uma lib para trabalhar com os cookies que se chama nookies, nós vamos usa-la pq ela tem uma integração melhor com Next.js
