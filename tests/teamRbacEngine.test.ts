/**
 * ZenDev Enterprise SaaS — Team Auth & RBAC Engine Test Suite
 * Validates Role-Based Access Control, Permission Matrix, Quota Enforcement & Owner Safeguards
 * Compliance: .agents/rules/zendev-saas-directive.md (Principle 3: Team Auth & RBAC)
 */

import { describe, it, expect, beforeEach } from 'vitest'

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer'

export type Permission =
  | 'workspace:manage'
  | 'members:manage'
  | 'collections:write'
  | 'collections:read'
  | 'environments:reveal_secrets'
  | 'sync:publish'

export interface TeamMember {
  id: string
  name: string
  email: string
  role: TeamRole
  joinedAt: number
  status: 'active' | 'invited' | 'suspended'
}

export interface UserSession {
  user: {
    id: string
    name: string
    email: string
    provider: string
  }
  isAuthenticated: boolean
  organization: {
    id: string
    name: string
    maxSeats: number
  }
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

export class MockTeamAuthManager {
  private members: TeamMember[] = []
  private session: UserSession

  constructor() {
    this.session = {
      user: {
        id: 'usr_owner_1',
        name: 'Berke (Lead Architect)',
        email: 'berke@zerdev.app',
        provider: 'github'
      },
      isAuthenticated: true,
      organization: {
        id: 'org_zerdev_1',
        name: 'ZerDev Core',
        maxSeats: 5
      }
    }

    this.members = [
      {
        id: 'usr_owner_1',
        name: 'Berke',
        email: 'berke@zerdev.app',
        role: 'owner',
        joinedAt: Date.now(),
        status: 'active'
      },
      {
        id: 'usr_admin_1',
        name: 'Sarah',
        email: 'sarah@zerdev.app',
        role: 'admin',
        joinedAt: Date.now(),
        status: 'active'
      },
      {
        id: 'usr_member_1',
        name: 'Alex',
        email: 'alex@zerdev.app',
        role: 'member',
        joinedAt: Date.now(),
        status: 'active'
      },
      {
        id: 'usr_viewer_1',
        name: 'Elena',
        email: 'elena@zerdev.app',
        role: 'viewer',
        joinedAt: Date.now(),
        status: 'active'
      }
    ]
  }

  public hasPermission(role: TeamRole, perm: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(perm) ?? false
  }

  public getMembers(): TeamMember[] {
    return [...this.members]
  }

  public getSession(): UserSession {
    return { ...this.session }
  }

  public inviteMember(callerRole: TeamRole, email: string, role: TeamRole, name?: string): TeamMember {
    if (!this.hasPermission(callerRole, 'members:manage')) {
      throw new Error('Unauthorized: members:manage permission required')
    }

    const cleanEmail = email.trim().toLowerCase()
    if (this.members.some((m) => m.email.toLowerCase() === cleanEmail)) {
      throw new Error('Duplicate Member: Email already exists in organization')
    }

    if (this.members.length >= this.session.organization.maxSeats) {
      throw new Error('Quota Exceeded: Organization max seats reached')
    }

    const newMember: TeamMember = {
      id: `usr_${Date.now()}`,
      name: name || cleanEmail.split('@')[0],
      email: cleanEmail,
      role,
      joinedAt: Date.now(),
      status: 'invited'
    }

    this.members.push(newMember)
    return newMember
  }

  public updateRole(callerRole: TeamRole, memberId: string, newRole: TeamRole): void {
    if (!this.hasPermission(callerRole, 'members:manage')) {
      throw new Error('Unauthorized: members:manage permission required')
    }

    const target = this.members.find((m) => m.id === memberId)
    if (!target) throw new Error('Member not found')

    if (target.role === 'owner' && newRole !== 'owner') {
      throw new Error('Protected: Owner role cannot be demoted')
    }

    target.role = newRole
  }

  public removeMember(callerRole: TeamRole, memberId: string): void {
    if (!this.hasPermission(callerRole, 'members:manage')) {
      throw new Error('Unauthorized: members:manage permission required')
    }

    const target = this.members.find((m) => m.id === memberId)
    if (!target) throw new Error('Member not found')

    if (target.role === 'owner') {
      throw new Error('Protected: Owner cannot be removed from workspace')
    }

    this.members = this.members.filter((m) => m.id !== memberId)
  }
}

describe('ZenDev Team Auth & RBAC Engine', () => {
  let manager: MockTeamAuthManager

  beforeEach(() => {
    manager = new MockTeamAuthManager()
  })

  describe('1. Role & Permission Matrix Verification', () => {
    it('grants Owner all 6 enterprise permissions including workspace:manage', () => {
      expect(manager.hasPermission('owner', 'workspace:manage')).toBe(true)
      expect(manager.hasPermission('owner', 'members:manage')).toBe(true)
      expect(manager.hasPermission('owner', 'collections:write')).toBe(true)
      expect(manager.hasPermission('owner', 'collections:read')).toBe(true)
      expect(manager.hasPermission('owner', 'environments:reveal_secrets')).toBe(true)
      expect(manager.hasPermission('owner', 'sync:publish')).toBe(true)
    })

    it('grants Admin 5 permissions but restricts workspace:manage', () => {
      expect(manager.hasPermission('admin', 'workspace:manage')).toBe(false)
      expect(manager.hasPermission('admin', 'members:manage')).toBe(true)
      expect(manager.hasPermission('admin', 'environments:reveal_secrets')).toBe(true)
      expect(manager.hasPermission('admin', 'collections:write')).toBe(true)
    })

    it('restricts Member from member management and secret revelation', () => {
      expect(manager.hasPermission('member', 'members:manage')).toBe(false)
      expect(manager.hasPermission('member', 'environments:reveal_secrets')).toBe(false)
      expect(manager.hasPermission('member', 'collections:write')).toBe(true)
      expect(manager.hasPermission('member', 'sync:publish')).toBe(true)
    })

    it('restricts Viewer to read-only access (collections:read only)', () => {
      expect(manager.hasPermission('viewer', 'collections:read')).toBe(true)
      expect(manager.hasPermission('viewer', 'collections:write')).toBe(false)
      expect(manager.hasPermission('viewer', 'sync:publish')).toBe(false)
      expect(manager.hasPermission('viewer', 'environments:reveal_secrets')).toBe(false)
      expect(manager.hasPermission('viewer', 'members:manage')).toBe(false)
    })
  })

  describe('2. Seat Quota & Member Lifecycle Safeguards', () => {
    it('allows Admin to invite a new member within seat quota', () => {
      const initialCount = manager.getMembers().length
      const invited = manager.inviteMember('admin', 'dev@zerdev.app', 'member', 'New Dev')
      expect(invited.email).toBe('dev@zerdev.app')
      expect(invited.role).toBe('member')
      expect(manager.getMembers().length).toBe(initialCount + 1)
    })

    it('blocks Member or Viewer from inviting others', () => {
      expect(() => {
        manager.inviteMember('member', 'hacker@zerdev.app', 'member')
      }).toThrow('Unauthorized')

      expect(() => {
        manager.inviteMember('viewer', 'auditor@zerdev.app', 'viewer')
      }).toThrow('Unauthorized')
    })

    it('enforces maximum organization seat quota', () => {
      // 4 members exist, maxSeats is 5 -> 1 more allowed, 2nd will fail
      manager.inviteMember('owner', 'seat5@zerdev.app', 'member')
      expect(manager.getMembers().length).toBe(5)

      expect(() => {
        manager.inviteMember('owner', 'seat6_overflow@zerdev.app', 'member')
      }).toThrow('Quota Exceeded')
    })

    it('prevents inviting duplicate email addresses', () => {
      expect(() => {
        manager.inviteMember('owner', 'alex@zerdev.app', 'admin')
      }).toThrow('Duplicate Member')
    })
  })

  describe('3. Owner & Role Protection Safeguards', () => {
    it('prevents demoting workspace Owner role', () => {
      expect(() => {
        manager.updateRole('admin', 'usr_owner_1', 'viewer')
      }).toThrow('Protected')
    })

    it('prevents removing workspace Owner from organization', () => {
      expect(() => {
        manager.removeMember('admin', 'usr_owner_1')
      }).toThrow('Protected')
    })

    it('allows updating role of non-owner members and removing members', () => {
      manager.updateRole('owner', 'usr_viewer_1', 'admin')
      const updated = manager.getMembers().find((m) => m.id === 'usr_viewer_1')
      expect(updated?.role).toBe('admin')

      manager.removeMember('owner', 'usr_member_1')
      expect(manager.getMembers().some((m) => m.id === 'usr_member_1')).toBe(false)
    })
  })
})
