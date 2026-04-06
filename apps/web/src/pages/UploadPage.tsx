import { WorkspaceModule } from '@/components/app/workspace-module'
import { WorkspacePageFrame } from '@/components/app/workspace-page-frame'

export function UploadPage() {
  return (
    <WorkspacePageFrame pathname="/upload" eyebrow="Ingestao e entrada" title="Upload Center" primaryActionLabel="Novo upload">
      <WorkspaceModule
        title="Upload Center"
        description="Superficie pronta para acoplar URL assinada, validacao de arquivo, progresso e politicas de ingestao sem trocar o shell do workspace."
        highlights={[
          { label: 'Entrada oficial', value: 'signed upload', hint: 'Fluxo previsto para API + storage' },
          { label: 'Faixas de arquivo', value: 'CSV / JSON / Parquet', hint: 'Formatos ja assumidos pela linguagem do produto' },
          { label: 'Feedback de envio', value: 'live progress', hint: 'Estados locais e retry reservados no layout' },
        ]}
        checkpoints={[
          'CTA e area de ingestao ja reservados na navegacao autenticada.',
          'Slot dedicado para validacao de tamanho, checksum e tipo de arquivo.',
          'Surface pronta para trocar mock por contrato de upload sem redesenho.',
        ]}
      />
    </WorkspacePageFrame>
  )
}
