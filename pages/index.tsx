import { FormEvent, useContext, useState } from 'react'
import { AuthContext } from '../contexts/authContext'
import styles from '../styles/Home.module.css'
import { withSSRGuest } from '../utils/withSSRGuest'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const { signIn } = useContext(AuthContext)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const data = {
      email,
      password
    }
    await signIn(data)
  }

  return (
    <form onSubmit={handleSubmit} className={styles.container}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        autoComplete="on"
        placeholder="digite seu e-mail"
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        autoComplete="on"
        placeholder="digite sua senha"
      />
      <button type="submit">Entrar</button>
    </form>
  )
}

export const getServerSideProps = withSSRGuest(async ctx => {
  return {
    props: {}
  }
})
