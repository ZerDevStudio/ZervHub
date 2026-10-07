import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  TeamRole,
  Permission,
  TeamMember,
  UserSession,
  AuthProvider
} from './types'
import { teamAuthManager } from './teamAuthManager'

interface TeamAuthContextValue {
  session: UserSession
  members: TeamMember[]
  currentRole: TeamRole
  hasPermission: (permission: Permission) => boolean
  inviteMember: (email: string, role: TeamRole, name?: string) => TeamMember
  updateMemberRole: (memberId: string, role: TeamRole) => void
  removeMember: (memberId: string) => void
  login: (provider: AuthProvider, email?: string, name?: string) => void
  logout: () => void
}

const TeamAuthContext = createContext<TeamAuthContextValue | null>(null)

export const TeamAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession>(() => teamAuthManager.getSession())
  const [members, setMembers] = useState<TeamMember[]>(() => teamAuthManager.getMembers())
  const [currentRole, setCurrentRole] = useState<TeamRole>(() => teamAuthManager.getCurrentUserRole())

  const refreshState = useCallback(() => {
    setSession(teamAuthManager.getSession())
    setMembers(teamAuthManager.getMembers())
    setCurrentRole(teamAuthManager.getCurrentUserRole())
  }, [])

  useEffect(() => {
    const handleSessionUpdated = () => refreshState()
    const handleMembersUpdated = () => refreshState()

    window.addEventListener('zendev:team-session-updated', handleSessionUpdated)
    window.addEventListener('zendev:team-members-updated', handleMembersUpdated)

    return () => {
      window.removeEventListener('zendev:team-session-updated', handleSessionUpdated)
      window.removeEventListener('zendev:team-members-updated', handleMembersUpdated)
    }
  }, [refreshState])

  const hasPermission = (permission: Permission): boolean => {
    return teamAuthManager.hasPermission(currentRole, permission)
  }

  const inviteMember = (email: string, role: TeamRole, name?: string): TeamMember => {
    const res = teamAuthManager.inviteMember(email, role, name)
    refreshState()
    return res
  }

  const updateMemberRole = (memberId: string, role: TeamRole): void => {
    teamAuthManager.updateMemberRole(memberId, role)
    refreshState()
  }

  const removeMember = (memberId: string): void => {
    teamAuthManager.removeMember(memberId)
    refreshState()
  }

  const login = (provider: AuthProvider, email?: string, name?: string): void => {
    teamAuthManager.login(provider, email, name)
    refreshState()
  }

  const logout = (): void => {
    teamAuthManager.logout()
    refreshState()
  }

  return (
    <TeamAuthContext.Provider
      value={{
        session,
        members,
        currentRole,
        hasPermission,
        inviteMember,
        updateMemberRole,
        removeMember,
        login,
        logout
      }}
    >
      {children}
    </TeamAuthContext.Provider>
  )
}

export function useTeamAuth(): TeamAuthContextValue {
  const ctx = useContext(TeamAuthContext)
  if (!ctx) {
    throw new Error('useTeamAuth must be used within a TeamAuthProvider')
  }
  return ctx
}
