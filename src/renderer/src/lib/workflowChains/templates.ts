/**
 * ZenDev Enterprise SaaS — Pre-built Workflow Chain Templates
 * Production templates for Webhook Signing, OAuth2 Chaining, and Cryptographic Data Pipelines.
 * Compliance: .agents/rules/zendev-saas-directive.md (Principle 4)
 */

import { WorkflowChain } from './types'

export const PREBUILT_TEMPLATES: WorkflowChain[] = [
  {
    id: 'tpl_webhook_sign_dispatch',
    name: 'HMAC-SHA256 Webhook Payload İmzalama & Gönderim',
    description: 'JSON verisini hazırla, HMAC-SHA256 ile gizli anahtarla imzala ve X-Hub-Signature-256 başlığıyla Webhook endpointine ilet.',
    category: 'webhook',
    isTemplate: true,
    variables: {
      WEBHOOK_URL: 'https://httpbin.org/post',
      WEBHOOK_SECRET: 'zen_prod_webhook_secret_key_2026'
    },
    createdAt: 1774000000000,
    updatedAt: 1774000000000,
    steps: [
      {
        id: 'step_1_payload',
        name: '1. JSON Payload Hazırla',
        type: 'TRANSFORM',
        enabled: true,
        config: {
          transform: 'json_stringify',
          initialData: {
            event: 'order.completed',
            orderId: 'ORD-98421',
            amount: 249.50,
            currency: 'USD',
            customer: {
              name: 'Enterprise Client',
              tier: 'pro'
            }
          }
        }
      },
      {
        id: 'step_2_hmac',
        name: '2. HMAC-SHA256 ile İmzala',
        type: 'CRYPTO_SIGN',
        enabled: true,
        config: {
          algorithm: 'hmac_sha256',
          secretKey: '{{variables.WEBHOOK_SECRET}}',
          outputFormat: 'hex'
        }
      },
      {
        id: 'step_3_dispatch',
        name: '3. İmzalı Webhook Gönder',
        type: 'WEBHOOK_DISPATCH',
        enabled: true,
        config: {
          url: '{{variables.WEBHOOK_URL}}',
          signatureHeader: 'X-Hub-Signature-256',
          signaturePrefix: 'sha256=',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'ZenDev-Workflow-Chains/2.5.6'
          }
        }
      }
    ]
  },
  {
    id: 'tpl_oauth_request_pipeline',
    name: 'OAuth2 Token Handshake & Korumalı API İsteği',
    description: 'Kimlik sağlayıcıdan JWT/Bearer token al, access_token alanını ayıkla ve korumalı mikroservis API endpointini çağır.',
    category: 'api',
    isTemplate: true,
    variables: {
      AUTH_ENDPOINT: 'https://httpbin.org/post',
      PROTECTED_API_URL: 'https://httpbin.org/headers'
    },
    createdAt: 1774000000000,
    updatedAt: 1774000000000,
    steps: [
      {
        id: 'step_1_auth',
        name: '1. Token Alma İsteği (Mock Auth)',
        type: 'HTTP_REQUEST',
        enabled: true,
        config: {
          method: 'POST',
          url: '{{variables.AUTH_ENDPOINT}}',
          headers: {
            'Content-Type': 'application/json'
          },
          bodyType: 'json',
          body: JSON.stringify({
            client_id: 'zendev_client_id_app',
            client_secret: 'mock_client_secret_998',
            grant_type: 'client_credentials'
          }),
          authType: 'none'
        }
      },
      {
        id: 'step_2_extract',
        name: '2. access_token Alanını Ayıkla',
        type: 'JSON_EXTRACT',
        enabled: true,
        config: {
          path: 'json.client_id',
          fallback: 'zendev_mock_access_token_jwt'
        }
      },
      {
        id: 'step_3_call_api',
        name: '3. Bearer Token ile Korumalı API Çağır',
        type: 'HTTP_REQUEST',
        enabled: true,
        config: {
          method: 'GET',
          url: '{{variables.PROTECTED_API_URL}}',
          headers: {
            'X-Workflow-Chain': 'OAuth-Pipeline'
          },
          bodyType: 'none',
          authType: 'bearer',
          authToken: '{{step_2_extract.output}}'
        }
      },
      {
        id: 'step_4_assert',
        name: '4. Doğrulama (200 OK Kontrolü)',
        type: 'ASSERT',
        enabled: true,
        config: {
          expectedField: 'headers.Authorization',
          operator: 'contains',
          expectedValue: 'Bearer'
        }
      }
    ]
  },
  {
    id: 'tpl_crypto_data_pipeline',
    name: 'Veri Dönüştürme, Base64 Kodlama & SHA-256 Doğrulama',
    description: 'Girdi verisini Base64 formatına çevir, SHA-256 kriptografik özetini (fingerprint) oluştur ve bütünlük doğrulaması yap.',
    category: 'security',
    isTemplate: true,
    variables: {
      RAW_PAYLOAD: 'ZenDev Enterprise Desktop SaaS Workflow Engine 2026'
    },
    createdAt: 1774000000000,
    updatedAt: 1774000000000,
    steps: [
      {
        id: 'step_1_input',
        name: '1. Ham Veriyi Al & Base64 Kodla',
        type: 'TRANSFORM',
        enabled: true,
        config: {
          transform: 'base64_encode',
          initialData: '{{variables.RAW_PAYLOAD}}'
        }
      },
      {
        id: 'step_2_sha256',
        name: '2. SHA-256 Parmak İzi Üret',
        type: 'CRYPTO_SIGN',
        enabled: true,
        config: {
          algorithm: 'sha256',
          outputFormat: 'hex'
        }
      },
      {
        id: 'step_3_assert',
        name: '3. Kriptografik Özet Uzunluğunu Doğrula (64 Karakter)',
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
]
