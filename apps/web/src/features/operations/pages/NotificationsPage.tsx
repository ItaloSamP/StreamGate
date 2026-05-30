import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { WorkspacePageFrame } from '@/features/dashboard/components/workspace-page-frame'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDateTime, humanizeOperationalError } from '@/lib/operational-utils'
import { streamgateApi, type NotificationItem, type NotificationSettings } from '@/lib/streamgate-api'
import { showSingletonToast } from '@/lib/toast'

type TabKey = 'inbox' | 'archived' | 'rules'
type InboxFilter = 'active' | 'unread' | 'read'
type Severity = 'info' | 'alerta' | 'critico'

const EVENT_RULES: { pattern: RegExp; severity: Severity; channels: string; label: string }[] = [
  { pattern: /(failed|dlq)/i, severity: 'critico', channels: 'in-app, email, webhook', label: 'Falhas e DLQ' },
  { pattern: /(quarantine|retry|replay|resolve)/i, severity: 'alerta', channels: 'in-app, webhook', label: 'Operacao sensivel' },
  { pattern: /(artifact|completed|webhook_test)/i, severity: 'info', channels: 'in-app', label: 'Conclusao e artefatos' },
]

const DEFAULT_SETTINGS: NotificationSettings = {
  id: 'pending',
  user_id: 'pending',
  in_app_enabled: true,
  email_enabled: false,
  webhook_enabled: false,
  webhook_url: '',
  webhook_secret: null,
}

export function NotificationsPage() {
  const [tab, setTab] = useState<TabKey>('inbox')
  const [filter, setFilter] = useState<InboxFilter>('active')
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS)
  const [webhookReason, setWebhookReason] = useState('Validar canal de webhook.')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const listStatus = tab === 'archived' ? 'archived' : filter
  const visibleNotifications = useMemo(() => notifications, [notifications])

  useEffect(() => {
    let active = true

    async function load() {
      setStatus('loading')
      setErrorMessage(null)

      try {
        const [notificationResponse, settingsResponse] = await Promise.all([
          streamgateApi.listNotifications({ status: listStatus }),
          streamgateApi.getNotificationSettings(),
        ])

        if (!active) return
        setNotifications(notificationResponse.data)
        setSettings(settingsResponse.data)
        setSelectedIds([])
        setStatus('success')
      } catch (error) {
        if (!active) return
        setStatus('error')
        setErrorMessage(humanizeOperationalError(error, 'Nao foi possivel carregar notificacoes.'))
      }
    }

    load()

    return () => {
      active = false
    }
  }, [listStatus, reloadToken])

  async function mutateNotification(action: () => Promise<unknown>, success: string) {
    try {
      await action()
      showSingletonToast('success', success)
      setReloadToken((current) => current + 1)
    } catch (error) {
      showSingletonToast('error', humanizeOperationalError(error, 'Nao foi possivel atualizar a notificacao.'))
    }
  }

  async function saveSettings() {
    try {
      const response = await streamgateApi.updateNotificationSettings({
        inAppEnabled: settings.in_app_enabled,
        emailEnabled: settings.email_enabled,
        webhookEnabled: settings.webhook_enabled,
        webhookUrl: settings.webhook_url,
      })
      setSettings(response.data)
      showSingletonToast('success', 'Configuracoes de notificacao salvas.')
    } catch (error) {
      showSingletonToast('error', humanizeOperationalError(error, 'Nao foi possivel salvar canais.'))
    }
  }

  async function testWebhook() {
    if (webhookReason.trim().length < 10) {
      showSingletonToast('error', 'Informe um motivo operacional com pelo menos 10 caracteres.')
      return
    }

    await mutateNotification(
      () => streamgateApi.testWebhookNotification({ reason: webhookReason }),
      'Delivery de teste criado no outbox.',
    )
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id])
  }

  return (
    <WorkspacePageFrame pathname="/notifications" eyebrow="Inbox operacional" title="Notificacoes" primaryActionLabel="Atualizar" secondaryActionLabel="Regras">
      <div className="dash-content dash-content--module">
        <div className="dash-module-shell">
          <section className="dash-panel dash-module-card">
            <div className="dash-panel-head">
              <div>
                <div className="dash-panel-title">Centro de notificacoes</div>
                <div className="dash-module-copy">
                  Inbox in-app com severidade, acoes contextuais, arquivo controlado e canais email/webhook mascarados.
                </div>
              </div>
              <div className="dash-panel-right">
                <button type="button" className={`dash-tab ${tab === 'inbox' ? 'active' : ''}`} onClick={() => setTab('inbox')}>Inbox</button>
                <button type="button" className={`dash-tab ${tab === 'archived' ? 'active' : ''}`} onClick={() => setTab('archived')}>Arquivadas</button>
                <button type="button" className={`dash-tab ${tab === 'rules' ? 'active' : ''}`} onClick={() => setTab('rules')}>Regras e canais</button>
              </div>
            </div>
          </section>

          {tab === 'rules' ? (
            <RulesAndSettings
              settings={settings}
              setSettings={setSettings}
              webhookReason={webhookReason}
              setWebhookReason={setWebhookReason}
              onSave={saveSettings}
              onTestWebhook={testWebhook}
            />
          ) : (
            <section className="dash-panel dash-module-card">
              <div className="dash-panel-head">
                <div>
                  <div className="dash-panel-title">{tab === 'archived' ? 'Notificacoes arquivadas' : 'Inbox ativa'}</div>
                  <div className="dash-module-copy">
                    {tab === 'archived'
                      ? 'Arquivadas continuam sujeitas a expiracao configurada no backend.'
                      : 'Nao lidas recebem destaque e podem abrir contexto operacional quando metadata segura estiver disponivel.'}
                  </div>
                </div>
                <div className="dash-panel-right">
                  {tab === 'inbox' ? (
                    <select className="input-shell" value={filter} onChange={(event) => setFilter(event.target.value as InboxFilter)}>
                      <option value="active">Todas ativas</option>
                      <option value="unread">Nao lidas</option>
                      <option value="read">Lidas</option>
                    </select>
                  ) : null}
                  <Button type="button" variant="panel" size="sm" onClick={() => setReloadToken((current) => current + 1)}>Atualizar</Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-b border-[var(--border)] p-4">
                <Button type="button" variant="panel" size="sm" disabled={visibleNotifications.length === 0 || tab === 'archived'} onClick={() => mutateNotification(() => streamgateApi.markAllNotificationsRead(listStatus), 'Notificacoes visiveis marcadas como lidas.')}>
                  Marcar visiveis como lidas
                </Button>
                <Button type="button" variant="panel" size="sm" disabled={selectedIds.length === 0} onClick={() => mutateNotification(() => streamgateApi.bulkArchiveNotifications(selectedIds), 'Notificacoes selecionadas arquivadas.')}>
                  Arquivar selecionadas ({selectedIds.length})
                </Button>
              </div>

              {status === 'loading' ? <div className="p-5 text-mono text-[11px] text-[var(--text-dim)]">Carregando notificacoes...</div> : null}
              {status === 'error' ? <div className="p-5 text-mono text-[11px] text-[var(--signal-red)]">{errorMessage}</div> : null}
              {status === 'success' && visibleNotifications.length === 0 ? <div className="p-5 text-mono text-[11px] text-[var(--text-dim)]">Nenhuma notificacao neste filtro.</div> : null}
              {status === 'success' && visibleNotifications.length > 0 ? (
                <div className="flex flex-col gap-3 p-4">
                  {visibleNotifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      selected={selectedIds.includes(notification.id)}
                      onSelect={() => toggleSelected(notification.id)}
                      onRead={() => mutateNotification(() => streamgateApi.markNotificationRead(notification.id), 'Notificacao marcada como lida.')}
                      onArchive={() => mutateNotification(() => streamgateApi.archiveNotification(notification.id), 'Notificacao arquivada.')}
                      onUnarchive={() => mutateNotification(() => streamgateApi.unarchiveNotification(notification.id), 'Notificacao restaurada.')}
                      onDelete={() => {
                        if (window.confirm('Deletar esta notificacao antiga? Esta acao nao pode ser desfeita.')) {
                          void mutateNotification(() => streamgateApi.deleteNotification(notification.id), 'Notificacao deletada.')
                        }
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </section>
          )}
        </div>
      </div>
    </WorkspacePageFrame>
  )
}

function NotificationCard({
  notification,
  selected,
  onSelect,
  onRead,
  onArchive,
  onUnarchive,
  onDelete,
}: {
  notification: NotificationItem
  selected: boolean
  onSelect: () => void
  onRead: () => void
  onArchive: () => void
  onUnarchive: () => void
  onDelete: () => void
}) {
  const severity = severityForEvent(notification.event_name)
  const contextLink = contextLinkFor(notification)

  return (
    <article className={`dash-panel dash-module-card notification-card notification-card--${severity}`}>
      <div className="flex flex-wrap items-start gap-3">
        <input aria-label={`Selecionar ${notification.title}`} type="checkbox" checked={selected} onChange={onSelect} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`dash-pill notification-severity--${severity}`}>{severity}</span>
            <span className="dash-panel-tag">{notification.event_name}</span>
            <span className="dash-panel-tag">{notification.status}</span>
          </div>
          <h2 className="mt-3 text-base font-semibold text-white">{notification.title}</h2>
          <p className="dash-module-copy">{notification.body}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-mono text-[9px] text-[var(--text-faint)]">
            <span>criada {formatDateTime(notification.created_at)}</span>
            <span>expira {formatDateTime(notification.expires_at)}</span>
            <span>trace {notification.trace_id}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {contextLink ? <Link className="dash-btn" to={contextLink.href}>{contextLink.label}</Link> : null}
          {notification.status === 'unread' ? <Button type="button" variant="panel" size="sm" onClick={onRead}>Lida</Button> : null}
          {notification.status === 'archived' ? <Button type="button" variant="panel" size="sm" onClick={onUnarchive}>Restaurar</Button> : <Button type="button" variant="panel" size="sm" onClick={onArchive}>Arquivar</Button>}
          <Button type="button" variant="panel" size="sm" onClick={onDelete}>Deletar</Button>
        </div>
      </div>
    </article>
  )
}

function RulesAndSettings({
  settings,
  setSettings,
  webhookReason,
  setWebhookReason,
  onSave,
  onTestWebhook,
}: {
  settings: NotificationSettings
  setSettings: (settings: NotificationSettings) => void
  webhookReason: string
  setWebhookReason: (reason: string) => void
  onSave: () => void
  onTestWebhook: () => void
}) {
  return (
    <div className="dash-grid-2">
      <section className="dash-panel dash-module-card">
        <div className="dash-panel-head">
          <div>
            <div className="dash-panel-title">Regras de notificacao</div>
            <div className="dash-module-copy">Catalogo front-end para severidade visual e canais recomendados por evento.</div>
          </div>
        </div>
        <div className="flex flex-col gap-3 p-4">
          {EVENT_RULES.map((rule) => (
            <div key={rule.label} className="dash-module-card rounded-lg border border-[var(--border)]">
              <span className={`dash-pill notification-severity--${rule.severity}`}>{rule.severity}</span>
              <div className="mt-3 font-semibold text-white">{rule.label}</div>
              <div className="dash-module-copy">Padrao: {rule.pattern.source} | canais: {rule.channels}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="dash-panel dash-module-card">
        <div className="dash-panel-head">
          <div>
            <div className="dash-panel-title">Canais</div>
            <div className="dash-module-copy">Webhook secret permanece mascarado; teste cria delivery pendente no outbox.</div>
          </div>
        </div>
        <div className="flex flex-col gap-4 p-4">
          <ToggleRow label="In-app" checked={settings.in_app_enabled} onChange={(checked) => setSettings({ ...settings, in_app_enabled: checked })} />
          <ToggleRow label="Email" checked={settings.email_enabled} onChange={(checked) => setSettings({ ...settings, email_enabled: checked })} />
          <ToggleRow label="Webhook" checked={settings.webhook_enabled} onChange={(checked) => setSettings({ ...settings, webhook_enabled: checked })} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <Input id="webhook-url" value={settings.webhook_url ?? ''} placeholder="https://hooks.example.test/streamgate" onChange={(event) => setSettings({ ...settings, webhook_url: event.target.value })} />
            <div className="dash-module-hint">Secret: [masked]</div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="webhook-reason">Motivo do teste</Label>
            <Input id="webhook-reason" value={webhookReason} onChange={(event) => setWebhookReason(event.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="panel" onClick={onSave}>Salvar canais</Button>
            <Button type="button" variant="panel" onClick={onTestWebhook} disabled={!settings.webhook_enabled}>Testar webhook</Button>
          </div>
        </div>
      </section>
    </div>
  )
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3 text-sm text-white">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  )
}

function severityForEvent(eventName: string): Severity {
  return EVENT_RULES.find((rule) => rule.pattern.test(eventName))?.severity ?? 'info'
}

function contextLinkFor(notification: NotificationItem): { href: string; label: string } | null {
  const metadata = notification.metadata ?? {}
  const jobId = stringMetadata(metadata, 'job_id')
  const artifactId = stringMetadata(metadata, 'artifact_id')
  const auditId = stringMetadata(metadata, 'audit_id')
  const messageId = stringMetadata(metadata, 'message_id')

  if (artifactId && jobId) return { href: `/jobs/${jobId}`, label: 'Ver artefatos' }
  if (jobId) return { href: `/jobs/${jobId}`, label: 'Abrir job' }
  if (messageId) return { href: `/operations?message_id=${encodeURIComponent(messageId)}`, label: 'Abrir operacao' }
  if (auditId) return { href: `/audit/${auditId}`, label: 'Ver auditoria' }
  if (/retry|replay|resolve|dlq/i.test(notification.event_name)) return { href: '/operations', label: 'Operacoes' }

  return null
}

function stringMetadata(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}
