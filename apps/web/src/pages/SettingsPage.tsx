import { useEffect, useState } from 'react'

import { WorkspaceModule } from '@/components/app/workspace-module'
import { WorkspacePageFrame } from '@/components/app/workspace-page-frame'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/auth-context'
import { humanizeOperationalError } from '@/lib/operational-utils'
import {
  createIdempotencyKey,
  streamgateApi,
  type ConnectorKind,
  type ConnectorProfile,
  type ConnectorStatus,
  type GoogleDriveAuthorizeResponse,
  type GoogleDriveItem,
  type OrganizationPayload,
  type SaasReadiness,
} from '@/lib/streamgate-api'
import { showSingletonToast } from '@/lib/toast'

export function SettingsPage() {
  const { session } = useAuth()
  const isAdmin = session?.user.role === 'admin'

  return (
    <WorkspacePageFrame pathname="/settings" eyebrow="Workspace e integracoes" title="Configuracoes" primaryActionLabel="Salvar preferencias">
      <WorkspaceModule
        title="Configuracoes"
        description="A fundacao de autenticacao conecta autenticacao real e consolida esta superficie para variaveis de ambiente, sessao e comportamento do cliente HTTP."
        highlights={[
          { label: 'Backend target', value: 'API base URL', hint: 'Centralizado no adapter oficial' },
          { label: 'Session layer', value: 'real auth', hint: 'Login, logout, me e reset conectados ao backend' },
          { label: 'Workspace policy', value: 'single shell', hint: 'Toda tela protegida herda a mesma familia visual' },
        ]}
        checkpoints={[
          'Sessao real persistida em storage conforme opcao de lembrar login.',
          'Integracoes futuras podem crescer aqui sem cruzar com auditoria.',
          'Cliente HTTP e configuracao operacional agora tem casa oficial na UI.',
        ]}
      >
        {isAdmin ? (
          <>
            <OrganizationAdminPanel />
            <SecurityAdminPanel />
            <GoogleDrivePanel />
            <SaasReadinessPanel />
            <ConnectorProfilesPanel />
          </>
        ) : <OperatorConnectorNotice />}
      </WorkspaceModule>
    </WorkspacePageFrame>
  )
}

function OperatorConnectorNotice() {
  return (
    <section className="dash-panel dash-module-card">
      <div className="dash-panel-head">
        <div>
          <div className="dash-panel-title">Conectores restritos a administradores</div>
          <div className="dash-module-copy">
            Operadores acompanham ingestao, jobs e eventos no proprio escopo, mas nao gerenciam organizacao, membros, SSO, quotas, compliance, conectores sensiveis ou leases.
          </div>
        </div>
        <span className="dash-panel-tag">RBAC</span>
      </div>
    </section>
  )
}

function OrganizationAdminPanel() {
  const [payload, setPayload] = useState<OrganizationPayload | null>(null)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [orgForm, setOrgForm] = useState({
    name: '',
    retentionDays: '90',
    maxFileBytes: '10737418240',
    monthlyUploadBytes: '1099511627776',
    connectorRunsDaily: '1000',
  })
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'operator' as 'admin' | 'operator' })

  useEffect(() => {
    let mounted = true

    async function loadOrganization() {
      try {
        const [organizationResponse, membersResponse] = await Promise.all([
          streamgateApi.getOrganization(),
          streamgateApi.listOrganizationMembers(),
        ])
        if (!mounted) return

        const nextPayload = {
          ...organizationResponse.data,
          members: membersResponse.data,
        }
        setPayload(nextPayload)
        setOrgForm({
          name: nextPayload.organization.name,
          retentionDays: String(nextPayload.organization.retention_days),
          maxFileBytes: String(nextPayload.organization.quotas.max_file_bytes ?? ''),
          monthlyUploadBytes: String(nextPayload.organization.quotas.monthly_upload_bytes ?? ''),
          connectorRunsDaily: String(nextPayload.organization.quotas.connector_runs_daily ?? ''),
        })
        setStatus('success')
      } catch (error) {
        if (!mounted) return
        setStatus('error')
        showSingletonToast('error', humanizeOperationalError(error, 'Nao foi possivel carregar organizacao.'))
      }
    }

    loadOrganization()

    return () => {
      mounted = false
    }
  }, [])

  async function saveOrganization(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const quotas = {
      max_file_bytes: parsePositiveInteger(orgForm.maxFileBytes),
      monthly_upload_bytes: parsePositiveInteger(orgForm.monthlyUploadBytes),
      connector_runs_daily: parsePositiveInteger(orgForm.connectorRunsDaily),
    }

    try {
      const response = await streamgateApi.updateOrganization({
        name: orgForm.name.trim(),
        retentionDays: parsePositiveInteger(orgForm.retentionDays),
        quotas,
        idempotencyKey: createIdempotencyKey('organization'),
      })
      setPayload(response.data)
      showSingletonToast('success', 'Organizacao atualizada com quotas e retencao.')
    } catch (error) {
      showSingletonToast('error', humanizeOperationalError(error, 'Nao foi possivel salvar organizacao.'))
    }
  }

  async function sendInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = inviteForm.email.trim()
    if (!email) return

    try {
      const response = await streamgateApi.createOrganizationInvite({
        email,
        role: inviteForm.role,
        idempotencyKey: createIdempotencyKey('organization-invite'),
      })
      setPayload((current) => current ? { ...current, invites: [response.data, ...current.invites] } : current)
      setInviteForm((current) => ({ ...current, email: '' }))
      showSingletonToast('success', 'Convite criado sem expor token de aceite.')
    } catch (error) {
      showSingletonToast('error', humanizeOperationalError(error, 'Nao foi possivel criar convite.'))
    }
  }

  return (
    <section className="dash-panel dash-module-card">
      <div className="dash-panel-head">
        <div>
          <div className="dash-panel-title">Organizacao</div>
          <div className="dash-module-copy">Tenant atual, membros, convites, quotas e retencao por organizacao.</div>
        </div>
        <span className="dash-panel-tag">{status}</span>
      </div>

      <form className="grid gap-4 p-4" onSubmit={saveOrganization}>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="organization-name">Nome da organizacao</Label>
            <Input id="organization-name" value={orgForm.name} onChange={(event) => setOrgForm((current) => ({ ...current, name: event.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="organization-retention">Retencao em dias</Label>
            <Input id="organization-retention" type="number" min="1" value={orgForm.retentionDays} onChange={(event) => setOrgForm((current) => ({ ...current, retentionDays: event.target.value }))} />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="quota-max-file">Tamanho maximo por arquivo</Label>
            <Input id="quota-max-file" type="number" min="1" value={orgForm.maxFileBytes} onChange={(event) => setOrgForm((current) => ({ ...current, maxFileBytes: event.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quota-monthly">Bytes mensais</Label>
            <Input id="quota-monthly" type="number" min="1" value={orgForm.monthlyUploadBytes} onChange={(event) => setOrgForm((current) => ({ ...current, monthlyUploadBytes: event.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quota-runs">Runs de conector por dia</Label>
            <Input id="quota-runs" type="number" min="1" value={orgForm.connectorRunsDaily} onChange={(event) => setOrgForm((current) => ({ ...current, connectorRunsDaily: event.target.value }))} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="panel" size="xl" disabled={!orgForm.name.trim()}>Salvar organizacao</Button>
          <span className="dash-panel-tag">Compliance {payload?.organization.compliance_profile?.target === 'soc2_type_i' ? 'SOC 2 Type I' : 'design evidence'}</span>
        </div>
      </form>

      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <div className="dash-table-scroll">
          <table className="dash-table">
            <thead><tr><th>Membro</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              {(payload?.members ?? []).map((member) => (
                <tr key={member.id}>
                  <td className="name">{member.email}</td>
                  <td className="dim">{member.role}</td>
                  <td><span className="dash-pill dash-pill--neutral">{member.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3">
          <form className="grid gap-3" onSubmit={sendInvite}>
            <div className="grid gap-2">
              <Label htmlFor="organization-invite-email">Email do convite</Label>
              <Input id="organization-invite-email" type="email" value={inviteForm.email} onChange={(event) => setInviteForm((current) => ({ ...current, email: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="organization-invite-role">Role do convite</Label>
              <select id="organization-invite-role" className="input-shell" value={inviteForm.role} onChange={(event) => setInviteForm((current) => ({ ...current, role: event.target.value as 'admin' | 'operator' }))}>
                <option value="operator">operator</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <Button type="submit" variant="panel" size="xl" disabled={!inviteForm.email.trim()}>Enviar convite</Button>
          </form>
          <div className="dash-table-scroll">
            <table className="dash-table">
              <thead><tr><th>Convite</th><th>Role</th><th>Status</th></tr></thead>
              <tbody>
                {(payload?.invites ?? []).map((invite) => (
                  <tr key={invite.id}>
                    <td className="name">{invite.email}</td>
                    <td className="dim">{invite.role}</td>
                    <td><span className="dash-pill dash-pill--neutral">{invite.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

function SecurityAdminPanel() {
  const [mfaStatus, setMfaStatus] = useState('nao iniciado')
  const [oidcStatus, setOidcStatus] = useState('nao configurado')
  const [oidcForm, setOidcForm] = useState({
    issuer: 'https://accounts.google.com',
    clientId: '',
    clientSecret: '',
    hostedDomain: '',
  })

  async function setupMfa() {
    try {
      const response = await streamgateApi.auth.setupMfa()
      setMfaStatus(`${response.data.status} - provisioning URI gerado`)
      showSingletonToast('success', 'Setup MFA iniciado. Use o URI somente em canal seguro.')
    } catch (error) {
      showSingletonToast('error', humanizeOperationalError(error, 'Nao foi possivel iniciar MFA.'))
    }
  }

  async function saveOidc(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const response = await streamgateApi.auth.updateGoogleOidcProvider({
        issuer: oidcForm.issuer.trim(),
        clientId: oidcForm.clientId.trim(),
        clientSecret: oidcForm.clientSecret,
        hostedDomain: oidcForm.hostedDomain.trim(),
      })
      setOidcForm((current) => ({ ...current, clientSecret: '' }))
      setOidcStatus(`${response.data.provider} ${response.data.status}`)
      showSingletonToast('success', 'OIDC Google Workspace salvo sem renderizar client secret.')
    } catch (error) {
      showSingletonToast('error', humanizeOperationalError(error, 'Nao foi possivel salvar OIDC.'))
    }
  }

  return (
    <section className="dash-panel dash-module-card">
      <div className="dash-panel-head">
        <div>
          <div className="dash-panel-title">Seguranca e acesso</div>
          <div className="dash-module-copy">MFA TOTP e OIDC Google Workspace com fluxo server-side, state e nonce.</div>
        </div>
        <span className="dash-panel-tag">admin-only</span>
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <div className="grid gap-3 rounded-lg border border-[var(--border)] p-4">
          <div className="dash-panel-title">MFA TOTP</div>
          <div className="dash-module-copy">Recovery codes aparecem somente no momento de verificacao; o secret nao fica persistido na tela.</div>
          <span className="dash-panel-tag">{mfaStatus}</span>
          <Button type="button" variant="panel" size="xl" onClick={setupMfa}>Iniciar setup MFA</Button>
        </div>
        <form className="grid gap-3 rounded-lg border border-[var(--border)] p-4" onSubmit={saveOidc}>
          <div className="dash-panel-title">SSO Google Workspace</div>
          <div className="grid gap-2">
            <Label htmlFor="oidc-issuer">Issuer OIDC</Label>
            <Input id="oidc-issuer" value={oidcForm.issuer} onChange={(event) => setOidcForm((current) => ({ ...current, issuer: event.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="oidc-client-id">Client ID OIDC</Label>
            <Input id="oidc-client-id" value={oidcForm.clientId} onChange={(event) => setOidcForm((current) => ({ ...current, clientId: event.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="oidc-client-credential">Credencial OIDC</Label>
            <Input id="oidc-client-credential" type="password" value={oidcForm.clientSecret} onChange={(event) => setOidcForm((current) => ({ ...current, clientSecret: event.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="oidc-hosted-domain">Dominio Google Workspace</Label>
            <Input id="oidc-hosted-domain" value={oidcForm.hostedDomain} onChange={(event) => setOidcForm((current) => ({ ...current, hostedDomain: event.target.value }))} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="panel" size="xl" disabled={!oidcForm.clientId.trim() || !oidcForm.clientSecret || !oidcForm.hostedDomain.trim()}>Salvar OIDC</Button>
            <span className="dash-panel-tag">{oidcStatus}</span>
          </div>
        </form>
      </div>
    </section>
  )
}

function GoogleDrivePanel() {
  const [auth, setAuth] = useState<GoogleDriveAuthorizeResponse | null>(null)
  const [items, setItems] = useState<GoogleDriveItem[]>([])
  const [status, setStatus] = useState('nao conectado')

  async function authorizeDrive() {
    try {
      const response = await streamgateApi.authorizeGoogleDrive()
      setAuth(response.data)
      setStatus('consentimento pendente')
      showSingletonToast('success', 'URL de autorizacao Google Drive gerada.')
    } catch (error) {
      showSingletonToast('error', humanizeOperationalError(error, 'Nao foi possivel iniciar Google Drive.'))
    }
  }

  async function listItems() {
    try {
      const response = await streamgateApi.listGoogleDriveItems()
      setItems(response.data)
      setStatus(response.data.length > 0 ? 'itens carregados' : 'sem itens')
    } catch (error) {
      setStatus('conexao expirada ou revogada')
      showSingletonToast('error', humanizeOperationalError(error, 'Nao foi possivel listar Google Drive.'))
    }
  }

  async function revokeDrive() {
    try {
      const response = await streamgateApi.revokeGoogleDrive()
      setItems([])
      setAuth(null)
      setStatus(response.data.status)
      showSingletonToast('success', 'Google Drive revogado.')
    } catch (error) {
      showSingletonToast('error', humanizeOperationalError(error, 'Nao foi possivel revogar Google Drive.'))
    }
  }

  return (
    <section className="dash-panel dash-module-card">
      <div className="dash-panel-head">
        <div>
          <div className="dash-panel-title">Google Drive delegated</div>
          <div className="dash-module-copy">OAuth delegated com escopo completo de Drive; refresh token fica criptografado somente no backend.</div>
        </div>
        <span className="dash-panel-tag">{status}</span>
      </div>
      <div className="grid gap-4 p-4">
        <div className="flex flex-wrap gap-2">
          <span className="dash-pill dash-pill--quarantine">Drive restricted scope</span>
          <span className="dash-pill dash-pill--neutral">file/folder ingestion</span>
          <span className="dash-pill dash-pill--neutral">OAuth delegated</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="panel" size="xl" onClick={authorizeDrive}>Autorizar Google Drive</Button>
          <Button type="button" variant="outline" size="xl" onClick={listItems}>Listar arquivos Drive</Button>
          <Button type="button" variant="outline" size="xl" onClick={revokeDrive}>Revogar Google Drive</Button>
          {auth ? <a className="dash-btn dash-btn--primary" href={auth.authorization_url} rel="noreferrer" target="_blank">Abrir consentimento</a> : null}
        </div>
        <div className="dash-table-scroll">
          <table className="dash-table">
            <thead><tr><th>Item</th><th>Tipo</th><th>MIME</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="name">{item.name}</td>
                  <td className="dim">{item.kind}</td>
                  <td className="dim">{item.mime_type}</td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr><td className="dim" colSpan={3}>Nenhum item carregado nesta sessao.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function SaasReadinessPanel() {
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

function ConnectorProfilesPanel() {
  const [profiles, setProfiles] = useState<ConnectorProfile[]>([])
  const [status, setStatus] = useState<'loading' | 'success' | 'empty' | 'error'>('loading')
  const [form, setForm] = useState({
    name: '',
    kind: 's3' as ConnectorKind,
    status: 'active' as ConnectorStatus,
    region: 'us-east-1',
    endpoint: '',
    bucket: '',
    accessKeyId: '',
    secretAccessKey: '',
    url: '',
    headerName: '',
    headerValue: '',
  })

  async function loadProfiles() {
    try {
      const response = await streamgateApi.listConnectorProfiles()
      const rows = Array.isArray(response.data) ? response.data : []
      setProfiles(rows)
      setStatus(rows.length > 0 ? 'success' : 'empty')
    } catch (error) {
      setStatus('error')
      showSingletonToast('error', humanizeOperationalError(error, 'Nao foi possivel carregar perfis de conectores.'))
    }
  }

  useEffect(() => {
    let mounted = true

    void streamgateApi.listConnectorProfiles()
      .then((response) => {
        if (!mounted) return
        const rows = Array.isArray(response.data) ? response.data : []
        setProfiles(rows)
        setStatus(rows.length > 0 ? 'success' : 'empty')
      })
      .catch((error) => {
        if (!mounted) return
        setStatus('error')
        showSingletonToast('error', humanizeOperationalError(error, 'Nao foi possivel carregar perfis de conectores.'))
      })

    return () => {
      mounted = false
    }
  }, [])

  async function createProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const name = form.name.trim()
    if (!name) return

    const settings = form.kind === 's3'
      ? {
          region: form.region.trim() || 'us-east-1',
          endpoint: form.endpoint.trim() || undefined,
          bucket: form.bucket.trim(),
        }
      : {
          url: form.url.trim(),
        }
    const secrets = form.kind === 's3'
      ? {
          access_key_id: form.accessKeyId.trim(),
          secret_access_key: form.secretAccessKey,
        }
      : form.headerName.trim() && form.headerValue
        ? { headers: { [form.headerName.trim()]: form.headerValue } }
        : {}

    try {
      await streamgateApi.createConnectorProfile({
        name,
        kind: form.kind,
        status: form.status,
        settings: compactRecord(settings),
        secrets,
        idempotencyKey: createIdempotencyKey('connector-profile'),
      })
      setForm((current) => ({
        ...current,
        name: '',
        bucket: '',
        accessKeyId: '',
        secretAccessKey: '',
        url: '',
        headerName: '',
        headerValue: '',
      }))
      showSingletonToast('success', 'Perfil de conector criado com segredos protegidos.')
      await loadProfiles()
    } catch (error) {
      showSingletonToast('error', humanizeOperationalError(error, 'Nao foi possivel criar o perfil de conector.'))
    }
  }

  async function testProfile(profile: ConnectorProfile) {
    try {
      const response = await streamgateApi.testConnectorProfile(profile.id)
      showSingletonToast('success', `Perfil ${profile.name}: ${response.data.status}.`)
    } catch (error) {
      showSingletonToast('error', humanizeOperationalError(error, 'Teste de perfil indisponivel.'))
    }
  }

  async function toggleProfile(profile: ConnectorProfile) {
    const nextStatus = profile.status === 'active' ? 'disabled' : 'active'
    try {
      await streamgateApi.updateConnectorProfile(profile.id, {
        status: nextStatus,
        idempotencyKey: createIdempotencyKey(`connector-profile-${profile.id}`),
      })
      await loadProfiles()
    } catch (error) {
      showSingletonToast('error', humanizeOperationalError(error, 'Nao foi possivel atualizar o perfil.'))
    }
  }

  return (
    <section className="dash-panel dash-module-card">
      <div className="dash-panel-head">
        <div>
          <div className="dash-panel-title">Perfis de conectores</div>
          <div className="dash-module-copy">
            Perfis S3/HTTP sao admin-only; secrets entram no backend criptografado e retornos ficam mascarados.
          </div>
        </div>
        <span className="dash-panel-tag">{status}</span>
      </div>

      <form className="grid gap-4 p-4" onSubmit={createProfile}>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="connector-profile-name">Nome do perfil</Label>
            <Input id="connector-profile-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="connector-kind">Tipo de conector</Label>
            <select id="connector-kind" className="input-shell" value={form.kind} onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value as ConnectorKind }))}>
              <option value="s3">s3</option>
              <option value="http">http</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="connector-status">Status</Label>
            <select id="connector-status" className="input-shell" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ConnectorStatus }))}>
              <option value="active">active</option>
              <option value="disabled">disabled</option>
            </select>
          </div>
        </div>

        {form.kind === 's3' ? (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="connector-region">Regiao S3</Label>
              <Input id="connector-region" value={form.region} onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="connector-endpoint">Endpoint S3</Label>
              <Input id="connector-endpoint" value={form.endpoint} onChange={(event) => setForm((current) => ({ ...current, endpoint: event.target.value }))} placeholder="https://s3.example.test" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="connector-bucket">Bucket S3</Label>
              <Input id="connector-bucket" value={form.bucket} onChange={(event) => setForm((current) => ({ ...current, bucket: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="connector-access-key">Access key</Label>
              <Input id="connector-access-key" value={form.accessKeyId} onChange={(event) => setForm((current) => ({ ...current, accessKeyId: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="connector-secret-key">Secret key</Label>
              <Input id="connector-secret-key" type="password" value={form.secretAccessKey} onChange={(event) => setForm((current) => ({ ...current, secretAccessKey: event.target.value }))} />
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="connector-url">URL base HTTP</Label>
              <Input id="connector-url" type="url" value={form.url} onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))} placeholder="https://data.example.test/orders.ndjson" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="connector-header-name">Header de autenticacao</Label>
              <Input id="connector-header-name" value={form.headerName} onChange={(event) => setForm((current) => ({ ...current, headerName: event.target.value }))} placeholder="Authorization" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="connector-header-value">Valor do header</Label>
              <Input id="connector-header-value" type="password" value={form.headerValue} onChange={(event) => setForm((current) => ({ ...current, headerValue: event.target.value }))} />
            </div>
          </div>
        )}

        <div className="text-mono text-[11px] text-[var(--text-dim)]">
          A resposta publica mostra apenas configuracao sanitizada; credenciais, URLs completas, bucket e object keys ficam fora da UI.
        </div>
        <Button type="submit" variant="panel" size="xl" disabled={!form.name.trim()}>
          Criar perfil
        </Button>
      </form>

      <div className="dash-table-scroll">
        <table className="dash-table">
          <thead><tr><th>Perfil</th><th>Tipo</th><th>Status</th><th>Config</th><th>Acoes</th></tr></thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td className="name">{profile.name}</td>
                <td className="dim">{profile.kind}</td>
                <td><span className="dash-pill dash-pill--neutral">{profile.status}</span></td>
                <td className="dim">{JSON.stringify(profile.settings)}</td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => testProfile(profile)}>Testar perfil</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => toggleProfile(profile)}>
                      {profile.status === 'active' ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

function compactRecord(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== ''),
  )
}

function parsePositiveInteger(value: string) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}
