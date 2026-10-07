/**
 * ZenDev Privacy-First Telemetry — PII Sanitizer & Redactor
 * Strips usernames, local file system paths, credentials, tokens, IP addresses, and emails.
 * Compliance: .agents/rules/zendev-saas-directive.md (Principle 3: Table Stakes SaaS Altyapısı)
 */

export class TelemetrySanitizer {
  // Regex patterns for sensitive data redaction
  private static readonly WINDOWS_USER_PATH_REGEX = /([a-zA-Z]:\\(?:Users|Documents and Settings)\\[^\\]+)/gi
  private static readonly UNIX_USER_PATH_REGEX = /(\/(?:Users|home)\/[^/\s]+)/gi
  private static readonly EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi
  private static readonly JWT_REGEX = /\beyJ[a-zA-Z0-9_-]{5,}\.eyJ[a-zA-Z0-9_-]{5,}\.[a-zA-Z0-9_-]{10,}\b/gi
  private static readonly BEARER_TOKEN_REGEX = /Bearer\s+[a-zA-Z0-9_\-\.~+/]+=*/gi
  private static readonly IP_V4_REGEX = /\b(?:\d{1,3}\.){3}\d{1,3}\b/gi
  private static readonly API_KEY_REGEX = /\b(?:zen|sec|ghp|tauri|apikey)_[a-zA-Z0-9_]{16,}\b/gi
  private static readonly SENSITIVE_QUERY_PARAM_REGEX = /([?&](?:token|key|secret|password|auth|bearer|access_token)=)[^&]+/gi

  /**
   * Sanitizes arbitrary text, stripping all PII and sensitive identifiers.
   */
  public static sanitize(text: string): string {
    if (!text || typeof text !== 'string') return ''

    let sanitized = text

    // 1. Redact Windows user paths: C:\Users\john_doe\Project -> C:\Users\[REDACTED]\Project
    sanitized = sanitized.replace(this.WINDOWS_USER_PATH_REGEX, (match) => {
      const driveAndRoot = match.split('\\').slice(0, 2).join('\\')
      return `${driveAndRoot}\\[REDACTED]`
    })

    // 2. Redact Unix/macOS user paths: /Users/john/work -> /Users/[REDACTED]/work
    sanitized = sanitized.replace(this.UNIX_USER_PATH_REGEX, (match) => {
      const prefix = match.split('/')[1] // Users or home
      return `/${prefix}/[REDACTED]`
    })

    // 3. Redact Email addresses
    sanitized = sanitized.replace(this.EMAIL_REGEX, '[EMAIL_REDACTED]')

    // 4. Redact JWT tokens
    sanitized = sanitized.replace(this.JWT_REGEX, '[JWT_REDACTED]')

    // 5. Redact Bearer authorization headers
    sanitized = sanitized.replace(this.BEARER_TOKEN_REGEX, 'Bearer [TOKEN_REDACTED]')

    // 6. Redact API keys
    sanitized = sanitized.replace(this.API_KEY_REGEX, '[KEY_REDACTED]')

    // 7. Redact IPv4 addresses
    sanitized = sanitized.replace(this.IP_V4_REGEX, '[IP_REDACTED]')

    // 8. Redact URL sensitive query parameters
    sanitized = sanitized.replace(this.SENSITIVE_QUERY_PARAM_REGEX, '$1[REDACTED]')

    return sanitized
  }

  /**
   * Recursively sanitizes any JavaScript object or array values.
   */
  public static sanitizeObject<T>(input: T): T {
    if (input === null || input === undefined) return input

    if (typeof input === 'string') {
      return this.sanitize(input) as unknown as T
    }

    if (Array.isArray(input)) {
      return input.map((item) => this.sanitizeObject(item)) as unknown as T
    }

    if (typeof input === 'object') {
      const output: Record<string, any> = {}
      for (const [key, value] of Object.entries(input)) {
        const lowerKey = key.toLowerCase()
        if (
          lowerKey.includes('password') ||
          lowerKey.includes('secret') ||
          lowerKey.includes('token') ||
          lowerKey.includes('authorization') ||
          lowerKey.includes('cookie')
        ) {
          output[key] = '[REDACTED]'
        } else {
          output[key] = this.sanitizeObject(value)
        }
      }
      return output as T
    }

    return input
  }
}
