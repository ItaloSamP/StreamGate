import { useEffect, useMemo, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'

import { WorkspacePageFrame } from '@/components/app/workspace-page-frame'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/auth-context'
import { formatDateTime, humanizeOperationalError } from '@/lib/operational-utils'
import {
  streamgateApi,
  type DlqMessage,
  type DlqReplayRequest,
  type JobSummary,
  type QuarantineRecord,
} from '@/lib/streamgate-api'
import { showSingletonToast } from '@/lib/toast'

type OperationKind = 'retry' | 'resolve' | 'replay'
type Step = 'target' | 'review' | 'confirm' | 'result'

const OPERATION_COPY: Record<OperationKind, { title: string; targetLabel: string; rules: string[] }> = {
  retry: {
    title: 'Retry de job',
    targetLabel: 'Job ID',
    rules: ['Admin-only', 'Motivo obrigatorio', 'Idempotency-Key por tentativa', 'Backend aplica cooldown e limite diario'],
  },
  resolve: {
    title: 'Resolve de quarentena',
    targetLabel: 'Quarantine ID',
    rules: ['Admin-only', 'Registro nao pode estar resolvido', 'Motivo obrigatorio', 'Auditoria gerada no backend'],
  },
  replay: {
    title: 'Replay DLQ aprovado',
    targetLabel: 'Message ID',
    rules: ['Admin-only', 'Solicitacao, aprovacao e execucao separadas', 'Self-approval bloqueado pelo backend', 'Payload precisa ter rastreabilidade minima'],
  },
}

export function OperationsPage() {
  const { session } = useAuth()
  const [searchParams] = useSearchParams()
  const [operation, setOperation] = useState<OperationKind>('retry')
  const [step, setStep] = useState<Step>('target')
  const [targetId, setTargetId] = useState(searchParams.get('message_id') ?? '')
  const [reason, setReason] = useState('Acao operacional revisada e aprovada.')
  const [jobs, setJobs] = useState<JobSummary[]>([])
  const [quarantine, setQuarantine] = useState<QuarantineRecord[]>([])
  const [dlq, setDlq] = useState<DlqMessage[]>([])
  const [replayRequest, setReplayRequest] = useState<DlqReplayRequest | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const selectedCopy = OPERATION_COPY[operation]
  const selectedDlqMessage = useMemo(() => {
    const parsedIndex = Number.parseInt(targetId.replace(/^dlq-/, ''), 10)
    if (Number.isFinite(parsedIndex)) return dlq[parsedIndex] ?? null
    return dlq.find((message, index) => dlqMessageId(message, index) === targetId || message.headers?.message_id === targetId || message.routing_key === targetId) ?? null
  }, [dlq, targetId])

  useEffect(() => {
    let active = true

    async function loadTargets() {
      try {
        const [jobsResponse, quarantineResponse, dlqResponse] = await Promise.all([
          streamgateApi.listJobs({ page: 1, per_page: 8 }),
          streamgateApi.listQuarantine({ page: 1, per_page: 8 }),
          streamgateApi.listQuarantineDlq({ page: 1, per_page: 8, sort_by: 'retry_count', sort_order: 'desc' }),
        ])

        if (!active) return
        setJobs(jobsResponse.data)
        setQuarantine(quarantineResponse.data)
        setDlq(dlqResponse.data)
      } catch {
        if (active) setErrorMessage('Nao foi possivel carregar alvos recentes. Cole o ID manualmente.')
      }
    }

    loadTargets()

    return () => {
      active = false
    }
  }, [])

  if (session?.user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  function chooseOperation(next: OperationKind) {
    setOperation(next)
    setStep('target')
    setReplayRequest(null)
    setResult(null)
    setErrorMessage(null)
  }

  function goReview() {
    if (targetId.trim().length < 3) {
      setErrorMessage('Informe ou selecione um alvo valido.')
      return
    }

    setErrorMessage(null)
    setStep('review')
  }

  function goConfirm() {
    if (reason.trim().length < 10) {
      setErrorMessage('Motivo obrigatorio com pelo menos 10 caracteres.')
      return
    }

    setErrorMessage(null)
    setStep('confirm')
  }

  async function executeOperation() {
    setLoading(true)
    setErrorMessage(null)

    try {
      if (operation === 'retry') {
        const response = await streamgateApi.retryJob(targetId.trim(), { reason })
        setResult(`Retry solicitado: ${response.data.status} | attempt ${response.data.attempt_id ?? '--'}`)
      } else if (operation === 'resolve') {
        const response = await streamgateApi.resolveQuarantine(targetId.trim(), { reason })
        setResult(`Quarentena ${response.data.id} marcada como ${response.data.resolution_status}.`)
      } else {
        const payload = typeof selectedDlqMessage?.payload === 'object' && selectedDlqMessage.payload !== null
          ? selectedDlqMessage.payload as Record<string, unknown>
          : {}
        const created = await streamgateApi.createDlqReplayRequest(targetId.trim(), { reason, payload })
        setReplayRequest(created.data)
        setResult(`Solicitacao de replay criada: ${created.data.id} (${created.data.status}).`)
      }

      setStep('result')
      showSingletonToast('success', 'Operacao registrada com sucesso.')
    } catch (error) {
      setErrorMessage(humanizeOperationalError(error, 'Operacao recusada pelo backend.'))
      showSingletonToast('error', humanizeOperationalError(error, 'Operacao recusada pelo backend.'))
    } finally {
      setLoading(false)
    }
  }

  async function advanceReplay(action: 'approve' | 'execute') {
    if (!replayRequest) return

    setLoading(true)
    setErrorMessage(null)

    try {
      const response = action === 'approve'
        ? await streamgateApi.approveDlqReplayRequest(replayRequest.id, { reason })
        : await streamgateApi.executeDlqReplayRequest(replayRequest.id, { reason })
      setReplayRequest(response.data)
      setResult(`Replay ${response.data.id}: ${response.data.status}.`)
      showSingletonToast('success', `Replay ${action === 'approve' ? 'aprovado' : 'executado'}.`)
    } catch (error) {
      setErrorMessage(humanizeOperationalError(error, action === 'approve' ? 'Aprovacao recusada.' : 'Execucao recusada.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <WorkspacePageFrame pathname="/operations" eyebrow="Governanca operacional" title="Operacoes Seguras" primaryActionLabel="Executar" secondaryActionLabel="Auditar">
      <div className="dash-content dash-content--module">
        <div className="dash-module-shell">
          <section className="dash-panel dash-module-card">
            <div className="dash-panel-head">
              <div>
                <div className="dash-panel-title">Wizard admin-only</div>
                <div className="dash-module-copy">Retry, resolve e replay DLQ com motivo obrigatorio, confirmacao e idempotencia no backend.</div>
              </div>
              <div className="dash-panel-right">
                {(['retry', 'resolve', 'replay'] as OperationKind[]).map((entry) => (
                  <button key={entry} type="button" className={`dash-tab ${operation === entry ? 'active' : ''}`} onClick={() => chooseOperation(entry)}>
                    {OPERATION_COPY[entry].title}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <div className="dash-grid-2">
            <section className="dash-panel dash-module-card">
              <div className="dash-panel-head">
                <div>
                  <div className="dash-panel-title">{selectedCopy.title}</div>
                  <div className="dash-module-copy">Etapa atual: {step}</div>
                </div>
              </div>
              <div className="flex flex-col gap-4 p-4">
                {step === 'target' ? (
                  <>
                    <TargetPicker operation={operation} jobs={jobs} quarantine={quarantine} dlq={dlq} targetId={targetId} setTargetId={setTargetId} />
                    <Button type="button" variant="panel" onClick={goReview}>Revisar regras</Button>
                  </>
                ) : null}

                {step === 'review' ? (
                  <>
                    <div className="dash-module-card rounded-lg border border-[var(--border)]">
                      <div className="dash-module-label">{selectedCopy.targetLabel}</div>
                      <div className="dash-module-value text-base">{targetId}</div>
                      <ul className="dash-module-list">
                        {selectedCopy.rules.map((rule) => <li key={rule}>{rule}</li>)}
                      </ul>
                    </div>
                    <Button type="button" variant="panel" onClick={goConfirm}>Informar motivo</Button>
                  </>
                ) : null}

                {step === 'confirm' ? (
                  <>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="operation-reason">Motivo operacional</Label>
                      <Input id="operation-reason" value={reason} onChange={(event) => setReason(event.target.value)} />
                    </div>
                    <div className="rounded-lg border border-[rgba(224,92,92,0.35)] bg-[rgba(224,92,92,0.08)] p-3 text-mono text-[10px] text-[var(--signal-red)]">
                      Confirme apenas se o alvo foi revisado. A acao sera auditada.
                    </div>
                    <Button type="button" variant="panel" disabled={loading} onClick={executeOperation}>
                      {loading ? 'Executando...' : 'Confirmar operacao'}
                    </Button>
                  </>
                ) : null}

                {step === 'result' ? (
                  <>
                    <div className="dash-module-card rounded-lg border border-[var(--border)]">
                      <div className="dash-panel-title">Resultado</div>
                      <div className="dash-module-copy">{result}</div>
                      {replayRequest ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="dash-panel-tag">status {replayRequest.status}</span>
                          <span className="dash-panel-tag">trace {replayRequest.trace_id}</span>
                          <span className="dash-panel-tag">expira {formatDateTime(replayRequest.expires_at)}</span>
                        </div>
                      ) : null}
                    </div>
                    {replayRequest ? (
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="panel" disabled={loading || replayRequest.status !== 'requested'} onClick={() => void advanceReplay('approve')}>Aprovar replay</Button>
                        <Button type="button" variant="panel" disabled={loading || replayRequest.status !== 'approved'} onClick={() => void advanceReplay('execute')}>Executar replay</Button>
                      </div>
                    ) : null}
                    <Button type="button" variant="panel" onClick={() => setStep('target')}>Nova operacao</Button>
                  </>
                ) : null}

                {errorMessage ? <div className="text-mono text-[11px] text-[var(--signal-red)]">{errorMessage}</div> : null}
              </div>
            </section>

            <section className="dash-panel dash-module-card">
              <div className="dash-panel-head">
                <div>
                  <div className="dash-panel-title">Contexto e bloqueios</div>
                  <div className="dash-module-copy">Busca recente reduz erro manual, mas o ID colado continua sendo a fonte da acao.</div>
                </div>
              </div>
              <ul className="dash-module-list">
                <li>Operadores nao acessam esta rota.</li>
                <li>Retry e resolve sao diretos, sempre com motivo.</li>
                <li>Replay DLQ exige solicitacao, aprovacao e execucao.</li>
                <li>Self-approval e estados invalidos sao recusados pelo backend.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </WorkspacePageFrame>
  )
}

function TargetPicker({
  operation,
  jobs,
  quarantine,
  dlq,
  targetId,
  setTargetId,
}: {
  operation: OperationKind
  jobs: JobSummary[]
  quarantine: QuarantineRecord[]
  dlq: DlqMessage[]
  targetId: string
  setTargetId: (targetId: string) => void
}) {
  const options = operation === 'retry'
    ? jobs.map((job) => ({ id: job.id, label: `${job.id} | ${job.status}` }))
    : operation === 'resolve'
      ? quarantine.map((record) => ({ id: record.id, label: `${record.id} | ${record.severity}` }))
      : dlq.map((message, index) => ({ id: dlqMessageId(message, index), label: `dlq-${index} | ${message.dead_letter_reason ?? message.routing_key}` }))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="operation-target">Buscar ou colar alvo</Label>
        <Input id="operation-target" value={targetId} onChange={(event) => setTargetId(event.target.value)} placeholder="Cole o ID ou selecione abaixo" />
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button key={option.id} type="button" className="dash-panel-tag" onClick={() => setTargetId(option.id)}>
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function dlqMessageId(message: DlqMessage, index: number) {
  const payload = typeof message.payload === 'object' && message.payload !== null ? message.payload : {}
  const eventId = (payload as Record<string, unknown>).event_id
  return typeof eventId === 'string' && eventId.length > 0 ? eventId : String(index)
}
