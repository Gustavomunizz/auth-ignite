import { useContext } from 'react'
import { AuthContext } from '../contexts/authContext'
import { validateUserPermissions } from '../utils/validateUserPermissions'

type useCanParams = {
  permissions?: string[]
  roles?: string[]
}

export function useCan({ permissions, roles }: useCanParams) {
  const { user, isAuthenticated } = useContext(AuthContext)

  if (!isAuthenticated) {
    return false
  }

  const userHasValidPermissions = validateUserPermissions({ user, permissions, roles })

  return userHasValidPermissions
}

// Hook de permissões, faz a verificação da permissão e vai 'dizer' o que o usuário pode ou não pode
