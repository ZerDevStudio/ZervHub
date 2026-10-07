/**
 * ZenDev Enterprise Desktop SaaS — Seat License Context
 * React hook and provider for server-side dynamic seat tracking, active devices, and grace periods.
 * Compliance: .agents/rules/zendev-saas-directive.md (Principle 3: Table Stakes SaaS Altyapısı)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  ServerLicenseData,
  SeatDevice,
  SeatRegistrationResult,
  SeatReleaseResult
} from './types'
import { seatLicenseManager } from './seatLicenseManager'

interface SeatLicenseContextValue {
  license: ServerLicenseData
  devices: SeatDevice[]
  currentDeviceId: string
  currentDeviceName: string
  leaseHealth: { status: 'healthy' | 'grace_period' | 'expired'; daysLeft: number }
  registerDevice: (key?: string, name?: string) => SeatRegistrationResult
  releaseSeat: (deviceId: string) => SeatReleaseResult
  setDeviceName: (name: string) => void
  refresh: () => void
}

const SeatLicenseContext = createContext<SeatLicenseContextValue | undefined>(undefined)

export const SeatLicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [license, setLicense] = useState<ServerLicenseData>(() => seatLicenseManager.getLicenseData())
  const [leaseHealth, setLeaseHealth] = useState(() => seatLicenseManager.checkLeaseHealth())

  const syncState = useCallback(() => {
    setLicense(seatLicenseManager.getLicenseData())
    setLeaseHealth(seatLicenseManager.checkLeaseHealth())
  }, [])

  useEffect(() => {
    syncState()

    const handleUpdate = () => syncState()
    window.addEventListener('zendev:seat-license-updated', handleUpdate)

    // Periodic heartbeat every 5 minutes
    const interval = setInterval(() => {
      setLeaseHealth(seatLicenseManager.checkLeaseHealth())
    }, 5 * 60 * 1000)

    return () => {
      window.removeEventListener('zendev:seat-license-updated', handleUpdate)
      clearInterval(interval)
    }
  }, [syncState])

  const registerDevice = useCallback(
    (key?: string, name?: string): SeatRegistrationResult => {
      const res = seatLicenseManager.registerCurrentDevice(key, name)
      syncState()
      return res
    },
    [syncState]
  )

  const releaseSeat = useCallback(
    (deviceId: string): SeatReleaseResult => {
      const res = seatLicenseManager.releaseSeat(deviceId)
      syncState()
      return res
    },
    [syncState]
  )

  const setDeviceName = useCallback(
    (name: string) => {
      seatLicenseManager.setDeviceName(name)
      syncState()
    },
    [syncState]
  )

  const value: SeatLicenseContextValue = {
    license,
    devices: license.devices,
    currentDeviceId: seatLicenseManager.getDeviceId(),
    currentDeviceName: seatLicenseManager.getDeviceName(),
    leaseHealth,
    registerDevice,
    releaseSeat,
    setDeviceName,
    refresh: syncState
  }

  return (
    <SeatLicenseContext.Provider value={value}>
      {children}
    </SeatLicenseContext.Provider>
  )
}

export function useSeatLicense(): SeatLicenseContextValue {
  const context = useContext(SeatLicenseContext)
  if (!context) {
    throw new Error('useSeatLicense must be used within a SeatLicenseProvider')
  }
  return context
}
