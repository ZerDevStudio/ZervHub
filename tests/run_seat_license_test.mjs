// Minimal test runner harness for Server-Side Seat & Device Management Engine
let currentSuite = '';
let currentTest = '';
let passed = 0;
let failed = 0;

globalThis.describe = (name, fn) => {
  const prev = currentSuite;
  currentSuite = prev ? `${prev} > ${name}` : name;
  console.log(`\n--- ${currentSuite} ---`);
  fn();
  currentSuite = prev;
};

globalThis.it = (name, fn) => {
  currentTest = name;
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
    failed++;
  }
};

globalThis.expect = (actual) => ({
  toBe: (expected) => {
    if (actual !== expected) throw new Error(`Expected ${expected}, received ${actual}`);
  },
  toEqual: (expected) => {
    const actStr = JSON.stringify(actual);
    const expStr = JSON.stringify(expected);
    if (actStr !== expStr) throw new Error(`Expected ${expStr}, received ${actStr}`);
  },
  toBeGreaterThan: (expected) => {
    if (actual <= expected) throw new Error(`Expected ${actual} > ${expected}`);
  }
});

console.log('================================================================');
console.log('ZENDEV SERVER-SIDE SEAT & DEVICE MANAGEMENT TEST RUNNER');
console.log('================================================================');

const TIER_SEATS = {
  free: 1,
  pro: 3,
  team: 10,
  enterprise: 50
};

class MockSeatLicenseManager {
  constructor(tier = 'pro') {
    this.currentDeviceId = 'HWID-TEST-CURRENT-001';
    const now = Date.now();
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
    };
  }

  getLicense() {
    return { ...this.license, devices: [...this.license.devices] };
  }

  registerDevice(deviceId, name) {
    const existing = this.license.devices.find((d) => d.deviceId === deviceId);
    if (existing) {
      existing.lastHeartbeatAt = Date.now();
      existing.status = 'active';
      return { success: true };
    }

    const activeCount = this.license.devices.filter((d) => d.status === 'active').length;
    if (activeCount >= this.license.maxSeats) {
      return {
        success: false,
        errorCode: 'SEAT_QUOTA_EXCEEDED',
        message: `Quota reached: maximum ${this.license.maxSeats} workstations allowed`
      };
    }

    const newDevice = {
      deviceId,
      deviceName: name,
      platform: 'macos',
      lastHeartbeatAt: Date.now(),
      status: 'active'
    };

    this.license.devices.push(newDevice);
    this.license.allocatedSeats = this.license.devices.filter((d) => d.status === 'active').length;
    return { success: true };
  }

  releaseSeat(deviceId) {
    const target = this.license.devices.find((d) => d.deviceId === deviceId);
    if (!target) return { success: false, remainingSeats: this.license.maxSeats - this.license.allocatedSeats };

    this.license.devices = this.license.devices.filter((d) => d.deviceId !== deviceId);
    this.license.allocatedSeats = this.license.devices.filter((d) => d.status === 'active').length;
    return {
      success: true,
      remainingSeats: this.license.maxSeats - this.license.allocatedSeats
    };
  }

  checkLeaseHealth(simulatedNow) {
    const now = simulatedNow || Date.now();
    if (!this.license.activeLease) return { status: 'expired', daysLeft: 0 };

    if (now <= this.license.activeLease.expiresAt) {
      return { status: 'healthy', daysLeft: 7 };
    }

    if (now <= this.license.activeLease.gracePeriodEndsAt) {
      const msLeft = this.license.activeLease.gracePeriodEndsAt - now;
      const daysLeft = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
      return { status: 'grace_period', daysLeft };
    }

    return { status: 'expired', daysLeft: 0 };
  }
}

describe('ZenDev Server-Side Seat & Device Management Engine', () => {
  let manager = new MockSeatLicenseManager('pro'); // 3 seats

  describe('1. Tier Seat Quota Mapping', () => {
    it('defines correct seat limits for Free, Pro, Team, and Enterprise', () => {
      expect(TIER_SEATS.free).toBe(1);
      expect(TIER_SEATS.pro).toBe(3);
      expect(TIER_SEATS.team).toBe(10);
      expect(TIER_SEATS.enterprise).toBe(50);
    });
  });

  describe('2. Device Registration & Quota Enforcement', () => {
    it('successfully registers devices within quota', () => {
      // 1 device exists, max 3
      const res1 = manager.registerDevice('HWID-MAC-002', 'MacBook Air');
      expect(res1.success).toBe(true);
      expect(manager.getLicense().allocatedSeats).toBe(2);

      const res2 = manager.registerDevice('HWID-LINUX-003', 'Ubuntu Server');
      expect(res2.success).toBe(true);
      expect(manager.getLicense().allocatedSeats).toBe(3);
    });

    it('rejects device registration when seat quota is exceeded', () => {
      expect(manager.getLicense().allocatedSeats).toBe(3);

      const overflow = manager.registerDevice('HWID-EXTRA-004', 'Windows Laptop');
      expect(overflow.success).toBe(false);
      expect(overflow.errorCode).toBe('SEAT_QUOTA_EXCEEDED');
      expect(manager.getLicense().allocatedSeats).toBe(3);
    });

    it('handles idempotent heartbeat for already registered devices', () => {
      const initialCount = manager.getLicense().devices.length;
      const res = manager.registerDevice('HWID-TEST-CURRENT-001', 'Primary Workstation Renamed');
      expect(res.success).toBe(true);
      expect(manager.getLicense().devices.length).toBe(initialCount);
    });
  });

  describe('3. Seat Revocation & Release', () => {
    it('frees a seat upon releasing an existing device, enabling new registration', () => {
      expect(manager.getLicense().allocatedSeats).toBe(3);

      // Releasing Linux workstation
      const releaseRes = manager.releaseSeat('HWID-LINUX-003');
      expect(releaseRes.success).toBe(true);
      expect(releaseRes.remainingSeats).toBe(1);
      expect(manager.getLicense().allocatedSeats).toBe(2);

      // Now extra device registration can succeed!
      const newDevRes = manager.registerDevice('HWID-EXTRA-004', 'Windows Laptop');
      expect(newDevRes.success).toBe(true);
      expect(manager.getLicense().allocatedSeats).toBe(3);
    });
  });

  describe('4. Lease Tokens & Offline Grace Period', () => {
    it('returns healthy status when lease is active', () => {
      const health = manager.checkLeaseHealth();
      expect(health.status).toBe('healthy');
      expect(health.daysLeft).toBe(7);
    });

    it('enters grace period when lease expires within 7 days', () => {
      const now = Date.now();
      // Simulate 2 days after lease expired (within 7 days)
      const simulatedTime = now + 48 * 60 * 60 * 1000;
      const health = manager.checkLeaseHealth(simulatedTime);
      expect(health.status).toBe('grace_period');
      expect(health.daysLeft).toBeGreaterThan(0);
    });

    it('expires after grace period exceeds 7 days offline', () => {
      const now = Date.now();
      // Simulate 8 days after issue
      const simulatedTime = now + 8 * 24 * 60 * 60 * 1000;
      const health = manager.checkLeaseHealth(simulatedTime);
      expect(health.status).toBe('expired');
      expect(health.daysLeft).toBe(0);
    });
  });
});

console.log('================================================================');
console.log(`SEAT LICENSE HARNESS RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
