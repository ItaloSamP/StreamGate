import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { humanizeOperationalError } from '@/lib/operational-utils'
import { streamgateApi } from '@/lib/streamgate-api'
import { showSingletonToast } from '@/lib/toast'

export function SecurityAdminPanel() {
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
