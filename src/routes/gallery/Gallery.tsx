import { ArrowRight, Plus, Search, Sparkles } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  Avatar,
  AvatarStack,
  Badge,
  Button,
  Card,
  CardHeader,
  Checkbox,
  Chip,
  ChipGroup,
  CountDot,
  DateInput,
  Dialog,
  MoneyInput,
  PercentInput,
  RadioGroup,
  Switch,
  IconButton,
  Input,
  PersonChip,
  Popover,
  ProgressBar,
  RadioCard,
  Segmented,
  Select,
  StatusIcon,
  Textarea,
  Tooltip,
  YesNo,
  toast,
} from '../../components/primitives'
import { PatternsGallery } from './PatternsGallery'

export function GallerySection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2 className="mb-4 text-[13px] font-medium tracking-wide text-ink-3 uppercase">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

export function Specimen({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <Card padding="md" className={className}>
      <div className="mb-3 text-[12px] text-ink-4">{label}</div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </Card>
  )
}

const swatches: [string, string][] = [
  ['canvas', 'bg-canvas'],
  ['surface', 'bg-surface'],
  ['muted', 'bg-muted'],
  ['sunken', 'bg-sunken'],
  ['line', 'bg-line'],
  ['ink', 'bg-ink'],
  ['ink-3', 'bg-ink-3'],
  ['taupe-900', 'bg-taupe-900'],
  ['taupe-700', 'bg-taupe-700'],
  ['taupe-500', 'bg-taupe-500'],
  ['waiting', 'bg-waiting'],
  ['progress', 'bg-progress'],
  ['success', 'bg-success'],
  ['danger', 'bg-danger'],
  ['ai', 'bg-ai'],
  ['ai-soft', 'bg-ai-soft'],
  ['advisor', 'bg-advisor'],
  ['advisor-soft', 'bg-advisor-soft'],
]

export function Gallery() {
  const [seg, setSeg] = useState('individual')
  const [chips, setChips] = useState<string[]>(['salary'])
  const [checked, setChecked] = useState(true)
  const [radio, setRadio] = useState('b')
  const [yn, setYn] = useState<string>()
  const [sel, setSel] = useState<string>()
  const [dialog, setDialog] = useState(false)
  const [date, setDate] = useState('1985-03-14')
  const [amount, setAmount] = useState<number | undefined>(412380)
  const [rate, setRate] = useState<number | undefined>(3.1)
  const [sw, setSw] = useState(true)

  const nav = [
    ['tokens', 'Tokens'],
    ['buttons', 'Buttons'],
    ['inputs', 'Inputs'],
    ['choices', 'Choices'],
    ['display', 'Display'],
    ['overlays', 'Overlays'],
    ['patterns', 'Patterns'],
  ]

  return (
    <div className="mx-auto flex max-w-6xl gap-10 px-6 py-10">
      <aside className="sticky top-10 hidden h-fit w-44 shrink-0 flex-col gap-1 md:flex">
        <Link to="/" className="mb-6 text-[13px] text-ink-3 hover:text-ink">
          ← Demo home
        </Link>
        <div className="display mb-4 text-3xl">Components</div>
        {nav.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="rounded-lg px-2 py-1.5 text-[14px] text-ink-3 hover:bg-muted hover:text-ink">
            {label}
          </a>
        ))}
      </aside>

      <main className="flex min-w-0 flex-1 flex-col gap-12">
        <GallerySection id="tokens" title="Tokens">
          <Card>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {swatches.map(([name, cls]) => (
                <div key={name} className="flex flex-col gap-1.5">
                  <div className={`h-14 rounded-control border border-line ${cls}`} />
                  <span className="text-[12px] text-ink-3">{name}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div className="mb-3 text-[12px] text-ink-4">Radius rule: outer = inner + padding</div>
            <div className="flex flex-wrap items-end gap-6">
              {[
                { pad: 4, inner: 10, label: 'Menu 14 = 10 + 4' },
                { pad: 12, inner: 10, label: 'Popover 22 = 10 + 12' },
                { pad: 16, inner: 10, label: 'Card 26 = 10 + 16' },
                { pad: 24, inner: 10, label: 'Dialog 34 = 10 + 24' },
                { pad: 16, inner: 0, label: 'Text-only card 16 = 0 + 16' },
              ].map(({ pad, inner, label }) => (
                <div key={label} className="flex flex-col gap-2">
                  <div className="border border-line-strong bg-muted" style={{ padding: pad, borderRadius: inner + pad }}>
                    <div className="h-10 w-24 border border-line bg-surface" style={{ borderRadius: inner }} />
                  </div>
                  <span className="text-[12px] text-ink-3">{label}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div className="flex flex-col gap-3">
              <div className="display text-5xl">Display / 48 serif</div>
              <div className="display text-3xl">Title / 30 serif</div>
              <div className="text-xl font-medium">Heading / 20 medium</div>
              <div className="text-[15px] font-medium">Label / 15 medium</div>
              <div className="text-[15px] text-ink-2">Body / 15 regular — Hi Daniel, hope you are well.</div>
              <div className="text-[13px] text-ink-3">Caption / 13 regular</div>
              <div className="tabular text-3xl font-medium">$2,184,560</div>
            </div>
          </Card>
        </GallerySection>

        <GallerySection id="buttons" title="Buttons">
          <Specimen label="Variants">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="soft">Soft</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="ai" leading={<Sparkles className="size-4" />}>
              Explain
            </Button>
            <Button variant="danger">Remove</Button>
            <Button disabled>Disabled</Button>
          </Specimen>
          <Specimen label="Sizes and icons">
            <Button size="sm" leading={<Plus className="size-3.5" />}>
              Small
            </Button>
            <Button trailing={<ArrowRight className="size-4" />}>Continue</Button>
            <Button size="lg">Large</Button>
            <IconButton label="Search">
              <Search className="size-4" />
            </IconButton>
            <IconButton label="Add" variant="soft">
              <Plus className="size-4" />
            </IconButton>
            <IconButton label="Send" variant="primary">
              <ArrowRight className="size-4" />
            </IconButton>
          </Specimen>
        </GallerySection>

        <GallerySection id="inputs" title="Inputs">
          <Card>
            <div className="mb-4 text-[12px] text-ink-4">Floating labels: placeholder-size when empty, shrink to the top on focus or value</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="First name" />
              <Input label="Last name" defaultValue="Tan" />
              <Input label="Occupation" tone="ai" defaultValue="Product Director" />
              <Input label="Employer" tone="advisor" defaultValue="Lumen Health, Inc." />
              <Select
                label="Employment status"
                value={sel}
                onChange={setSel}
                options={[
                  { value: 'employed', label: 'Employed' },
                  { value: 'self', label: 'Self-employed' },
                  { value: 'retired', label: 'Retired' },
                ]}
              />
              <DateInput label="Date of birth" value={date} onChange={setDate} />
              <MoneyInput label="Current value" value={amount} onChange={setAmount} />
              <PercentInput label="Interest rate" value={rate} onChange={setRate} />
              <Textarea label="Anything you'd like your Wealth Manager to know?" className="sm:col-span-2" />
            </div>
          </Card>
          <Specimen label="Compact (toolbar and search)">
            <Input leading={<Search className="size-4" />} placeholder="Search clients" className="w-72" />
            <div className="w-48">
              <Select value={sel} onChange={setSel} placeholder="Filter" options={[{ value: 'employed', label: 'Employed' }, { value: 'retired', label: 'Retired' }]} />
            </div>
          </Specimen>
        </GallerySection>

        <GallerySection id="choices" title="Choices">
          <Specimen label="Segmented">
            <Segmented
              value={seg}
              onChange={setSeg}
              options={[
                { value: 'individual', label: 'Individual' },
                { value: 'joint', label: 'Joint' },
              ]}
            />
            <YesNo value={yn} onChange={setYn} />
          </Specimen>
          <Specimen label="Chips">
            <ChipGroup
              value={chips}
              onChange={setChips}
              options={[
                { value: 'salary', label: 'Salary & savings' },
                { value: 'gains', label: 'Investment gains' },
                { value: 'inheritance', label: 'Inheritance' },
                { value: 'business', label: 'Sale of a business' },
              ]}
            />
            <Chip>Unselected</Chip>
          </Specimen>
          <Specimen label="Checkbox and radio cards" className="[&>div:last-child]:flex-col [&>div:last-child]:items-stretch">
            <Checkbox checked={checked} onChange={setChecked} label="I certify that my taxpayer ID is correct" description="Required by the IRS on Form W-9." />
            <div className="flex flex-wrap items-start gap-10">
              <RadioGroup
                value={radio}
                onChange={setRadio}
                options={[
                  { value: 'a', label: 'Monthly', description: 'A short check-in each month' },
                  { value: 'b', label: 'Quarterly' },
                ]}
              />
              <Switch checked={sw} onChange={setSw} label="Email me when Emily replies" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <RadioCard selected={radio === 'a'} onSelect={() => setRadio('a')} title="Sell some" description="Move part of it to cash until things calm down." />
              <RadioCard selected={radio === 'b'} onSelect={() => setRadio('b')} title="Hold steady" description="Stay the course. Markets recover over time." />
            </div>
          </Specimen>
        </GallerySection>

        <GallerySection id="display" title="Display">
          <Specimen label="Status icons (waiting, in progress, done, attention, idle)">
            <StatusIcon status="waiting" />
            <StatusIcon status="progress" />
            <StatusIcon status="done" />
            <StatusIcon status="attention" />
            <StatusIcon status="idle" />
            <StatusIcon status="waiting" faded />
          </Specimen>
          <Specimen label="Badges">
            <Badge>Neutral</Badge>
            <Badge tone="ai" icon={<Sparkles className="size-3" />}>
              AI suggestion
            </Badge>
            <Badge tone="advisor">Suggested by Emily</Badge>
            <Badge tone="waiting">Waiting on client</Badge>
            <Badge tone="progress">In review</Badge>
            <Badge tone="success">Confirmed</Badge>
            <Badge tone="danger">Needs review</Badge>
            <Badge tone="ink">Required</Badge>
            <CountDot count={3} />
          </Specimen>
          <Specimen label="Avatars and people">
            <Avatar name="Emily Parker" size="lg" online />
            <Avatar name="Daniel Tan" size="md" />
            <Avatar name="Mike Whiteaker" size="sm" />
            <AvatarStack size="md" people={[{ name: 'Emily Parker' }, { name: 'Mike Whiteaker' }, { name: 'Daniel Tan' }, { name: 'Grace Tan' }]} />
            <AvatarStack people={[{ name: 'Emily Parker' }, { name: 'Mike Whiteaker' }, { name: 'Daniel Tan' }, { name: 'Grace Tan' }]} />
            <PersonChip name="Emily Parker" />
          </Specimen>
          <Specimen label="Progress">
            <div className="flex w-full flex-col gap-3">
              <ProgressBar value={64} />
              <ProgressBar value={30} tone="waiting" />
            </div>
          </Specimen>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card inner={0}>
              <CardHeader title="Surface card" subtitle="Default container" />
            </Card>
            <Card tone="muted" inner={0}>
              <CardHeader title="Muted card" subtitle="Secondary grouping" />
            </Card>
            <Card tone="faded" inner={0}>
              <CardHeader title="Faded card" subtitle="Lower priority, like the reference kanban" />
            </Card>
          </div>
        </GallerySection>

        <GallerySection id="overlays" title="Overlays">
          <Specimen label="Tooltip, popover, dialog, toast">
            <Tooltip content="We ask this because the IRS requires it.">
              <Button variant="secondary">Hover me</Button>
            </Tooltip>
            <Popover trigger={<Button variant="secondary">Popover</Button>}>
              <div className="flex flex-col gap-3">
                <div className="px-1 pt-1 text-[14px] text-ink-2">Popovers hold explanations and comment threads.</div>
                <Input placeholder="Reply…" />
              </div>
            </Popover>
            <Button variant="secondary" onClick={() => setDialog(true)}>
              Dialog
            </Button>
            <Button variant="secondary" onClick={() => toast('Saved', { description: 'Your progress is safe.', tone: 'success' })}>
              Toast
            </Button>
            <Dialog
              open={dialog}
              onOpenChange={setDialog}
              title="Link an account"
              description="Securely connect to pull balances automatically."
              footer={<Button onClick={() => setDialog(false)}>Done</Button>}
            >
              <p className="text-[14px] text-ink-2">Dialog body.</p>
            </Dialog>
          </Specimen>
        </GallerySection>

        <PatternsGallery />
      </main>
    </div>
  )
}
