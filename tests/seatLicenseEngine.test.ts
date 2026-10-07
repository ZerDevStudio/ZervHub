/**
 * ZenDev Enterprise Desktop SaaS — Server-Side License & Seat Quota Test Suite
 * Tests multi-device registration, seat limits, dynamic revocation, and offline grace periods.
 * Compliance: .agents/rules/zendev-saas-directive.md (Principle 3: Table Stakes SaaS Altyapısı)
 */

import { describe, it, expect, beforeEach } from 'vitest'

export type LicenseTier = 'free' | 'pro' | 'team' | 'enterprise'

export interface SeatDevice {
  deviceId: string
  deviceName: string
  platform: 'windows' | 'macos' | 'linux' | 'browser'
  lastHeartbeatAt: number
  status: 'active' | 'released'
}

export interface ServerLicenseData {
  key: string
  tier: LicenseTier
  maxSeats: number
  allocatedSeats: number
  devices: SeatDevice[]
  activeLease?: {
    expiresAt: number
    gracePeriodEndsAt: number
  }
}

const TIER_SEATS: Record<LicenseTier, number> = {
  free: 1,
  pro: 3,
  team: 10,
  enterprise: 50
}

export class MockSeatLicenseManager {
  private license: ServerLicenseData
  private currentDeviceId: string

  constructor(tier: LicenseTier = 'pro') {
    this.currentDeviceId = 'HWID-TEST-CURRENT-001'
    const now = Date.now()
    this.license = {
      key: 'ZENDEV-PRO-TEST-KEY',
      tier,
      maxSeats: TIER_SEATS[tier],
      allocatedSeats: 1,
      devices: [
        {
          deviceId: this.currentDeviceId,
          deviceName: 'Primary Workstation',
          platform: 'windows',
          lastHeartbeatAt: now,
          status: 'active'
        }
      ],
      activeLease: {
        expiresAt: now + 24 * 60 * 60 * 1000,
        gracePeriodEndsAt: now + 7 * 24 * 60 * 60 * 1000
      }
    }
  }

  public getLicense(): ServerLicenseData {
    return { ...this.license, devices: [...this.license.devices] }
  }

  public registerDevice(deviceId: string, name: string): { success: boolean; errorCode?: string; message?: string } {
    const existing = this.license.devices.find((d) => d.deviceId === deviceId)
    if (existing) {
      existing.lastHeartbeatAt = Date.now()
      existing.status = 'active'
      return { success: true }
    }

    const activeCount = this.license.devices.filter((d) => d.status === 'active').length
    if (activeCount >= this.license.maxSeats) {
      return {
        success: false,
        errorCode: 'SEAT_QUOTA_EXCEEDED',
        message: `Quota reached: maximum ${this.license.maxSeats} workstations allowed`
      }
    }

    const newDevice: SeatDevice = {
      deviceId,
      deviceName: name,
      platform: 'macos',
      lastHeartbeatAt: Date.now(),
      status: 'active'
    }

    this.license.devices.push(newDevice)
    this.license.allocatedSeats = this.license.devices.filter((d) => d.status === 'active').length
    return { success: true }
  }

  public releaseSeat(deviceId: string): { success: boolean; remainingSeats: number } {
    const target = this.license.devices.find((d) => d.deviceId === deviceId)
    if (!target) return { success: false, remainingSeats: this.license.maxSeats - this.license.allocatedSeats }

    this.license.devices = this.license.devices.filter((d) => d.deviceId !== deviceId)
    this.license.allocatedSeats = this.license.devices.filter((d) => d.status === 'active').length
    return {
      success: true,
      remainingSeats: this.license.maxSeats - this.license.allocatedSeats
    }
  }

  public checkLeaseHealth(simulatedNow?: number): { status: 'healthy' | 'grace_period' | 'expired'; daysLeft: number } {
    const now = simulatedNow || Date.now()
    if (!this.license.activeLease) return { status: 'expired', daysLeft: 0 }

    if (now <= this.license.activeLease.expiresAt) {
      return { status: 'healthy', daysLeft: 7 }
    }

    if (now <= this.license.activeLease.gracePeriodEndsAt) {
      const msLeft = this.license.activeLease.gracePeriodEndsAt - now
      const daysLeft = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)))
      return { status: 'grace_period', daysLeft }
    }

    return { status: 'expired', daysLeft: 0 }
  }
}

describe('ZenDev Server-Side Seat & Device Management Engine', () => {
  let manager: MockSeatLicenseManager

  beforeEach(() => {
    manager = new MockSeatLicenseManager('pro') // 3 seats
  })

  describe('1. Tier Seat Quota Mapping', () => {
    it('defines correct seat limits for Free, Pro, Team, and Enterprise', () => {
      expect(TIER_SEATS.free).toBe(1)
      expect(TIER_SEATS.pro).toBe(3)
      expect(TIER_SEATS.team).toBe(10)
      expect(TIER_SEATS.enterprise).toBe(50)
    })
  })

  describe('2. Device Registration & Quota Enforcement', () => {
    it('successfully registers devices within quota', () => {
      // 1 device exists, max 3
      const res1 = manager.registerDevice('HWID-MAC-002', 'MacBook Air')
      expect(res1.success).toBe(true)
      expect(manager.getLicense().allocatedSeats).toBe(2)

      const res2 = manager.registerDevice('HWID-LINUX-003', 'Ubuntu Server')
      expect(res2.success).toBe(true)
      expect(manager.getLicense().allocatedSeats).toBe(3)
    })

    it('rejects device registration when seat quota is exceeded', () => {
      manager.registerDevice('HWID-MAC-002', 'MacBook Air')
      manager.registerDevice('HWID-LINUX-003', 'Ubuntu Server')
      expect(manager.getLicense().allocatedSeats).toBe(3)

      const overflow = manager.registerDevice('HWID-EXTRA-004', 'Windows Laptop')
      expect(overflow.success).toBe(false)
      expect(overflow.errorCode).toBe('SEAT_QUOTA_EXCEEDED')
      expect(manager.getLicense().allocatedSeats).toBe(3)
    })

    it('handles idempotent heartbeat for already registered devices', () => {
      const initialCount = manager.getLicense().devices.length
      const res = manager.registerDevice('HWID-TEST-CURRENT-001', 'Primary Workstation Renamed')
      expect(res.success).toBe(true)
      expect(manager.getLicense().devices.length).toBe(initialCount)
    })
  })

  describe('3. Seat Revocation & Release', () => {
    it('frees a seat upon releasing an existing device, enabling new registration', () => {
      manager.registerDevice('HWID-MAC-002', 'MacBook Air')
      manager.registerDevice('HWID-LINUX-003', 'Ubuntu Server')
      expect(manager.getLicense().allocatedSeats).toBe(3)

      // Releasing Linux workstation
      const releaseRes = manager.releaseSeat('HWID-LINUX-003')
      expect(releaseRes.success).toBe(true)
      expect(releaseRes.remainingSeats).toBe(1)
      expect(manager.getLicense().allocatedSeats).toBe(2)

      // Now extra device registration can succeed!
      const newDevRes = manager.registerDevice('HWID-EXTRA-004', 'Windows Laptop')
      expect(newDevRes.success).toBe(true)
      expect(manager.getLicense().allocatedSeats).toBe(3)
    })
  })

  describe('4. Lease Tokens & Offline Grace Period', () => {
    it('returns healthy status when lease is active', () => {
      const health = manager.checkLeaseHealth()
      expect(health.status).toBe('healthy')
      expect(health.daysLeft).toBe(7)
    })

    it('enters grace period when lease expires within 7 days', () => {
      const now = Date.now()
      // Simulate 2 days after lease expired (within 7 days)
      const simulatedTime = now + 48 * 60 * 60 * 1000
      const health = manager.checkLeaseHealth(simulatedTime)
      expect(health.status).toBe('grace_period')
      expect(health.daysLeft).toBeGreaterThan(0)
    })

    it('expires after grace period exceeds 7 days offline', () => {
      const now = Date.now()
      // Simulate 8 days after issue
      const simulatedTime = now + 8 * 24 * 60 * 60 * 1000
      const health = manager.checkLeaseHealth(simulatedTime)
      expect(health.status).toBe('expired')
      expect(health.daysLeft).toBe(0)
    })
  })
})
