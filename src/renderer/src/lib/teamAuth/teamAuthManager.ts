/**
 * ZenDev Enterprise SaaS — Team Auth & RBAC Manager
 * Role-Based Access Control, Seat Quota & Team Member Management Engine
 * Compliance: .agents/rules/zendev-saas-directive.md (Principle 3)
 */

import {
  TeamRole,
  Permission,
  TeamMember,
  UserSession,
  AuthProvider
} from './types'

const STORAGE_KEYS = {
  SESSION: 'zendev_team_session',
  MEMBERS: 'zendev_team_members'
}

export const ROLE_PERMISSIONS: Record<TeamRole, Permission[]> = {
  owner: [
    'workspace:manage',
    'members:manage',
    'collections:write',
    'collections:read',
    'environments:reveal_secrets',
    'sync:publish'
  ],
  admin: [
    'members:manage',
    'collections:write',
    'collections:read',
    'environments:reveal_secrets',
    'sync:publish'
  ],
  member: [
    'collections:write',
    'collections:read',
    'sync:publish'
  ],
  viewer: [
    'collections:read'
  ]
}

const DEFAULT_SESSION: UserSession = {
  user: {
    id: 'usr_owner_main',
    name: 'Berke (Lead Architect)',
    email: 'berke@zerdev.app',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    provider: 'github'
  },
  token: 'zendev_session_jwt_mock_token_2026',
  isAuthenticated: true,
  organization: {
    id: 'org_zerdev_api',
    name: 'ZerDev Core Engineering Team',
    slug: 'zerdev-core',
    plan: 'team',
    maxSeats: 10
  }
}

const DEFAULT_MEMBERS: TeamMember[] = [
  {
    id: 'usr_owner_main',
    name: 'Berke (Lead Architect)',
    email: 'berke@zerdev.app',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    role: 'owner',
    joinedAt: 1774000000000,
    status: 'active'
  },
  {
    id: 'usr_admin_sarah',
    name: 'Sarah Jenkins',
    email: 'sarah.j@zerdev.app',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
    role: 'admin',
    joinedAt: 1774100000000,
    status: 'active'
  },
  {
    id: 'usr_member_alex',
    name: 'Alex Rivera',
    email: 'alex.r@zerdev.app',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    role: 'member',
    joinedAt: 1774200000000,
    status: 'active'
  },
  {
    id: 'usr_viewer_elena',
    name: 'Elena Rostova (Security Auditor)',
    email: 'elena.audit@zerdev.app',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces',
    role: 'viewer',
    joinedAt: 1774300000000,
    status: 'active'
  }
]

class TeamAuthManager {
  public hasPermission(role: TeamRole, permission: Permission): boolean {
    const list = ROLE_PERMISSIONS[role] || []
    return list.includes(permission)
  }

  public getSession(): UserSession {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SESSION)
      if (raw) return JSON.parse(raw)
    } catch {}
    this.saveSession(DEFAULT_SESSION)
    return DEFAULT_SESSION
  }

  public saveSession(session: UserSession): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session))
      this.broadcast('zendev:team-session-updated', { session })
    } catch {}
  }

  public getCurrentUserRole(): TeamRole {
    const session = this.getSession()
    const members = this.getMembers()
    const found = members.find((m) => m.id === session.user.id || m.email === session.user.email)
    return found ? found.role : 'owner'
  }

  public getMembers(): TeamMember[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    this.saveMembers(DEFAULT_MEMBERS)
    return DEFAULT_MEMBERS
  }

  public saveMembers(members: TeamMember[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members))
      this.broadcast('zendev:team-members-updated', { members })
    } catch {}
  }

  public inviteMember(email: string, role: TeamRole, name?: string): TeamMember {
    const currentRole = this.getCurrentUserRole()
    if (!this.hasPermission(currentRole, 'members:manage')) {
      throw new Error('Üye davet etmek için Yönetici (Admin veya Owner) yetkisi gereklidir.')
    }

    const members = this.getMembers()
    const session = this.getSession()

    const cleanEmail = email.trim().toLowerCase()
    const existing = members.find((m) => m.email.toLowerCase() === cleanEmail)
    if (existing) {
      throw new Error('Bu e-posta adresi zaten takımda kayıtlı.')
    }

    if (members.length >= session.organization.maxSeats) {
      throw new Error(`Koltuk limiti aşıldı! Maksimum ${session.organization.maxSeats} üye ekleyebilirsiniz. Lütfen planınızı yükseltin.`)
    }

    const derivedName = name?.trim() || cleanEmail.split('@')[0]
    const newMember: TeamMember = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: derivedName,
      email: cleanEmail,
      role,
      joinedAt: Date.now(),
      status: 'invited'
    }

    const updated = [...members, newMember]
    this.saveMembers(updated)
    return newMember
  }

  public updateMemberRole(memberId: string, newRole: TeamRole): void {
    const currentRole = this.getCurrentUserRole()
    if (!this.hasPermission(currentRole, 'members:manage')) {
      throw new Error('Rol değiştirmek için Yönetici yetkisi gereklidir.')
    }

    const members = this.getMembers()
    const target = members.find((m) => m.id === memberId)
    if (!target) throw new Error('Üye bulunamadı.')

    if (target.role === 'owner' && newRole !== 'owner') {
      throw new Error('Takım Sahibinin (Owner) rolü düşürülemez. Önce sahipliği devredin.')
    }

    const updated = members.map((m) => {
      if (m.id === memberId) {
        return { ...m, role: newRole }
      }
      return m
    })

    this.saveMembers(updated)
  }

  public removeMember(memberId: string): void {
    const currentRole = this.getCurrentUserRole()
    if (!this.hasPermission(currentRole, 'members:manage')) {
      throw new Error('Üye çıkarmak için Yönetici yetkisi gereklidir.')
    }

    const members = this.getMembers()
    const target = members.find((m) => m.id === memberId)
    if (!target) throw new Error('Üye bulunamadı.')

    if (target.role === 'owner') {
      throw new Error('Takım Sahibi (Owner) takımdan çıkarılamaz.')
    }

    const updated = members.filter((m) => m.id !== memberId)
    this.saveMembers(updated)
  }

  public login(provider: AuthProvider, email?: string, name?: string): UserSession {
    const current = this.getSession()
    const cleanEmail = email || (provider === 'github' ? 'dev.architect@github.com' : 'dev@google.com')
    const cleanName = name || (provider === 'github' ? 'GitHub Architect' : 'Google Cloud Developer')

    const newSession: UserSession = {
      ...current,
      user: {
        id: `usr_${provider}_${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        provider
      },
      isAuthenticated: true
    }

    this.saveSession(newSession)
    return newSession
  }

  public logout(): void {
    const session = this.getSession()
    session.isAuthenticated = false
    this.saveSession(session)
  }

  private broadcast(eventName: string, detail: any) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventName, { detail }))
    }
  }
}

export const teamAuthManager = new TeamAuthManager()
