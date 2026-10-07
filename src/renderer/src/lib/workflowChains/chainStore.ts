/**
 * ZenDev Enterprise SaaS — Workflow Chain Storage & State Manager
 * Persistent storage of visual developer pipelines, pre-built templates, and custom workflows.
 * Compliance: .agents/rules/zendev-saas-directive.md (Principle 4)
 */

import { WorkflowChain, ChainStep } from './types'
import { PREBUILT_TEMPLATES } from './templates'

const STORAGE_KEY = 'zendev_workflow_chains'

export class ChainStore {
  public static getChains(): WorkflowChain[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch {}

    // First time launch: populate with pre-built templates
    this.saveChains(PREBUILT_TEMPLATES)
    return PREBUILT_TEMPLATES
  }

  public static getChainById(id: string): WorkflowChain | undefined {
    const chains = this.getChains()
    return chains.find((c) => c.id === id)
  }

  public static saveChain(chain: WorkflowChain): void {
    const chains = this.getChains()
    const index = chains.findIndex((c) => c.id === chain.id)
    const updated = [...chains]

    const updatedChain = {
      ...chain,
      updatedAt: Date.now()
    }

    if (index >= 0) {
      updated[index] = updatedChain
    } else {
      updated.unshift(updatedChain)
    }

    this.saveChains(updated)
  }

  public static deleteChain(id: string): void {
    const chains = this.getChains()
    const updated = chains.filter((c) => c.id !== id)
    this.saveChains(updated)
  }

  public static resetToTemplates(): WorkflowChain[] {
    this.saveChains(PREBUILT_TEMPLATES)
    return PREBUILT_TEMPLATES
  }

  public static exportJson(chain: WorkflowChain): string {
    return JSON.stringify(chain, null, 2)
  }

  public static importJson(jsonStr: string): WorkflowChain {
    const parsed = JSON.parse(jsonStr)
    if (!parsed.name || !Array.isArray(parsed.steps)) {
      throw new Error('Geçersiz Workflow Chain JSON formatı!')
    }

    const importedChain: WorkflowChain = {
      ...parsed,
      id: `chain_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isTemplate: false
    }

    this.saveChain(importedChain)
    return importedChain
  }

  public static createEmptyChain(name: string, description?: string): WorkflowChain {
    const newChain: WorkflowChain = {
      id: `chain_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim() || 'Yeni İş Akışı Zinciri',
      description: description || 'Özel stüdyo entegrasyon zinciri',
      category: 'custom',
      isTemplate: false,
      variables: {},
      steps: [
        {
          id: `step_${Date.now()}_1`,
          name: '1. Başlangıç Verisi',
          type: 'TRANSFORM',
          enabled: true,
          config: {
            transform: 'json_stringify',
            initialData: { message: 'Hello from ZenDev Workflow Chain' }
          }
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.saveChain(newChain)
    return newChain
  }

  private static saveChains(chains: WorkflowChain[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chains))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('zendev:chains-updated', { detail: { chains } }))
      }
    } catch {}
  }
}
