import { ArrowUpRight, Check, Copy, Send, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { EmailPreview } from '../../components/patterns'
import { Button, Card, Input, Textarea, toast } from '../../components/primitives'
import { inviteDraft, wait } from '../../services/ai'
import { useStore } from '../../store/caseStore'
import { useCase } from '../../store/hooks'
import { PageHeader } from './WMLayout'

export function Invite() {
  const { caseId } = useParams()
  const c = useCase(caseId)
  const people = useStore((s) => s.people)
  const sendInvite = useStore((s) => s.sendInvite)
  const navigate = useNavigate()
  const draft = c ? inviteDraft(c.firstName, people[c.advisorId].name.split(' ')[0]) : undefined
  const [body, setBody] = useState(draft?.rough ?? '')
  const [phase, setPhase] = useState<'rough' | 'polishing' | 'diff' | 'final'>('rough')
  const [subject, setSubject] = useState('Before we meet — a few questions')
  const [copied, setCopied] = useState(false)
  if (!c || !draft) return <Navigate to="/wm" replace />

  const link = `${window.location.origin}/c/${c.token}`
  const emily = people[c.advisorId]
  const client = { id: c.clientId, name: `${c.firstName} ${c.lastName}`, role: 'client' as const }

  const polish = async () => {
    setPhase('polishing')
    await wait(900)
    setPhase('diff')
  }

  return (
    <div className="pb-16">
      <PageHeader eyebrow={`${c.firstName} ${c.lastName} · step 2 of 2`} title={`Invite ${c.firstName}`} />
      <div className="grid gap-4 px-10 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          {phase === 'diff' ? (
            <EmailPreview
              from={emily}
              to={[client]}
              subject={subject}
              rough={body}
              body={draft.polished}
              feedback
              footer={
                <>
                  <Button size="sm" variant="ghost" onClick={() => setPhase('rough')}>
                    Keep mine
                  </Button>
                  <Button
                    size="sm"
                    leading={<Check className="size-3.5" />}
                    onClick={() => {
                      setBody(draft.polished)
                      setPhase('final')
                    }}
                  >
                    Use this
                  </Button>
                </>
              }
            />
          ) : (
            <Card padding="lg" inner={10} className="flex flex-col gap-4">
              <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
              <Textarea label="Message" value={body} onChange={(e) => setBody(e.target.value)} className="[&_textarea]:min-h-56" />
              <div className="flex items-center gap-2">
                <Button variant="ai" leading={<Sparkles className={phase === 'polishing' ? 'size-4 animate-pulse' : 'size-4'} />} disabled={phase === 'polishing' || phase === 'final'} onClick={polish}>
                  {phase === 'polishing' ? 'Polishing…' : phase === 'final' ? 'Polished' : 'Polish with AI'}
                </Button>
                <span className="text-[13px] text-ink-4">Write it however you like. AI keeps your voice.</span>
              </div>
            </Card>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <Card padding="lg" inner={10} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[15px] font-medium text-ink">{c.firstName}’s private link</span>
              <span className="text-[13px] text-ink-3">Works on any device. Saves as they go.</span>
            </div>
            <Input
              value={link}
              readOnly
              onFocus={(e) => e.target.select()}
              trailing={
                <Button
                  size="sm"
                  variant="soft"
                  leading={copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  onClick={() => {
                    navigator.clipboard?.writeText(link)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1600)
                  }}
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              }
            />
            <Button
              size="lg"
              leading={<Send className="size-4" />}
              onClick={() => {
                sendInvite(c.id, { subject, body })
                toast(`Sent to ${c.firstName}`, { description: c.email, tone: 'success' })
                navigate(`/wm/c/${c.id}`)
              }}
            >
              Send invite
            </Button>
            <Button variant="ghost" trailing={<ArrowUpRight className="size-4" />} onClick={() => window.open(`/c/${c.token}`, 'client')}>
              Preview as {c.firstName}
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  )
}
