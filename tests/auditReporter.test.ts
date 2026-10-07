/**
 * ZenDev Enterprise SaaS — Audit & Compliance Reporter Unit Tests
 * Validates cryptographic ledger continuity, SOC 2 Type II criteria,
 * ISO/IEC 27001:2022 controls, and GRC JSON/CSV exports.
 * Compliance: .agents/rules/zendev-saas-directive.md (Faz 4: Güvenlik & Uyumluluk)
 */

import { describe, it, expect } from 'vitest'
import { createHash } from 'crypto'
import { AuditReporter, ComplianceReport } from '../src/renderer/src/lib/auditCompliance/auditReporter'
import { ActivityEntry } from '../src/renderer/src/components/activity-feed/types'

function buildMockLedger(): ActivityEntry[] {
  const genesisHash = '0'.repeat(64)
  const now = Date.now()

  const rawEntries: Array<Omit<ActivityEntry, 'hash' | 'prevHash'>> = [
    {
      id: 'act_001',
      sequence: 1,
      timestamp: now - 50000,
      toolId: 'team_auth',
      action: 'member_invited',
      category: 'security',
      status: 'success',
      details: 'Takım üyesi davet edildi: dev@acme.corp'
    },
    {
      id: 'act_002',
      sequence: 2,
      timestamp: now - 40000,
      toolId: 'seat_license',
      action: 'device_registered',
      category: 'security',
      status: 'success',
      details: 'Yeni cihaz lisansa kaydedildi: Windows DevStation'
    },
    {
      id: 'act_003',
      sequence: 3,
      timestamp: now - 30000,
      toolId: 'cloud_sync',
      action: 'vault_synced',
      category: 'crypto',
      status: 'success',
      details: 'E2EE Kasa senkronize edildi (Revizyon #1)'
    },
    {
      id: 'act_004',
      sequence: 4,
      timestamp: now - 20000,
      toolId: 'team_collections',
      action: 'collection_saved',
      category: 'api',
      status: 'success',
      details: 'Takım koleksiyonu kaydedildi: Microservices Gateway (v1.0.0)'
    },
    {
      id: 'act_005',
      sequence: 5,
      timestamp: now - 10000,
      toolId: 'team_auth',
      action: 'role_updated',
      category: 'security',
      status: 'warning',
      details: 'Kullanıcı rolü güncellendi: dev@acme.corp -> admin'
    }
  ]

  let prevHash = genesisHash
  return rawEntries.map((e) => {
    const hash = createHash('sha256')
      .update(`${e.id}|${e.sequence}|${e.timestamp}|${e.action}|${prevHash}`)
      .digest('hex')
    const entryWithHashes: ActivityEntry = {
      ...e,
      prevHash,
      hash
    }
    prevHash = hash
    return entryWithHashes
  })
}

describe('AuditReporter (tests/auditReporter.test.ts)', () => {
  describe('1. Cryptographic Ledger Continuity & Tamper Verification', () => {
    it('handles empty activity ledger gracefully', () => {
      const res = AuditReporter.verifyLedgerContinuity([])
      expect(res.valid).toBe(true)
      expect(res.totalVerified).toBe(0)

      const report = AuditReporter.generateComplianceReport([])
      expect(report.chainIntegrity.status).toBe('EMPTY')
      expect(report.totalEventsAnalyzed).toBe(0)
    })

    it('validates an untampered 5-block cryptographic hash chain', () => {
      const ledger = buildMockLedger()
      const res = AuditReporter.verifyLedgerContinuity(ledger)
      expect(res.valid).toBe(true)
      expect(res.totalVerified).toBe(5)

      const report = AuditReporter.generateComplianceReport(ledger)
      expect(report.chainIntegrity.status).toBe('VERIFIED')
      expect(report.chainIntegrity.valid).toBe(true)
      expect(report.chainIntegrity.totalVerified).toBe(5)
      expect(report.chainIntegrity.headHash).toBe(ledger[4].hash)
      expect(report.chainIntegrity.genesisHash).toBe('0'.repeat(64))
    })

    it('detects hash chain breakage when prevHash is manipulated', () => {
      const ledger = buildMockLedger()
      ledger[2].prevHash = 'a'.repeat(64)

      const res = AuditReporter.verifyLedgerContinuity(ledger)
      expect(res.valid).toBe(false)
      expect(res.brokenIndex).toBe(2)
      expect(res.brokenReason).toContain('Hash zincir kopukluğu')

      const report = AuditReporter.generateComplianceReport(ledger)
      expect(report.chainIntegrity.status).toBe('TAMPERED')
      expect(report.chainIntegrity.valid).toBe(false)
      expect(report.overallScore).toBeLessThanOrEqual(35)
    })

    it('detects broken sequence numbers (dropped or injected blocks)', () => {
      const ledger = buildMockLedger()
      ledger[3].sequence = 99

      const res = AuditReporter.verifyLedgerContinuity(ledger)
      expect(res.valid).toBe(false)
      expect(res.brokenIndex).toBe(3)
      expect(res.brokenReason).toContain('Sıra numarası tutarsızlığı')
    })

    it('rejects malformed or incomplete hash strings', () => {
      const ledger = buildMockLedger()
      ledger[1].hash = 'too-short-hash'

      const res = AuditReporter.verifyLedgerContinuity(ledger)
      expect(res.valid).toBe(false)
      expect(res.brokenIndex).toBe(1)
      expect(res.brokenReason).toContain('Geçersiz veya eksik hash formatı')
    })
  })

  describe('2. SOC 2 Type II Controls Evaluation', () => {
    it('evaluates all 5 mandatory SOC 2 Trust Services Criteria with full evidence', () => {
      const ledger = buildMockLedger()
      const report = AuditReporter.generateComplianceReport(ledger, undefined, 'org_acme_saas')

      expect(report.soc2Findings.length).toBe(5)
      const controlIds = report.soc2Findings.map((f) => f.controlId)
      expect(controlIds).toContain('CC6.1')
      expect(controlIds).toContain('CC6.2')
      expect(controlIds).toContain('CC6.6')
      expect(controlIds).toContain('CC7.2')
      expect(controlIds).toContain('CC8.1')

      const cc61 = report.soc2Findings.find((f) => f.controlId === 'CC6.1')
      expect(cc61?.evidenceCount).toBe(3)
      expect(cc61?.status).toBe('COMPLIANT')
      expect(cc61?.score).toBe(100)

      const cc72 = report.soc2Findings.find((f) => f.controlId === 'CC7.2')
      expect(cc72?.status).toBe('COMPLIANT')
      expect(cc72?.score).toBe(100)

      expect(report.soc2Score).toBe(100)
    })

    it('fails CC7.2 and slashes score when ledger is tampered', () => {
      const ledger = buildMockLedger()
      ledger[3].prevHash = 'bad-hash-tampered'.padEnd(64, '0')

      const report = AuditReporter.generateComplianceReport(ledger)
      const cc72 = report.soc2Findings.find((f) => f.controlId === 'CC7.2')
      expect(cc72?.status).toBe('NON_COMPLIANT')
      expect(cc72?.score).toBe(0)
      expect(cc72?.summary).toContain('KRİTİK UYARI')
    })
  })

  describe('3. ISO/IEC 27001:2022 Controls Evaluation', () => {
    it('evaluates all 5 ISO 27001 controls across technological and organizational domains', () => {
      const ledger = buildMockLedger()
      const report = AuditReporter.generateComplianceReport(ledger)

      expect(report.isoFindings.length).toBe(5)
      const controlIds = report.isoFindings.map((f) => f.controlId)
      expect(controlIds).toContain('A.5.15')
      expect(controlIds).toContain('A.8.15')
      expect(controlIds).toContain('A.8.24')
      expect(controlIds).toContain('A.8.7')
      expect(controlIds).toContain('A.8.8')

      const a815 = report.isoFindings.find((f) => f.controlId === 'A.8.15')
      expect(a815?.status).toBe('IMPLEMENTED')
      expect(a815?.score).toBe(100)

      const a824 = report.isoFindings.find((f) => f.controlId === 'A.8.24')
      expect(a824?.status).toBe('IMPLEMENTED')
      expect(a824?.evidenceCount).toBe(1)

      expect(report.isoScore).toBe(100)
      expect(report.overallScore).toBe(100)
    })

    it('marks A.8.15 as NOT_IMPLEMENTED when chain integrity fails', () => {
      const ledger = buildMockLedger()
      ledger[2].hash = 'tampered_hash_value_1234567890123456789012345678901234567890123456'

      const report = AuditReporter.generateComplianceReport(ledger)
      const a815 = report.isoFindings.find((f) => f.controlId === 'A.8.15')
      expect(a815?.status).toBe('NOT_IMPLEMENTED')
      expect(a815?.score).toBe(0)
    })
  })

  describe('4. Enterprise Export Serialization (JSON & CSV)', () => {
    it('exports clean JSON report conforming to GRC schema', () => {
      const ledger = buildMockLedger()
      const report = AuditReporter.generateComplianceReport(ledger, undefined, 'org_acme_production')
      const json = AuditReporter.exportReportAsJson(report)

      const parsed: ComplianceReport = JSON.parse(json)
      expect(parsed.organizationId).toBe('org_acme_production')
      expect(parsed.totalEventsAnalyzed).toBe(5)
      expect(parsed.soc2Findings.length).toBe(5)
      expect(parsed.isoFindings.length).toBe(5)
      expect(parsed.chainIntegrity.status).toBe('VERIFIED')
    })

    it('exports RFC-compliant CSV with all controls and summaries', () => {
      const ledger = buildMockLedger()
      const report = AuditReporter.generateComplianceReport(ledger)
      const csv = AuditReporter.exportReportAsCsv(report)

      expect(csv).toContain('Framework,Control_ID,Title,Status,Score,Evidence_Count,Summary')
      expect(csv).toContain('SOC2_Type2,CC6.1')
      expect(csv).toContain('SOC2_Type2,CC7.2')
      expect(csv).toContain('ISO27001_2022,A.5.15')
      expect(csv).toContain('ISO27001_2022,A.8.15')
      expect(csv).toContain('ISO27001_2022,A.8.24')
    })
  })
})
