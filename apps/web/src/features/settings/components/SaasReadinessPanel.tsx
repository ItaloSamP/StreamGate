import { useEffect, useState } from 'react'

import { humanizeOperationalError } from '@/lib/operational-utils'
import { streamgateApi, type SaasReadiness } from '@/lib/streamgate-api'
import { showSingletonToast } from '@/lib/toast'

export function SaasReadinessPanel() {
  const [readiness, setReadiness] = useState<SaasReadiness | null>(null)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    let mounted = true

    void streamgateApi.getSaasReadiness()
      .then((response) => {
        if (!mounted) return
        setReadiness(response.data)
        setStatus('success')
      })
      .catch((error) => {
        if (!mounted) return
        setStatus('error')
        showSingletonToast('error', humanizeOperationalError(error, 'Nao foi possivel carregar prontidao SaaS.'))
      })

    return () => {
      mounted = false
    }
  }, [])

  return (
    <section className="dash-panel">
      <div className="dash-panel-head">
        <div>
          <div className="dash-panel-title">Centro SaaS</div>
          <div className="dash-module-copy">
            Prontidao admin para organizacao, identidade, compliance, conectores, observabilidade e deploy gerenciado.
          </div>
        </div>
        <span className="dash-panel-tag">{status}</span>
      </div>

      {status === 'error' ? (
        <div className="dash-module-copy p-4">Prontidao SaaS indisponivel.</div>
      ) : readiness ? (
        <div className="grid gap-4 p-4">
          <div className="dash-module-grid">
            <div className="rounded-lg border border-[var(--border)] p-4">
              <div className="text-mono text-[11px] uppercase text-[var(--text-dim)]">Compliance</div>
              <div className="mt-2 text-lg font-semibold">{formatComplianceTarget(readiness.compliance.target)}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="dash-panel-tag">{readiness.compliance.status}</span>
                <span className="dash-panel-tag">{readiness.compliance.evidence_sections.length} evidencias</span>
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-4">
              <div className="text-mono text-[11px] uppercase text-[var(--text-dim)]">Infra</div>
              <div className="mt-2 text-lg font-semibold">{formatRuntime(readiness.infrastructure.runtime)}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="dash-panel-tag">TLS {readiness.infrastructure.ingress_tls ? 'on' : 'off'}</span>
                <span className="dash-panel-tag">{readiness.observability.stack}</span>
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-4">
              <div className="text-mono text-[11px] uppercase text-[var(--text-dim)]">Identidade</div>
              <div className="mt-2 text-lg font-semibold">{formatSso(readiness.identity.sso)}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="dash-panel-tag">MFA {readiness.identity.mfa.mode.toUpperCase()}</span>
                <span className="dash-panel-tag">SAML {readiness.identity.saml.status}</span>
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-4">
              <div className="text-mono text-[11px] uppercase text-[var(--text-dim)]">Billing</div>
              <div className="mt-2 text-lg font-semibold">{readiness.billing.reason}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="dash-panel-tag">{readiness.billing.status}</span>
                <span className="dash-panel-tag">quotas {readiness.quotas.status}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border)] p-4">
            <div className="dash-panel-head">
              <div>
                <div className="dash-panel-title">Conectores e leases</div>
                <div className="dash-module-copy">Superficie permitida para S3, HTTP, Google Drive e OAuth delegated sem credenciais claras em eventos ou UI.</div>
              </div>
              <span className="dash-panel-tag">{readiness.connectors.configured_count} perfis</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {readiness.connectors.supported.map((connector) => (
                <span key={connector} className="dash-pill dash-pill--neutral">{formatConnector(connector)}</span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border)] p-4">
            <div className="dash-panel-title">Bloqueios externos</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {readiness.external_blockers.map((blocker) => (
                <span key={blocker} className="dash-panel-tag">{formatBlocker(blocker)}</span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="dash-module-copy p-4">Carregando prontidao SaaS...</div>
      )}
    </section>
  )
}

function formatComplianceTarget(target: string) {
  return target === 'soc2_type_i' ? 'SOC 2 Type I' : formatBlocker(target)
}

function formatRuntime(runtime: string) {
  return runtime === 'aws_eks' ? 'AWS EKS' : formatBlocker(runtime)
}

function formatSso(sso: SaasReadiness['identity']['sso']) {
  const provider = sso.validated_provider === 'google_workspace' ? 'Google Workspace' : formatBlocker(sso.validated_provider)
  return `${provider} ${sso.protocol.toUpperCase()}`
}

function formatConnector(connector: string) {
  if (connector === 'google_drive') return 'Google Drive'
  if (connector === 'oauth_delegated') return 'OAuth delegated'
  return connector
}

function formatBlocker(value: string) {
  return value
    .split('_')
    .map((part) => part === 'aws' ? 'AWS' : part === 'tls' ? 'TLS' : part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
