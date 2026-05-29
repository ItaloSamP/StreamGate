import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { humanizeOperationalError } from '@/lib/operational-utils'
import {
  createIdempotencyKey,
  streamgateApi,
  type OrganizationPayload,
} from '@/lib/streamgate-api'
import { showSingletonToast } from '@/lib/toast'

function parsePositiveInteger(value: string) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

export function OrganizationAdminPanel() {
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
