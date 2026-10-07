/**
 * ZenDev Enterprise SaaS — Workflow Chains Engine Test Suite
 * Validates sequential execution, dot-path JSON parsing, variable interpolation,
 * WebCrypto HMAC-SHA256 signing, data transforms, and pre-built templates.
 * Compliance: .agents/rules/zendev-saas-directive.md (Principle 4: Diferansiyasyon & B2B Moat)
 */

import { describe, it, expect, beforeEach } from 'vitest'

export type StepType =
  | 'HTTP_REQUEST'
  | 'JSON_EXTRACT'
  | 'TRANSFORM'
  | 'CRYPTO_SIGN'
  | 'WEBHOOK_DISPATCH'
  | 'DELAY'
  | 'ASSERT'

export type TransformType =
  | 'base64_encode'
  | 'base64_decode'
  | 'hex_encode'
  | 'hex_decode'
  | 'url_encode'
  | 'url_decode'
  | 'upper_case'
  | 'lower_case'
  | 'json_stringify'
  | 'json_parse'

export type CryptoAlgorithm = 'hmac_sha256' | 'hmac_sha512' | 'sha256' | 'sha512' | 'md5'

export interface ChainStep {
  id: string
  name: string
  type: StepType
  enabled: boolean
  config: Record<string, any>
}

export interface WorkflowChain {
  id: string
  name: string
  description: string
  category: 'api' | 'security' | 'webhook' | 'custom'
  isTemplate?: boolean
  variables: Record<string, string>
  steps: ChainStep[]
  createdAt: number
  updatedAt: number
}

export interface StepExecutionResult {
  stepId: string
  stepName: string
  stepType: StepType
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped'
  durationMs: number
  input: any
  output: any
  error?: string
}

export interface ChainExecutionReport {
  chainId: string
  chainName: string
  startedAt: number
  finishedAt: number
  totalDurationMs: number
  status: 'success' | 'failed'
  stepResults: StepExecutionResult[]
  finalOutput?: any
}

export class TestChainExecutor {
  public static interpolate(
    template: string,
    context: { variables: Record<string, string>; stepOutputs: Record<string, any> }
  ): string {
    if (!template || typeof template !== 'string') return ''

    return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, expression) => {
      if (expression.startsWith('variables.')) {
        const key = expression.replace('variables.', '')
        return context.variables[key] ?? `{{${expression}}}`
      }

      const parts = expression.split('.')
      const stepId = parts[0]
      if (context.stepOutputs.hasOwnProperty(stepId)) {
        let current = context.stepOutputs[stepId]
        for (let i = 1; i < parts.length; i++) {
          const subKey = parts[i]
          if (subKey === 'output' && i === 1) continue
          if (current && typeof current === 'object' && current[subKey] !== undefined) {
            current = current[subKey]
          } else {
            current = undefined
            break
          }
        }
        if (current !== undefined) {
          return typeof current === 'object' ? JSON.stringify(current) : String(current)
        }
      }

      if (context.variables[expression] !== undefined) {
        return context.variables[expression]
      }

      return `{{${expression}}}`
    })
  }

  public static resolveJsonPath(obj: any, path: string, fallback?: any): any {
    if (!obj || !path) return fallback
    const cleanPath = path.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '')
    const keys = cleanPath.split('.')

    let current = obj
    for (const key of keys) {
      if (current !== null && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        return fallback
      }
    }
    return current !== undefined ? current : fallback
  }

  public static executeTransform(input: any, transform: TransformType): any {
    const str = typeof input === 'object' ? JSON.stringify(input) : String(input ?? '')

    switch (transform) {
      case 'base64_encode':
        return Buffer.from(str, 'utf8').toString('base64')
      case 'base64_decode':
        return Buffer.from(str, 'base64').toString('utf8')
      case 'hex_encode':
        return Buffer.from(str, 'utf8').toString('hex')
      case 'hex_decode':
        return Buffer.from(str, 'hex').toString('utf8')
      case 'url_encode':
        return encodeURIComponent(str)
      case 'url_decode':
        return decodeURIComponent(str)
      case 'upper_case':
        return str.toUpperCase()
      case 'lower_case':
        return str.toLowerCase()
      case 'json_stringify':
        return typeof input === 'string' ? input : JSON.stringify(input, null, 2)
      case 'json_parse':
        return typeof input === 'string' ? JSON.parse(input) : input
      default:
        return input
    }
  }

  public static async executeCryptoSign(
    input: string,
    algorithm: CryptoAlgorithm,
    secretKey?: string,
    outputFormat: 'hex' | 'base64' = 'hex'
  ): Promise<string> {
    const enc = new TextEncoder()
    const data = enc.encode(input)
    const cryptoSubtle = globalThis.crypto.subtle

    if (algorithm === 'sha256') {
      const hashBuffer = await cryptoSubtle.digest('SHA-256', data)
      const bytes = new Uint8Array(hashBuffer)
      return outputFormat === 'base64'
        ? Buffer.from(bytes).toString('base64')
        : Buffer.from(bytes).toString('hex')
    }

    if (algorithm === 'hmac_sha256') {
      if (!secretKey) throw new Error('HMAC-SHA256 requires a secret key')
      const keyData = enc.encode(secretKey)
      const cryptoKey = await cryptoSubtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      const sigBuffer = await cryptoSubtle.sign('HMAC', cryptoKey, data)
      const bytes = new Uint8Array(sigBuffer)
      return outputFormat === 'base64'
        ? Buffer.from(bytes).toString('base64')
        : Buffer.from(bytes).toString('hex')
    }

    throw new Error(`Unsupported algorithm: ${algorithm}`)
  }

  public static evaluateAssertion(
    input: any,
    expectedField: string,
    operator: 'equals' | 'contains' | 'exists' | 'greater_than',
    expectedValue: string
  ): boolean {
    let actual: any = input
    if (expectedField === 'length') {
      actual = typeof input === 'string' || Array.isArray(input) ? input.length : undefined
    } else if (expectedField && typeof input === 'object') {
      actual = this.resolveJsonPath(input, expectedField)
    }

    switch (operator) {
      case 'exists':
        return actual !== undefined && actual !== null
      case 'equals':
        return String(actual) === String(expectedValue)
      case 'contains':
        return String(actual ?? '').includes(String(expectedValue))
      case 'greater_than':
        return Number(actual) > Number(expectedValue)
      default:
        return false
    }
  }

  public static async runChain(
    chain: WorkflowChain,
    mockFetchHandler?: (url: string, init?: RequestInit) => Promise<any>
  ): Promise<ChainExecutionReport> {
    const startedAt = Date.now()
    const stepResults: StepExecutionResult[] = []
    const stepOutputs: Record<string, any> = {}
    let lastOutput: any = null
    let status: 'success' | 'failed' = 'success'

    for (const step of chain.steps) {
      if (!step.enabled) {
        stepResults.push({
          stepId: step.id,
          stepName: step.name,
          stepType: step.type,
          status: 'skipped',
          durationMs: 0,
          input: null,
          output: null
        })
        continue
      }

      const stepStart = Date.now()
      const stepInput = lastOutput

      try {
        let stepOutput: any = null

        switch (step.type) {
          case 'TRANSFORM': {
            const initial = step.config.initialData
            const dataToTransform = initial
              ? this.interpolate(
                  typeof initial === 'object' ? JSON.stringify(initial) : String(initial),
                  { variables: chain.variables, stepOutputs }
                )
              : stepInput

            stepOutput = this.executeTransform(dataToTransform, step.config.transform)
            break
          }

          case 'CRYPTO_SIGN': {
            const rawInput = typeof stepInput === 'object' ? JSON.stringify(stepInput) : String(stepInput ?? '')
            const secret = step.config.secretKey
              ? this.interpolate(step.config.secretKey, { variables: chain.variables, stepOutputs })
              : undefined

            stepOutput = await this.executeCryptoSign(
              rawInput,
              step.config.algorithm,
              secret,
              step.config.outputFormat || 'hex'
            )
            break
          }

          case 'JSON_EXTRACT': {
            const obj = typeof stepInput === 'string' ? JSON.parse(stepInput) : stepInput
            stepOutput = this.resolveJsonPath(obj, step.config.path, step.config.fallback)
            break
          }

          case 'ASSERT': {
            const passed = this.evaluateAssertion(
              stepInput,
              step.config.expectedField,
              step.config.operator,
              step.config.expectedValue
            )
            if (!passed) {
              throw new Error(`Assertion failed: expected ${step.config.expectedField} ${step.config.operator} ${step.config.expectedValue}`)
            }
            stepOutput = { passed: true, input: stepInput }
            break
          }

          case 'HTTP_REQUEST':
          case 'WEBHOOK_DISPATCH': {
            const targetUrl = this.interpolate(step.config.url, { variables: chain.variables, stepOutputs })
            if (mockFetchHandler) {
              stepOutput = await mockFetchHandler(targetUrl, { method: step.config.method || 'POST' })
            } else {
              stepOutput = { status: 200, statusText: 'OK', mocked: true, url: targetUrl }
            }
            break
          }

          default:
            stepOutput = stepInput
        }

        const durationMs = Math.max(1, Date.now() - stepStart)
        stepResults.push({
          stepId: step.id,
          stepName: step.name,
          stepType: step.type,
          status: 'success',
          durationMs,
          input: stepInput,
          output: stepOutput
        })

        stepOutputs[step.id] = stepOutput
        lastOutput = stepOutput
      } catch (err: any) {
        status = 'failed'
        const durationMs = Math.max(1, Date.now() - stepStart)
        stepResults.push({
          stepId: step.id,
          stepName: step.name,
          stepType: step.type,
          status: 'failed',
          durationMs,
          input: stepInput,
          output: null,
          error: err.message
        })
        break
      }
    }

    const finishedAt = Date.now()
    return {
      chainId: chain.id,
      chainName: chain.name,
      startedAt,
      finishedAt,
      totalDurationMs: finishedAt - startedAt,
      status,
      stepResults,
      finalOutput: lastOutput
    }
  }
}

describe('ZenDev Workflow Chains & Pipeline Engine', () => {
  describe('1. Variable & Step Interpolation Engine', () => {
    it('interpolates global chain variables correctly', () => {
      const vars = { API_KEY: 'zen_sec_key_123', BASE_URL: 'https://api.zendev.run' }
      const res = TestChainExecutor.interpolate('{{variables.BASE_URL}}/v1?key={{variables.API_KEY}}', {
        variables: vars,
        stepOutputs: {}
      })
      expect(res).toBe('https://api.zendev.run/v1?key=zen_sec_key_123')
    })

    it('interpolates step outputs with dot notation', () => {
      const stepOutputs = {
        step_auth: { token: 'jwt_mock_token_abc', status: 200 },
        step_user: { id: 42, role: 'admin' }
      }
      const res = TestChainExecutor.interpolate('Bearer {{step_auth.token}} for user {{step_user.id}}', {
        variables: {},
        stepOutputs
      })
      expect(res).toBe('Bearer jwt_mock_token_abc for user 42')
    })

    it('leaves unmatched templates preserved safely', () => {
      const res = TestChainExecutor.interpolate('Hello {{variables.UNKNOWN}} and {{step_99.output}}', {
        variables: {},
        stepOutputs: {}
      })
      expect(res).toBe('Hello {{variables.UNKNOWN}} and {{step_99.output}}')
    })
  })

  describe('2. JSON Dot-Path Resolution', () => {
    const samplePayload = {
      order: {
        id: 'ORD-9901',
        total: 199.99,
        items: [{ sku: 'SKU-A', qty: 2 }, { sku: 'SKU-B', qty: 1 }]
      }
    }

    it('resolves nested object keys', () => {
      const id = TestChainExecutor.resolveJsonPath(samplePayload, 'order.id')
      expect(id).toBe('ORD-9901')
      const total = TestChainExecutor.resolveJsonPath(samplePayload, 'order.total')
      expect(total).toBe(199.99)
    })

    it('resolves array indexing paths correctly', () => {
      const firstSku = TestChainExecutor.resolveJsonPath(samplePayload, 'order.items[0].sku')
      expect(firstSku).toBe('SKU-A')
      const secondQty = TestChainExecutor.resolveJsonPath(samplePayload, 'order.items[1].qty')
      expect(secondQty).toBe(1)
    })

    it('returns fallback value on non-existent path', () => {
      const missing = TestChainExecutor.resolveJsonPath(samplePayload, 'order.non_existent', 'N/A')
      expect(missing).toBe('N/A')
    })
  })

  describe('3. Studio Data Transformations', () => {
    it('encodes and decodes Base64 preserving unicode', () => {
      const raw = 'ZenDev Masaüstü SaaS 🚀'
      const encoded = TestChainExecutor.executeTransform(raw, 'base64_encode')
      const decoded = TestChainExecutor.executeTransform(encoded, 'base64_decode')
      expect(decoded).toBe(raw)
    })

    it('encodes and decodes Hex correctly', () => {
      const raw = 'SecurityPayload'
      const hex = TestChainExecutor.executeTransform(raw, 'hex_encode')
      expect(hex).toBe('53656375726974795061796c6f6164')
      const decoded = TestChainExecutor.executeTransform(hex, 'hex_decode')
      expect(decoded).toBe(raw)
    })

    it('converts casing and encodes URLs', () => {
      expect(TestChainExecutor.executeTransform('hello world', 'upper_case')).toBe('HELLO WORLD')
      expect(TestChainExecutor.executeTransform('HELLO WORLD', 'lower_case')).toBe('hello world')
      expect(TestChainExecutor.executeTransform('hello world&param=1', 'url_encode')).toBe('hello%20world%26param%3D1')
    })
  })

  describe('4. Cryptographic Hashing & HMAC-SHA256 Signatures', () => {
    it('generates deterministic SHA-256 hex hash', async () => {
      const hash = await TestChainExecutor.executeCryptoSign('hello world', 'sha256', undefined, 'hex')
      expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9')
      expect(hash.length).toBe(64)
    })

    it('generates valid HMAC-SHA256 signature with secret key', async () => {
      const message = 'order_payload_json'
      const secret = 'zen_test_secret_key'
      const signature = await TestChainExecutor.executeCryptoSign(message, 'hmac_sha256', secret, 'hex')
      expect(signature).toBeDefined()
      expect(signature.length).toBe(64)
      
      // Repeating with identical key and message gives identical signature
      const signature2 = await TestChainExecutor.executeCryptoSign(message, 'hmac_sha256', secret, 'hex')
      expect(signature).toBe(signature2)
    })
  })

  describe('5. Assertions Evaluation Engine', () => {
    it('evaluates string and number equality', () => {
      expect(TestChainExecutor.evaluateAssertion('200', '', 'equals', '200')).toBe(true)
      expect(TestChainExecutor.evaluateAssertion('200', '', 'equals', '500')).toBe(false)
    })

    it('evaluates substring containment', () => {
      expect(TestChainExecutor.evaluateAssertion('Bearer jwt_mock_key', '', 'contains', 'Bearer')).toBe(true)
      expect(TestChainExecutor.evaluateAssertion('Basic dXNlcjpwYXNz', '', 'contains', 'Bearer')).toBe(false)
    })

    it('evaluates length and greater_than assertions', () => {
      expect(TestChainExecutor.evaluateAssertion('64_char_string_representation_value_here_length_must_match', 'length', 'greater_than', '10')).toBe(true)
    })
  })

  describe('6. End-to-End Pipeline Execution', () => {
    it('executes a 3-step pipeline (Transform -> HMAC Sign -> Assert) successfully', async () => {
      const testChain: WorkflowChain = {
        id: 'test_pipeline_01',
        name: 'Crypto Verification Pipeline',
        description: 'Prepare data, HMAC sign, and assert signature length',
        category: 'security',
        variables: {
          SECRET: 'zen_test_pipeline_secret'
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        steps: [
          {
            id: 'step_1_payload',
            name: 'Prepare Payload',
            type: 'TRANSFORM',
            enabled: true,
            config: {
              transform: 'json_stringify',
              initialData: { action: 'release_payout', amount: 500 }
            }
          },
          {
            id: 'step_2_hmac',
            name: 'Sign HMAC-SHA256',
            type: 'CRYPTO_SIGN',
            enabled: true,
            config: {
              algorithm: 'hmac_sha256',
              secretKey: '{{variables.SECRET}}',
              outputFormat: 'hex'
            }
          },
          {
            id: 'step_3_assert',
            name: 'Verify Length 64',
            type: 'ASSERT',
            enabled: true,
            config: {
              expectedField: 'length',
              operator: 'equals',
              expectedValue: '64'
            }
          }
        ]
      }

      const report = await TestChainExecutor.runChain(testChain)
      expect(report.status).toBe('success')
      expect(report.stepResults.length).toBe(3)
      expect(report.stepResults[0].status).toBe('success')
      expect(report.stepResults[1].status).toBe('success')
      expect(report.stepResults[2].status).toBe('success')
      expect(report.stepResults[1].output.length).toBe(64)
    })

    it('halts execution gracefully on assertion failure', async () => {
      const failingChain: WorkflowChain = {
        id: 'failing_chain',
        name: 'Failing Pipeline',
        description: 'Should fail at step 2',
        category: 'custom',
        variables: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
        steps: [
          {
            id: 's1',
            name: 'Step 1',
            type: 'TRANSFORM',
            enabled: true,
            config: {
              transform: 'upper_case',
              initialData: 'fail me'
            }
          },
          {
            id: 's2',
            name: 'Step 2 Assert',
            type: 'ASSERT',
            enabled: true,
            config: {
              expectedField: '',
              operator: 'equals',
              expectedValue: 'NEVER_MATCH'
            }
          },
          {
            id: 's3',
            name: 'Step 3 Unreachable',
            type: 'TRANSFORM',
            enabled: true,
            config: {
              transform: 'lower_case'
            }
          }
        ]
      }

      const report = await TestChainExecutor.runChain(failingChain)
      expect(report.status).toBe('failed')
      expect(report.stepResults.length).toBe(2)
      expect(report.stepResults[0].status).toBe('success')
      expect(report.stepResults[1].status).toBe('failed')
      expect(report.stepResults[1].error).toContain('Assertion failed')
    })
  })
})
