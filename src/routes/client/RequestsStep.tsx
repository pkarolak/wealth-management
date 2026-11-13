import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, FileUp, MessageSquareText } from 'lucide-react'
import { useState } from 'react'
import { Avatar, Button, toast } from '../../components/primitives'
import { sectionById } from '../../schema/onboarding'
import { documentKinds } from '../../services/ai'
import { useStore } from '../../store/caseStore'
import type { ClientCase, RequestItem } from '../../store/types'
import { guessDocKind, processDocument } from './actions'
import type { Step, StepNav } from './ClientApp'
import { StepFooter, StepHeader } from './StepChrome'

const ago = (ts: number) => {
  const m = Math.round((Date.now() - ts) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`
}

/** Everything the Wealth Manager asked for after the invite, in one place. */
export function RequestsStep({ c, nav }: { c: ClientCase; nav: StepNav }) {
  const advisor = useStore((s) => s.people[c.advisorId])
  const first = advisor.name.split(' ')[0]
  const open = c.requests.filter((r) => r.status === 'open')
  const done = c.requests.filter((r) => r.status === 'done')

  return (
    <div>
      <StepHeader
        eyebrow={open.length ? `${open.length} open · from ${first}` : `From ${first}`}
        title="Additional requests"
        description={`Things ${first} asked for after reviewing your answers. Each one takes a minute.`}
      />

      {open.length === 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-[18px] bg-success-soft p-4 text-[14px] text-ink-2">
          <Check className="size-4 shrink-0 text-success" />
          All caught up. {first} will let you know if anything else comes up.
        </div>
      )}

      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {open.map((r) => (
            <motion.div key={r.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
              <OpenRequest c={c} r={r} first={first} advisorName={advisor.name} advisorAvatar={advisor.avatar} onGo={(s) => nav.go(s)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {done.length > 0 && (
        <section className="mt-10 flex flex-col gap-3">
          <h2 className="text-[15px] font-medium text-ink">Done</h2>
          <div className="flex flex-col gap-1">
            {done.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-[14px]">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                  <Check className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1 truncate text-ink-2">{r.title}</span>
                <span className="truncate text-[13px] text-ink-4">{r.fulfilledNote ?? 'Done'}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <StepFooter onBack={nav.back} onNext={nav.next} hint={open.length ? 'You can answer these later too.' : undefined} />
    </div>
  )
}

function OpenRequest({ c, r, first, advisorName, advisorAvatar, onGo }: { c: ClientCase; r: RequestItem; first: string; advisorName: string; advisorAvatar?: string; onGo: (s: Step) => void }) {
  const [busy, setBusy] = useState(false)
  const isDoc = r.kind === 'document'
  const kind = guessDocKind(r.title)
  const file = documentKinds.find((d) => d.kind === kind)?.file ?? 'Statement.pdf'

  return (
    <div className="flex flex-col gap-4 rounded-[22px] bg-surface p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-advisor-soft text-advisor">
          {isDoc ? <FileUp className="size-[18px]" /> : <MessageSquareText className="size-[18px]" />}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[16px] text-ink">{r.title}</span>
          <span className="text-[13px] text-ink-4">
            {isDoc ? 'Document' : 'Question'}
            {r.sectionId && ` · ${sectionById[r.sectionId].short}`} · {ago(r.createdAt)}
          </span>
        </div>
      </div>
      {r.detail && (
        <div className="flex items-start gap-2.5 rounded-[14px] bg-muted/70 p-3">
          <Avatar name={advisorName} src={advisorAvatar} size="sm" />
          <p className="pt-0.5 text-[14px] leading-relaxed text-ink-2">
            <span className="font-medium text-ink">{first}: </span>
            {r.detail}
          </p>
        </div>
      )}
      <div className="flex justify-end">
        {isDoc ? (
          <Button
            leading={<FileUp className="size-4" />}
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              await processDocument(c.id, c.clientId, kind, file)
              setBusy(false)
              toast('Uploaded', { description: `${first} has been notified.`, tone: 'success' })
            }}
          >
            {busy ? 'Reading…' : 'Upload'}
          </Button>
        ) : (
          r.sectionId && (
            <Button variant="secondary" trailing={<ArrowRight className="size-4" />} onClick={() => onGo(r.sectionId as Step)}>
              Go to {sectionById[r.sectionId].short}
            </Button>
          )
        )}
      </div>
    </div>
  )
}
