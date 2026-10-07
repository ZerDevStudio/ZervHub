/**
 * ZenDev Enterprise SaaS — Team Auth & Role-Based Access Control (RBAC)
 * Compliance: .agents/rules/zendev-saas-directive.md (Principle 3: Team Auth & RBAC)
 */

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer'

export type Permission =
  | 'workspace:manage'           // Delete/rename workspace, change billing
  | 'members:manage'             // Invite, remove, or change roles of members
  | 'collections:write'          // Create, edit, and delete API collections & requests
  | 'collections:read'           // View and test requests
  | 'environments:reveal_secrets'// Reveal sensitive tokens and passwords
  | 'sync:publish'               // Publish local changes to team cloud vault

export interface TeamMember {
  id: string
  name: string
  email: string
  avatarUrl?: string
  role: TeamRole
  joinedAt: number
  status: 'active' | 'invited' | 'suspended'
}

export type AuthProvider = 'github' | 'google' | 'sso_okta' | 'local'

export interface UserSession {
  user: {
    id: string
    name: string
    email: string
    avatarUrl?: string
    provider: AuthProvider
  }
  token: string
  isAuthenticated: boolean
  organization: {
    id: string
    name: string
    slug: string
    plan: 'team' | 'enterprise'
    maxSeats: number
  }
}
