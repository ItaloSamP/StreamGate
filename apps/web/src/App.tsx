import { Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'

function App() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-start justify-center gap-6 px-6 py-20 md:px-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground">
          <Sparkles className="size-4 text-primary" />
          Frontend base pronto para prototipacao
        </div>
        <div className="max-w-3xl space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            StreamGate UI Foundation
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            Tailwind CSS v4 e shadcn/ui ja estao integrados neste projeto. A
            partir daqui, voce pode prototipar dashboards, fluxos de upload e
            estados operacionais com componentes reutilizaveis e tema
            consistente.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="lg">Comecar a modelar</Button>
          <Button size="lg" variant="outline">
            Explorar componentes
          </Button>
        </div>
      </section>
    </main>
  )
}

export default App
