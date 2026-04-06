import type { ReactNode } from 'react'

export function WorkspaceModule({
  title,
  description,
  highlights,
  checkpoints,
  children,
}: {
  title: string
  description: string
  highlights: { label: string; value: string; hint: string }[]
  checkpoints: string[]
  children?: ReactNode
}) {
  return (
    <div className="dash-content dash-content--module">
      <div className="dash-module-shell">
        <div className="dash-module-hero dash-panel">
          <div className="dash-panel-head">
            <div>
              <div className="dash-panel-title">{title}</div>
              <div className="dash-module-copy">{description}</div>
            </div>
            <span className="dash-panel-tag">Sprint 1 scaffold</span>
          </div>
        </div>

        <div className="dash-module-grid">
          {highlights.map((item) => (
            <div key={item.label} className="dash-panel dash-module-card">
              <div className="dash-module-label">{item.label}</div>
              <div className="dash-module-value">{item.value}</div>
              <div className="dash-module-hint">{item.hint}</div>
            </div>
          ))}
        </div>

        <div className="dash-grid-2 dash-grid-2--module">
          <div className="dash-panel dash-module-card">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Planejamento fechado</div>
              <span className="dash-panel-tag">Sprint 1</span>
            </div>
            <ul className="dash-module-list">
              {checkpoints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="dash-panel dash-module-card">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Estado de integracao</div>
              <span className="dash-panel-tag">Adapter-ready</span>
            </div>
            <div className="dash-module-note">
              A rota, o shell e os estados de interface ja estao fechados para receber contratos reais sem retrabalho estrutural.
            </div>
            <div className="dash-module-pill-row">
              <span className="dash-module-pill">loading</span>
              <span className="dash-module-pill">empty</span>
              <span className="dash-module-pill">error</span>
              <span className="dash-module-pill">success</span>
            </div>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}
