// Minimal test runner harness for billing engine
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
  toBeLessThan: (expected) => {
    if (actual >= expected) throw new Error(`Expected ${actual} < ${expected}`);
  }
});

console.log('================================================================');
console.log('ZENDEV BILLING & SUBSCRIPTION ENGINE TEST RUNNER');
console.log('================================================================');

const PLANS = [
  {
    id: 'free',
    prices: {
      USD: { monthly: 0, yearly: 0 },
      EUR: { monthly: 0, yearly: 0 },
      TRY: { monthly: 0, yearly: 0 }
    }
  },
  {
    id: 'pro',
    prices: {
      USD: { monthly: 9, yearly: 79 },
      EUR: { monthly: 8, yearly: 72 },
      TRY: { monthly: 249, yearly: 1990 }
    }
  },
  {
    id: 'team',
    prices: {
      USD: { monthly: 19, yearly: 169 },
      EUR: { monthly: 18, yearly: 155 },
      TRY: { monthly: 499, yearly: 3990 }
    }
  }
];

const COUPONS = {
  ZENDEV20: 20,
  OGRENCI: 30,
  EARLYBIRD: 20,
  PROMO25: 25
};

function calculateDiscountedPrice(price, couponCode) {
  if (price === 0) return 0;
  if (!couponCode) return price;
  const clean = couponCode.trim().toUpperCase();
  const discount = COUPONS[clean];
  if (!discount) return price;
  return Math.round(price * (1 - discount / 100));
}

describe('ZenDev Monetization & Billing Engine', () => {
  describe('1. Plan Hierarchy & Pricing Integrity', () => {
    it('defines exactly Free, Pro, and Team tiers', () => {
      const ids = PLANS.map((p) => p.id);
      expect(ids).toEqual(['free', 'pro', 'team']);
    });

    it('guarantees yearly subscription provides savings over 12 monthly payments', () => {
      for (const plan of PLANS) {
        if (plan.id === 'free') continue;
        const monthlyTotalUSD = plan.prices.USD.monthly * 12;
        expect(plan.prices.USD.yearly).toBeLessThan(monthlyTotalUSD);

        const monthlyTotalTRY = plan.prices.TRY.monthly * 12;
        expect(plan.prices.TRY.yearly).toBeLessThan(monthlyTotalTRY);
      }
    });
  });

  describe('2. Coupon & Promo Code Discount Engine', () => {
    it('applies 20% discount with ZENDEV20 coupon', () => {
      const original = 79;
      const discounted = calculateDiscountedPrice(original, 'ZENDEV20');
      expect(discounted).toBe(63);
    });

    it('applies 30% discount with OGRENCI coupon', () => {
      const original = 100;
      const discounted = calculateDiscountedPrice(original, 'ogrenci');
      expect(discounted).toBe(70);
    });

    it('returns original price for non-existent coupon', () => {
      const original = 79;
      const result = calculateDiscountedPrice(original, 'INVALID_COUPON');
      expect(result).toBe(original);
    });

    it('returns zero for free tier regardless of coupon', () => {
      expect(calculateDiscountedPrice(0, 'ZENDEV20')).toBe(0);
    });
  });
});

console.log('================================================================');
console.log(`BILLING HARNESS RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================');

if (failed > 0) process.exit(1);
