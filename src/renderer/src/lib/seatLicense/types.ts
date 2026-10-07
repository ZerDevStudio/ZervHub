/**
 * ZenDev Enterprise Desktop SaaS — Server-Side License & Seat Management Types
 * Multi-device seat tracking, cryptographic lease tokens & offline grace periods.
 * Compliance: .agents/rules/zendev-saas-directive.md (Principle 3: Table Stakes SaaS Altyapısı)
 */

export type LicenseTier = 'free' | 'pro' | 'team' | 'enterprise'

export type LicenseServerStatus =
  | 'active'
  | 'expired'
  | 'revoked'
  | 'quota_exceeded'
  | 'grace_period'
  | 'unregistered'

export type DevicePlatform = 'windows' | 'macos' | 'linux' | 'browser'

export interface SeatDevice {
  deviceId: string
  deviceName: string
  platform: DevicePlatform
  ipAddress: string
  activatedAt: number
  lastHeartbeatAt: number
  isCurrentDevice: boolean
  status: 'active' | 'released' | 'revoked'
}

export interface ServerLicenseLease {
  leaseToken: string
  issuedAt: number
  expiresAt: number
  gracePeriodEndsAt: number
  signature: string
}

export interface ServerLicenseData {
  key: string
  tier: LicenseTier
  status: LicenseServerStatus
  organizationName?: string
  customerEmail: string
  maxSeats: number
  allocatedSeats: number
  devices: SeatDevice[]
  expiresAt: number
  activeLease?: ServerLicenseLease
}

export interface SeatRegistrationResult {
  success: boolean
  license?: ServerLicenseData
  errorCode?:
    | 'INVALID_KEY'
    | 'EXPIRED'
    | 'SEAT_QUOTA_EXCEEDED'
    | 'DEVICE_ALREADY_REGISTERED'
    | 'DEVICE_BLOCKED'
    | 'NETWORK_ERROR'
  message?: string
}

export interface SeatReleaseResult {
  success: boolean
  releasedDeviceId: string
  remainingSeats: number
  message?: string
}
