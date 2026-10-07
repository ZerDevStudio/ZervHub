/**
 * ZenDev Enterprise SaaS — Shareable Team Collections Default Presets
 * Pre-configured team presets for API Requests, Regex Rules, Cron Schedules, and Mermaid Diagrams.
 * Compliance: .agents/rules/zendev-saas-directive.md (Principle 4)
 */

import { TeamCollection } from './types'

export const DEFAULT_TEAM_COLLECTIONS: TeamCollection[] = [
  {
    id: 'col_api_gateway',
    name: 'Core Microservices & Webhook Gateway',
    slug: 'core-microservices-webhook-gateway',
    description: 'Production REST & Webhook endpoints for microservice integration testing, status checks, and HMAC payload verification.',
    category: 'api',
    version: '1.2.0',
    author: {
      id: 'usr_lead_arch',
      name: 'System Architect',
      email: 'architect@zendev.io'
    },
    organizationId: 'org_zendev_core',
    visibility: 'team',
    tags: ['microservices', 'rest', 'webhooks', 'auth'],
    createdAt: 1774000000000,
    updatedAt: 1774000000000,
    items: [
      {
        id: 'item_api_health',
        name: 'Cluster Health & Liveness Probe',
        description: 'Kubernetes ingress health endpoint checking database latency and redis cluster quorum.',
        category: 'api',
        tags: ['health', 'k8s', 'infra'],
        payload: {
          method: 'GET',
          url: 'https://api.zendev.run/v1/cluster/health',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ZenDev-TeamCollections/2.5.6'
          },
          tests: [
            'pm.response.to.have.status(200)',
            'pm.response.json().status === "healthy"'
          ]
        },
        createdAt: 1774000000000,
        updatedAt: 1774000000000
      },
      {
        id: 'item_api_webhook_payout',
        name: 'Order Payout Webhook Dispatch',
        description: 'Post order settlement payloads with HMAC-SHA256 signature verification.',
        category: 'api',
        tags: ['webhook', 'finance', 'payout'],
        payload: {
          method: 'POST',
          url: 'https://api.zendev.run/v1/webhooks/payout',
          headers: {
            'Content-Type': 'application/json',
            'X-Hub-Signature-256': 'sha256=mock_signature_hash_value',
            'Authorization': 'Bearer {{variables.ACCESS_TOKEN}}'
          },
          body: JSON.stringify({
            event: 'payout.initiated',
            amount: 1450.00,
            currency: 'USD',
            merchantId: 'merch_zen_99841'
          }, null, 2),
          tests: [
            'pm.response.to.have.status(202)',
            'pm.response.json().accepted === true'
          ]
        },
        createdAt: 1774000000000,
        updatedAt: 1774000000000
      },
      {
        id: 'item_api_token_introspect',
        name: 'OAuth2 Token Introspection',
        description: 'RFC 7662 OAuth 2.0 Token Introspection endpoint to validate access tokens and claims.',
        category: 'api',
        tags: ['oauth2', 'auth', 'security'],
        payload: {
          method: 'POST',
          url: 'https://api.zendev.run/oauth/introspect',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic {{variables.BASIC_AUTH_HEADER}}'
          },
          body: 'token={{variables.USER_ACCESS_TOKEN}}&token_type_hint=access_token',
          tests: [
            'pm.response.to.have.status(200)',
            'pm.response.json().active === true'
          ]
        },
        createdAt: 1774000000000,
        updatedAt: 1774000000000
      }
    ]
  },
  {
    id: 'col_regex_secops',
    name: 'SecOps & Input Sanitization Ruleset',
    slug: 'secops-input-sanitization-ruleset',
    description: 'Enterprise validation patterns for zero-trust user input, emails, UUIDs, IP addresses, and sensitive tokens.',
    category: 'regex',
    version: '2.0.0',
    author: {
      id: 'usr_sec_lead',
      name: 'Security Officer',
      email: 'secops@zendev.io'
    },
    organizationId: 'org_zendev_core',
    visibility: 'team',
    tags: ['security', 'validation', 'rfc', 'zero-trust'],
    createdAt: 1774000000000,
    updatedAt: 1774000000000,
    items: [
      {
        id: 'item_regex_email_rfc',
        name: 'Strict RFC 5322 Email Validator',
        description: 'Comprehensive regular expression adhering to RFC 5322 international email standards.',
        category: 'regex',
        tags: ['email', 'rfc5322', 'validation'],
        payload: {
          pattern: '^[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$',
          flags: 'i',
          description: 'Validates standard and complex email addresses preventing injection attacks.',
          testStrings: [
            'dev.lead@zendev.io',
            'support+filter@domain.co.uk',
            'invalid..email@domain'
          ],
          expectedMatches: ['dev.lead@zendev.io', 'support+filter@domain.co.uk']
        },
        createdAt: 1774000000000,
        updatedAt: 1774000000000
      },
      {
        id: 'item_regex_tckn',
        name: 'T.C. Kimlik No Formatı & Algoritması',
        description: '11 haneli T.C. Kimlik numarasının 0 ile başlamama ve sayısal karakter formatı kontrolü.',
        category: 'regex',
        tags: ['identity', 'turkey', 'compliance'],
        payload: {
          pattern: '^[1-9][0-9]{10}$',
          flags: '',
          description: 'İlk hanesi sıfır olamayan tam 11 basamaklı TCKN format doğrulayıcı.',
          testStrings: ['12345678901', '01234567891', '98765432102'],
          expectedMatches: ['12345678901', '98765432102']
        },
        createdAt: 1774000000000,
        updatedAt: 1774000000000
      },
      {
        id: 'item_regex_uuid_v4',
        name: 'Canonical UUID v4 Detector',
        description: 'Standard RFC 4122 Universally Unique Identifier version 4 pattern.',
        category: 'regex',
        tags: ['uuid', 'guid', 'v4'],
        payload: {
          pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
          flags: 'i',
          description: 'Validates cryptographic UUID v4 strings in standard hyphenated notation.',
          testStrings: [
            '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
            'c9b4e339-4d40-424a-85b4-d57be76cb3c6'
          ],
          expectedMatches: ['c9b4e339-4d40-424a-85b4-d57be76cb3c6']
        },
        createdAt: 1774000000000,
        updatedAt: 1774000000000
      }
    ]
  },
  {
    id: 'col_cron_devops',
    name: 'DevOps & Cloud Maintenance Schedules',
    slug: 'devops-cloud-maintenance-schedules',
    description: 'Shared production maintenance jobs: database snapshotting, cache invalidation, and weekly analytics digests.',
    category: 'cron',
    version: '1.0.0',
    author: {
      id: 'usr_devops_eng',
      name: 'Site Reliability Engineer',
      email: 'sre@zendev.io'
    },
    organizationId: 'org_zendev_core',
    visibility: 'team',
    tags: ['devops', 'cron', 'schedules', 'backups'],
    createdAt: 1774000000000,
    updatedAt: 1774000000000,
    items: [
      {
        id: 'item_cron_db_backup',
        name: 'Gece Yarısı Veritabanı Yedeği (Midnight Snapshot)',
        description: 'Her gece saat 00:00 UTC\'de PostgreSQL ve Redis cluster anlık yedeğini S3 depolamaya iletir.',
        category: 'cron',
        tags: ['backup', 'database', 'nightly'],
        payload: {
          expression: '0 0 * * *',
          humanReadable: 'Her gün saat 00:00 UTC (Midnight)',
          timezone: 'UTC',
          description: 'Automated daily database snapshot to cold storage.'
        },
        createdAt: 1774000000000,
        updatedAt: 1774000000000
      },
      {
        id: 'item_cron_token_sweep',
        name: 'Saatlik Oturum & Token Süpürme (Cache Eviction)',
        description: 'Her saat başı süresi dolmuş JWT oturum anahtarlarını ve geçici yükleme dosyalarını temizler.',
        category: 'cron',
        tags: ['cache', 'cleanup', 'hourly'],
        payload: {
          expression: '0 * * * *',
          humanReadable: 'Her saat başı (0. dakikada)',
          timezone: 'UTC',
          description: 'Hourly eviction of expired tokens and transient cache files.'
        },
        createdAt: 1774000000000,
        updatedAt: 1774000000000
      },
      {
        id: 'item_cron_weekly_digest',
        name: 'Haftalık Mühendislik Raporu (Friday Digest)',
        description: 'Her Cuma saat 17:00\'de haftalık API kullanım ve hata metriklerini Slack ve e-postaya post eder.',
        category: 'cron',
        tags: ['reporting', 'analytics', 'weekly'],
        payload: {
          expression: '0 17 * * 5',
          humanReadable: 'Her Cuma saat 17:00 (Haftalık özet)',
          timezone: 'Europe/Istanbul',
          description: 'Weekly team telemetry & SLA availability rollup notification.'
        },
        createdAt: 1774000000000,
        updatedAt: 1774000000000
      }
    ]
  },
  {
    id: 'col_mermaid_arch',
    name: 'Enterprise Architecture & Auth Flows',
    slug: 'enterprise-architecture-auth-flows',
    description: 'Standardized team architecture diagrams, sequence protocols, and microservice topologies.',
    category: 'mermaid',
    version: '1.1.0',
    author: {
      id: 'usr_lead_arch',
      name: 'System Architect',
      email: 'architect@zendev.io'
    },
    organizationId: 'org_zendev_core',
    visibility: 'team',
    tags: ['architecture', 'mermaid', 'diagrams', 'oauth2'],
    createdAt: 1774000000000,
    updatedAt: 1774000000000,
    items: [
      {
        id: 'item_mermaid_oauth_pkce',
        name: 'OAuth2 with PKCE Protocol Flow',
        description: 'Complete authorization code flow with Proof Key for Code Exchange (PKCE) for client apps.',
        category: 'mermaid',
        tags: ['sequence', 'oauth2', 'pkce'],
        payload: {
          diagramType: 'sequence',
          description: 'Secure sequence diagram detailing auth code and token exchange.',
          chartDefinition: `sequenceDiagram
    autonumber
    actor User as Geliştirici / İstemci
    participant App as ZenDev Desktop
    participant Auth as Kimlik Sağlayıcı (OAuth2)
    participant API as Korumalı API Gateway

    User->>App: Giriş İsteği (Start Login)
    App->>App: code_verifier & code_challenge Üret (SHA-256)
    App->>Auth: /authorize?code_challenge=xyz&method=S256
    Auth-->>User: Giriş Ekranı (Login & Consent)
    User->>Auth: Kullanıcı Bilgileri Onayı
    Auth-->>App: Yönlendirme Kodu (auth_code)
    App->>Auth: /token?code=auth_code&code_verifier=xyz
    Auth-->>App: Access Token (JWT) & Refresh Token
    App->>API: İstek + Authorization: Bearer <Token>
    API-->>App: 200 OK + Korumalı Veri`
        },
        createdAt: 1774000000000,
        updatedAt: 1774000000000
      },
      {
        id: 'item_mermaid_event_broker',
        name: 'Event-Driven Webhook Broker Architecture',
        description: 'Microservice event publishing, async message queue worker, and retry backoff topology.',
        category: 'mermaid',
        tags: ['flowchart', 'event-driven', 'queue'],
        payload: {
          diagramType: 'flowchart',
          description: 'High-availability event distribution architecture.',
          chartDefinition: `flowchart TD
    API["API Gateway (REST / gRPC)"] --> Bus["Kafka / RabbitMQ Event Bus"]
    Bus --> Worker1["Payout Processor Worker"]
    Bus --> Worker2["Audit & Telemetry Logger"]
    Worker1 --> DB[("PostgreSQL Aurora")]
    Worker1 --> Webhook["Webhook Dispatcher"]
    Webhook --> Client["Müşteri Endpoint (HTTPS)"]
    Webhook -.->|Başarısız İstek| DLQ[("Dead Letter Queue")]`
        },
        createdAt: 1774000000000,
        updatedAt: 1774000000000
      }
    ]
  }
]
