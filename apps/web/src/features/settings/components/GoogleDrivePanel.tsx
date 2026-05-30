import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { humanizeOperationalError } from '@/lib/operational-utils'
import { streamgateApi, type GoogleDriveAuthorizeResponse, type GoogleDriveItem } from '@/lib/streamgate-api'
import { showSingletonToast } from '@/lib/toast'

export function GoogleDrivePanel() {
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
