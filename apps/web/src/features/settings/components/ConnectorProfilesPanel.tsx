import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { humanizeOperationalError } from '@/lib/operational-utils'
import {
  createIdempotencyKey,
  streamgateApi,
  type ConnectorKind,
  type ConnectorProfile,
  type ConnectorStatus,
} from '@/lib/streamgate-api'
import { showSingletonToast } from '@/lib/toast'

export function ConnectorProfilesPanel() {
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
    oauthConnectionId: '',
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

    let settings: Record<string, unknown> = {}
    let secrets: Record<string, unknown> = {}

    if (form.kind === 's3') {
      settings = {
        region: form.region.trim() || 'us-east-1',
        endpoint: form.endpoint.trim() || undefined,
        bucket: form.bucket.trim(),
      }
      secrets = {
        access_key_id: form.accessKeyId.trim(),
        secret_access_key: form.secretAccessKey,
      }
    } else if (form.kind === 'http') {
      settings = { url: form.url.trim() }
      secrets = form.headerName.trim() && form.headerValue
        ? { headers: { [form.headerName.trim()]: form.headerValue } }
        : {}
    } else if (form.kind === 'google_drive') {
      settings = { oauth_connection_id: form.oauthConnectionId.trim() }
      secrets = {}
    } else if (form.kind === 'oauth_delegated') {
      settings = { url: form.url.trim(), oauth_connection_id: form.oauthConnectionId.trim() }
      secrets = form.headerName.trim() && form.headerValue
        ? { headers: { [form.headerName.trim()]: form.headerValue } }
        : {}
    }

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
        oauthConnectionId: '',
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
              <option value="google_drive">google_drive</option>
              <option value="oauth_delegated">oauth_delegated</option>
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

        {form.kind === 's3' && (
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
        )}

        {(form.kind === 'http' || form.kind === 'oauth_delegated') && (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="connector-url">URL base HTTP</Label>
              <Input id="connector-url" type="url" value={form.url} onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))} placeholder="https://data.example.test/orders.ndjson" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="connector-header-name">Header extra</Label>
              <Input id="connector-header-name" value={form.headerName} onChange={(event) => setForm((current) => ({ ...current, headerName: event.target.value }))} placeholder="Authorization ou x-api-key" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="connector-header-value">Valor do header extra</Label>
              <Input id="connector-header-value" type="password" value={form.headerValue} onChange={(event) => setForm((current) => ({ ...current, headerValue: event.target.value }))} />
            </div>
          </div>
        )}

        {(form.kind === 'google_drive' || form.kind === 'oauth_delegated') && (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="grid gap-2 md:col-span-3">
              <Label htmlFor="connector-oauth-connection-id">OAuth Connection ID</Label>
              <Input id="connector-oauth-connection-id" value={form.oauthConnectionId} onChange={(event) => setForm((current) => ({ ...current, oauthConnectionId: event.target.value }))} placeholder="conn_xxxx" />
            </div>
          </div>
        )}

        <div className="text-mono text-[11px] text-[var(--text-dim)]">
          A resposta publica mostra apenas configuracao sanitizada; credenciais, URLs completas, bucket e object keys ficam fora da UI.
        </div>
        <Button type="submit" variant="panel" size="xl" disabled={!form.name.trim() || (['google_drive', 'oauth_delegated'].includes(form.kind) && !form.oauthConnectionId.trim())}>
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

function compactRecord(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== ''),
  )
}
