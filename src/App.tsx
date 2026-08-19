import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  readSelectedProfile,
  rememberSelectedProfile,
  type CompetitionHome,
  type Profile,
} from './competition'
import {
  CompetitionLoadError,
  createPredictionStore,
  loadCompetitionHome,
  type CompetitionLoader,
  type LoadFailureKind,
  type PredictionStore,
} from './supabase'
import {
  answeredCount,
  clubNameById,
  cupQuestions,
  emptyPredictions,
  initialTableOrder,
  leagueQuestions,
  moveClub,
  normalizeManualAnswer,
  parseWholeNumber,
  PredictionDataError,
  SCORING_ALLOCATION,
  SCORING_TOTAL,
  suggestionCatalog,
  type ClubId,
  type PredictionPayload,
  type ScoreAnswer,
} from './predictions'

const workspaceTabs = [
  'Premier League table',
  'Cup winners',
  'Premier League questions',
  'Review & lock',
] as const

const compactTabLabel: Record<(typeof workspaceTabs)[number], string> = {
  'Premier League table': 'Table',
  'Cup winners': 'Cups',
  'Premier League questions': 'Questions',
  'Review & lock': 'Review',
}

function PersonIcon({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle cx="12" cy="8" r="3.25" />
    <path d="M5.75 19.25c.55-3.65 2.63-5.5 6.25-5.5s5.7 1.85 6.25 5.5" />
  </svg>
}

function GripIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
    <circle cx="7" cy="5" r="1" /><circle cx="13" cy="5" r="1" />
    <circle cx="7" cy="10" r="1" /><circle cx="13" cy="10" r="1" />
    <circle cx="7" cy="15" r="1" /><circle cx="13" cy="15" r="1" />
  </svg>
}

function ArrowIcon({ direction }: { direction: 'up' | 'down' }) {
  return <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
    <path d={direction === 'up' ? 'M5.5 12.5 10 8l4.5 4.5' : 'm5.5 7.5 4.5 4.5 4.5-4.5'} />
  </svg>
}

type ViewState =
  | { phase: 'loading' }
  | { phase: 'ready'; competition: CompetitionHome }
  | { phase: 'error'; kind: LoadFailureKind; attempts: number }

function LoadingState() {
  return (
    <section className="state-card" aria-live="polite" aria-busy="true">
      <span className="loading-mark" aria-hidden="true" />
      <h2>Loading Jerry</h2>
      <p>Getting the latest predictions…</p>
    </section>
  )
}

function ErrorState({
  kind,
  attempts,
  onRetry,
}: {
  kind: LoadFailureKind
  attempts: number
  onRetry: () => void
}) {
  const content = {
    configuration: {
      title: 'Jerry is not connected yet',
      body: 'The shared competition data has not been set up for this build.',
    },
    empty: {
      title: 'No competition found',
      body: 'The competition and its four profiles are missing.',
    },
    invalid: {
      title: 'Jerry needs attention',
      body: 'Some competition data is incomplete. Nothing has been changed.',
    },
    unavailable: {
      title: 'Jerry cannot load right now',
      body:
        attempts > 1
          ? 'It is still unavailable. Keshav may need to restart the competition service.'
          : 'Check your connection and try again. Your saved predictions are unchanged.',
    },
  }[kind]

  return (
    <section className="state-card error-card" role="alert">
      <h2>{content.title}</h2>
      <p>{content.body}</p>
      {kind !== 'configuration' && (
        <button className="primary-button" type="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </section>
  )
}

function ProfileCard({ profile, onSelect }: { profile: Profile; onSelect: () => void }) {
  return (
    <li>
      <button
        aria-label={`Continue as ${profile.name}`}
        aria-describedby={`profile-status-${profile.id}`}
        className={`profile-card accent-${profile.accent} ${profile.status === 'Locked' ? 'is-locked' : ''}`}
        type="button"
        onClick={onSelect}
      >
        <span className="profile-avatar" aria-hidden="true">
          <PersonIcon />
        </span>
        <span className="profile-copy">
          <span className="profile-name">{profile.name}</span>
          <span className="profile-status" id={`profile-status-${profile.id}`}>{profile.status}</span>
        </span>
        <span className="profile-action" aria-hidden="true">
          Choose
        </span>
      </button>
    </li>
  )
}

function CompetitionHomeView({
  competition,
  onSelect,
}: {
  competition: CompetitionHome
  onSelect: (profile: Profile) => void
}) {
  const lockedCount = competition.profiles.filter(({ status }) => status === 'Locked').length
  return (
    <section className="room-card" aria-labelledby="product-title">
      <header className="room-header">
        <h1 id="product-title">{competition.title}</h1>
        <p className="competition-subtitle">{competition.subtitle}</p>
      </header>

      <div className="selection-heading">
        <h2>Choose your profile</h2>
        <p className="lock-count">{lockedCount} of 4 locked</p>
      </div>

      <ul className="profile-grid" aria-label="Competition profiles">
        {competition.profiles.map((profile) => (
          <ProfileCard key={profile.id} profile={profile} onSelect={() => onSelect(profile)} />
        ))}
      </ul>
    </section>
  )
}

function LockedPredictionsHub({
  viewer,
  competition,
  viewerPredictions,
  predictionStore,
  onRefresh,
}: {
  viewer: Profile
  competition: CompetitionHome
  viewerPredictions: PredictionPayload
  predictionStore: PredictionStore
  onRefresh: () => Promise<CompetitionHome>
}) {
  const [selectedId, setSelectedId] = useState(viewer.id)
  const [friendPredictions, setFriendPredictions] = useState<PredictionPayload | null>(null)
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [refreshState, setRefreshState] = useState<'idle' | 'refreshing' | 'error'>('idle')
  const entryRequest = useRef(0)
  const lockedTabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const lockedProfiles = competition.profiles.filter((profile) => profile.status === 'Locked')
  const selectedProfile = lockedProfiles.find((profile) => profile.id === selectedId) ?? viewer

  const selectEntry = (profile: Profile) => {
    const requestId = entryRequest.current + 1
    entryRequest.current = requestId
    setSelectedId(profile.id)
    if (profile.id === viewer.id) return
    setLoadState('loading')
    void predictionStore.load(profile.id).then((predictions) => {
      if (entryRequest.current !== requestId) return
      setFriendPredictions(predictions)
      setLoadState('idle')
    }).catch(() => {
      if (entryRequest.current === requestId) setLoadState('error')
    })
  }

  const refresh = () => {
    setRefreshState('refreshing')
    void onRefresh().then((refreshedCompetition) => {
      const selectedIsStillLocked = refreshedCompetition.profiles.some((profile) => profile.id === selectedId && profile.status === 'Locked')
      if (!selectedIsStillLocked) {
        entryRequest.current += 1
        setSelectedId(viewer.id)
        setFriendPredictions(null)
        setLoadState('idle')
      }
      setRefreshState('idle')
    }).catch(() => setRefreshState('error'))
  }
  const shownPredictions = selectedProfile.id === viewer.id ? viewerPredictions : friendPredictions
  const handleLockedTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const nextIndex = event.key === 'Home' ? 0
      : event.key === 'End' ? lockedProfiles.length - 1
      : event.key === 'ArrowRight' ? (index + 1) % lockedProfiles.length
      : (index - 1 + lockedProfiles.length) % lockedProfiles.length
    const nextProfile = lockedProfiles[nextIndex]
    selectEntry(nextProfile)
    lockedTabRefs.current[nextIndex]?.focus()
  }

  return <section className="locked-hub" aria-labelledby="locked-hub-title">
    <div className="locked-hub-heading">
      <div>
        <h2 id="locked-hub-title">Locked predictions</h2>
        <p>See entries from friends who have locked.</p>
      </div>
      <button className="secondary-button" type="button" onClick={refresh} disabled={refreshState === 'refreshing'}>
        {refreshState === 'refreshing' ? 'Refreshing statuses…' : 'Refresh statuses'}
      </button>
    </div>
    {refreshState === 'error' && <p className="hub-error" role="alert">Statuses could not be refreshed. Your current entry is still shown; try again.</p>}
    <ul className="hub-status-grid" aria-label="Participant lock statuses">
      {competition.profiles.map((profile) => <li className={`hub-status accent-${profile.accent}`} key={profile.id}>
        <span className="hub-avatar" aria-hidden="true"><PersonIcon /></span>
        <span><strong>{profile.name}</strong><small>{profile.status}</small></span>
      </li>)}
    </ul>
    <div className="locked-tabs" role="tablist" aria-label="Locked participant entries">
      {lockedProfiles.map((profile, index) => <button key={profile.id} id={`locked-tab-${profile.id}`} role="tab" type="button" aria-selected={selectedProfile.id === profile.id} aria-controls="locked-entry-panel" tabIndex={selectedProfile.id === profile.id ? 0 : -1} ref={(node) => { lockedTabRefs.current[index] = node }} onKeyDown={(event) => handleLockedTabKey(event, index)} onClick={() => selectEntry(profile)}>
        <PersonIcon /> <span>{profile.name}</span>
      </button>)}
    </div>
    <div id="locked-entry-panel" className="locked-entry-panel" role="tabpanel" aria-labelledby={`locked-tab-${selectedProfile.id}`} tabIndex={0}>
      {selectedProfile.id !== viewer.id && loadState === 'loading' && <p role="status">Loading {selectedProfile.name}'s locked entry…</p>}
      {selectedProfile.id !== viewer.id && loadState === 'error' && <div className="table-error" role="alert"><h3>This entry could not load</h3><p>Try again or return to your entry.</p><button className="secondary-button" type="button" onClick={() => setSelectedId(viewer.id)}>Return to my entry</button></div>}
      {(selectedProfile.id === viewer.id || loadState === 'idle') && shownPredictions && <ReadOnlyEntry profile={selectedProfile} predictions={shownPredictions} ownEntry={selectedProfile.id === viewer.id} />}
    </div>
  </section>
}

function Workspace({ profile, competition, onSwitch, predictionStore, onStatusSaved, onRefresh }: { profile: Profile; competition: CompetitionHome; onSwitch: () => void; predictionStore: PredictionStore; onStatusSaved: (hasPredictions: boolean, locked?: boolean) => void; onRefresh: () => Promise<CompetitionHome> }) {
  const [activeTab, setActiveTab] = useState<(typeof workspaceTabs)[number]>(workspaceTabs[0])
  const [predictions, setPredictions] = useState<PredictionPayload>(emptyPredictions)
  const [saveState, setSaveState] = useState<'loading' | 'saved' | 'saving' | 'failed' | 'offline' | 'invalid'>('loading')
  const [changed, setChanged] = useState(false)
  const pending = useRef<PredictionPayload | null>(null)
  const workspaceTabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [locked, setLocked] = useState(profile.status === 'Locked')
  const [lockConfirmed, setLockConfirmed] = useState(false)
  const [lockError, setLockError] = useState('')

  useEffect(() => {
    let active = true
    void predictionStore.load(profile.id).then((loaded) => {
      if (!active) return
      setPredictions(loaded)
      setSaveState('saved')
    }).catch((error: unknown) => active && setSaveState(error instanceof PredictionDataError ? 'invalid' : 'offline'))
    return () => { active = false }
  }, [profile.id, predictionStore])

  const write = useCallback((value: PredictionPayload) => {
    pending.current = value
    if (!navigator.onLine) { setSaveState('offline'); return }
    setSaveState('saving')
    void predictionStore.save(profile.id, value).then(() => {
      if (pending.current === value) { setSaveState('saved'); setChanged(false); onStatusSaved(answeredCount(value) > 0) }
    }).catch(() => pending.current === value && setSaveState('failed'))
  }, [onStatusSaved, predictionStore, profile.id])
  useEffect(() => {
    if (!changed) return
    const timeout = window.setTimeout(() => write(predictions), 550)
    return () => window.clearTimeout(timeout)
  }, [predictions, changed, write])

  const update = (next: PredictionPayload) => {
    if (saveState === 'invalid' || locked) return
    setPredictions(next)
    setChanged(true)
  }
  const saveText = (group: 'cups' | 'questions', id: string, value: string) => {
    const normalized = normalizeManualAnswer(value)
    const fields = { ...predictions[group] }
    if (normalized) fields[id] = normalized
    else delete fields[id]
    update({ ...predictions, [group]: fields })
  }
  const saveNumber = (id: string, raw: string) => {
    const fields = { ...predictions.questions }
    if (!raw) delete fields[id]
    else { const number = parseWholeNumber(raw); if (number === null) return; fields[id] = number }
    update({ ...predictions, questions: fields })
  }
  const saveScore = (id: string, side: keyof ScoreAnswer, raw: string) => {
    if (raw && parseWholeNumber(raw) === null) return
    const current = predictions.questions[id] as ScoreAnswer | undefined
    const score: ScoreAnswer = { home: current?.home ?? null, away: current?.away ?? null, [side]: raw ? parseWholeNumber(raw) : null }
    const fields = { ...predictions.questions }
    if (score.home === null && score.away === null) delete fields[id]
    else fields[id] = score
    update({ ...predictions, questions: fields })
  }
  const retry = () => pending.current && write(pending.current)
  const count = answeredCount(predictions)
  const statusText = saveState === 'loading' ? 'Loading saved draft' : saveState === 'saving' ? 'Saving' : saveState === 'failed' ? 'Not saved' : saveState === 'offline' ? 'Offline — changes are not shared' : saveState === 'invalid' ? 'Saved table needs attention' : 'Saved'
  const selectWorkspaceTab = (tab: (typeof workspaceTabs)[number], focus = false) => {
    setActiveTab(tab)
    if (focus) window.requestAnimationFrame(() => workspaceTabRefs.current[workspaceTabs.indexOf(tab)]?.focus())
  }
  const handleWorkspaceTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const nextIndex = event.key === 'Home' ? 0
      : event.key === 'End' ? workspaceTabs.length - 1
      : event.key === 'ArrowRight' ? (index + 1) % workspaceTabs.length
      : (index - 1 + workspaceTabs.length) % workspaceTabs.length
    selectWorkspaceTab(workspaceTabs[nextIndex], true)
  }
  return (
    <section className="workspace-card" aria-labelledby="workspace-title">
      <header className="workspace-header">
        <div className={`workspace-identity accent-${profile.accent}`}>
          <span className="workspace-avatar" aria-hidden="true">
            <PersonIcon />
          </span>
          <div>
            <h1 id="workspace-title">{profile.name}'s predictions</h1>
            <p className="workspace-status">{profile.status}</p>
          </div>
        </div>
        <button className="secondary-button" type="button" onClick={onSwitch}>
          Switch profile
        </button>
      </header>

      {locked && profile.status === 'Locked' ? <LockedPredictionsHub viewer={profile} competition={competition} viewerPredictions={predictions} predictionStore={predictionStore} onRefresh={onRefresh} /> : <>

      <div className={`save-status save-${saveState}`} role="status" aria-live="polite">
        <span>{statusText}</span><span>{count} / 39 answered</span>
        {saveState === 'failed' && <button className="secondary-button" type="button" onClick={retry}>Retry</button>}
      </div>

      <div className="tab-strip" role="tablist" aria-label="Prediction workspace">
        {workspaceTabs.map((tab, index) => (
          <button
            id={`tab-${index}`}
            key={tab}
            role="tab"
            type="button"
            aria-selected={activeTab === tab}
            aria-controls="workspace-panel"
            aria-label={tab}
            tabIndex={activeTab === tab ? 0 : -1}
            ref={(node) => { workspaceTabRefs.current[index] = node }}
            onKeyDown={(event) => handleWorkspaceTabKey(event, index)}
            onClick={() => selectWorkspaceTab(tab)}
          >
            <span className="tab-label-full">{tab}</span>
            <span className="tab-label-compact" aria-hidden="true">{compactTabLabel[tab]}</span>
          </button>
        ))}
      </div>
      <div
        id="workspace-panel"
        className="workspace-panel"
        role="tabpanel"
        aria-labelledby={`tab-${workspaceTabs.indexOf(activeTab)}`}
        tabIndex={0}
      >
        {saveState === 'invalid' ? <MalformedTableState /> : <>
          {activeTab === 'Cup winners' && <AnswerFields predictions={predictions} onText={saveText} />}
          {activeTab === 'Premier League questions' && <QuestionFields predictions={predictions} onText={saveText} onNumber={saveNumber} onScore={saveScore} />}
          {activeTab === 'Premier League table' && <TablePredictionFields predictions={predictions} onUpdate={update} />}
        </>}
        {activeTab === 'Review & lock' && !locked && <ReviewAndLock
          predictions={predictions}
          count={count}
          saveState={saveState}
          changed={changed}
          confirmed={lockConfirmed}
          error={lockError}
          onConfirmed={setLockConfirmed}
          onEdit={setActiveTab}
          onLock={(retry = false) => {
            if (!predictionStore.lock || count === 0 || changed || (!retry && saveState !== 'saved') || !lockConfirmed) return
            setLockError('')
            setSaveState('saving')
            void predictionStore.lock(profile.id, predictions).then(() => {
              setLocked(true); setSaveState('saved'); onStatusSaved(true, true)
            }).catch(() => { setSaveState('failed'); setLockError('Your entry was not locked. Retry after the saved state returns.') })
          }}
          canLock={Boolean(predictionStore.lock) && count > 0 && !changed && saveState === 'saved' && lockConfirmed}
          canRetry={Boolean(predictionStore.lock) && count > 0 && !changed && lockConfirmed && Boolean(lockError)}
        />}
      </div>
      </>}
    </section>
  )
}

function MalformedTableState() {
  return <section className="table-error" role="alert">
    <h2>This table needs attention</h2>
    <p>A club is missing, duplicated, or unrecognised. Nothing has been overwritten; ask Keshav to correct the entry.</p>
  </section>
}

function answerText(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value && typeof value === 'object' && 'home' in value && 'away' in value) {
    const score = value as ScoreAnswer
    return typeof score.home === 'number' && typeof score.away === 'number' ? `${score.home}–${score.away}` : 'No prediction'
  }
  return 'No prediction'
}

function ReviewContent({ predictions, onEdit }: { predictions: PredictionPayload; onEdit?: (tab: (typeof workspaceTabs)[number]) => void }) {
  const table = predictions.table?.confirmed ? predictions.table.order : null
  const heading = (title: string, tab: (typeof workspaceTabs)[number]) => onEdit ? <div className="review-heading"><h3>{title}</h3><button className="text-button" type="button" onClick={() => onEdit(tab)}>Edit {title}</button></div> : <div className="review-heading"><h3>{title}</h3></div>
  return <>
    <section className="review-group">{heading('Premier League table', 'Premier League table')}{table ? <ol className="review-table">{table.map((club, index) => <li key={club}><span>{index + 1}</span>{clubNameById[club]}</li>)}</ol> : <p className="no-prediction">No table prediction</p>}</section>
    <section className="review-group">{heading('Cup winners', 'Cup winners')}<dl className="review-list">{cupQuestions.map((cup) => <div key={cup}><dt>{cup}</dt><dd className={predictions.cups[cup] ? '' : 'no-prediction'}>{answerText(predictions.cups[cup])}</dd></div>)}</dl></section>
    <section className="review-group">{heading('Premier League questions', 'Premier League questions')}<dl className="review-list">{leagueQuestions.map((question) => <div key={question.id}><dt>{question.label}</dt><dd className={answerText(predictions.questions[question.id]) === 'No prediction' ? 'no-prediction' : ''}>{answerText(predictions.questions[question.id])}</dd></div>)}</dl></section>
  </>
}

function ReviewAndLock({ predictions, count, saveState, changed, confirmed, error, onConfirmed, onEdit, onLock, canLock, canRetry }: { predictions: PredictionPayload; count: number; saveState: string; changed: boolean; confirmed: boolean; error: string; onConfirmed: (value: boolean) => void; onEdit: (tab: (typeof workspaceTabs)[number]) => void; onLock: (retry?: boolean) => void; canLock: boolean; canRetry: boolean }) {
  const lockReason = count === 0 ? 'Add at least one valid prediction before locking.' : changed || saveState === 'saving' ? 'Wait for your latest changes to save before locking.' : saveState !== 'saved' ? 'Locking is unavailable until the shared save succeeds.' : !confirmed ? 'Confirm that you understand the entry becomes read-only.' : ''
  return <div className="review-lock"><h2>Review and lock</h2><p className="review-count">{count} of 39 answered</p><p>Unanswered fields will show as No prediction.</p>
    <ReviewContent predictions={predictions} onEdit={onEdit} />
    <ScoringReference />
    <label className="lock-confirmation"><input type="checkbox" checked={confirmed} onChange={(event) => onConfirmed(event.target.checked)} /> I understand this entry becomes read-only and only Keshav can reopen it.</label>
    {lockReason && <p className="lock-reason" role="status">{lockReason}</p>}{error && <p className="lock-error" role="alert">{error}</p>}
    <button className="primary-button lock-button" type="button" disabled={!canLock} onClick={() => onLock()}>Lock my predictions</button>
    {error && <button className="secondary-button" type="button" disabled={!canRetry} onClick={() => onLock(true)}>Retry locking</button>}
  </div>
}

function ScoringReference() {
  const groups = [
    { label: 'League table', points: SCORING_ALLOCATION.table, text: '5 points for an exact position, 3 for one away, 1 for two away, plus champion, top-five and relegation bonuses.' },
    { label: 'Cup winners', points: SCORING_ALLOCATION.cups, text: '10 for the Champions League; 8 each for the Europa League and FA Cup; 6 each for the Conference League and Carabao Cup.' },
    { label: 'Season questions', points: SCORING_ALLOCATION.categoricalQuestions, text: 'Ten questions worth 7 points each.' },
    { label: 'Closest wins', points: SCORING_ALLOCATION.numericQuestions, text: '7 for the closest answer, with 3 more for an exact answer.' },
    { label: 'Match scores', points: SCORING_ALLOCATION.matchPredictions, text: '3 for the correct result, plus 4 for the exact score.' },
  ]
  return <section className="scoring-reference" aria-labelledby="scoring-title">
    <div className="scoring-heading"><div><h3 id="scoring-title">Scoring</h3><p>Maximum points</p></div><strong>{SCORING_TOTAL}</strong></div>
    <div className="scoring-grid">{groups.map((group) => <article key={group.label}><div><h4>{group.label}</h4><strong>{group.points}</strong></div><p>{group.text}</p></article>)}</div>
    <details className="scoring-notes"><summary>Definitions and ties</summary><div>
      <p>Tied closest answers each get full points. Shared official or Keshav-accepted winners also receive full points.</p>
      <p>A permanent manager leaving includes dismissal, resignation, or mutual consent; interim and caretaker managers do not count. “No managerial departure” is valid.</p>
      <p>Red cards count Premier League player dismissals only. Arsenal set pieces include corners, free kicks, and throw-ins before open play resumes; penalties do not count.</p>
      <p>Voided categories score zero and totals are not rebalanced. Joint overall leaders stay tied.</p>
    </div></details>
  </section>
}

function ReadOnlyEntry({ profile, predictions, ownEntry }: { profile: Profile; predictions: PredictionPayload; ownEntry: boolean }) {
  return <div className={`locked-entry accent-${profile.accent}`}><div className="locked-entry-heading"><span className="locked-avatar" aria-hidden="true"><PersonIcon /></span><div><h3>{profile.name}'s locked entry</h3><p>{ownEntry ? 'Your entry' : 'Locked entry'} · {answeredCount(predictions)} answered</p></div></div><ReviewContent predictions={predictions} /></div>
}

function positionZone(position: number): string {
  if (position === 1) return 'Champion'
  if (position <= 5) return 'Champions League'
  if (position <= 7) return 'Europa League'
  if (position === 8) return 'Conference League'
  if (position >= 18) return 'Relegation'
  return 'League position'
}

function positionBoundary(position: number): string {
  if (position === 1) return 'Champion'
  if (position === 2) return 'Champions League'
  if (position === 6) return 'Europa League'
  if (position === 8) return 'Conference League'
  if (position === 18) return 'Relegation'
  return ''
}

interface DragState {
  club: ClubId
  pointerId: number
  originIndex: number
  targetIndex: number
  startY: number
  currentY: number
  active: boolean
}

function TablePredictionFields({ predictions, onUpdate }: { predictions: PredictionPayload; onUpdate: (next: PredictionPayload) => void }) {
  const order = predictions.table?.order ?? initialTableOrder
  const confirmed = predictions.table?.confirmed ?? false
  const [announcement, setAnnouncement] = useState('')
  const [dragState, setDragState] = useState<DragState | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const rowRefs = useRef<Partial<Record<ClubId, HTMLLIElement | null>>>({})

  const changeOrder = (from: number, to: number) => {
    const nextOrder = moveClub(order, from, to)
    if (nextOrder === order) return
    const club = nextOrder[to]
    onUpdate({ ...predictions, table: { order: nextOrder, confirmed: false } })
    setAnnouncement(`${clubNameById[club]} moved to position ${to + 1}. Table needs confirmation.`)
  }
  const skip = () => {
    const withoutTable = { ...predictions }
    delete withoutTable.table
    onUpdate(withoutTable)
    setAnnouncement('Premier League table skipped. It will not count as a prediction.')
  }
  const confirm = () => {
    onUpdate({ ...predictions, table: { order: [...order], confirmed: true } })
    setAnnouncement('Premier League table confirmed. All 20 positions will count as predictions.')
  }

  const beginDrag = (event: ReactPointerEvent<HTMLButtonElement>, club: ClubId, index: number) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const next: DragState = { club, pointerId: event.pointerId, originIndex: index, targetIndex: index, startY: event.clientY, currentY: event.clientY, active: false }
    dragRef.current = next
    setDragState(next)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const moveDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = dragRef.current
    if (!current || current.pointerId !== event.pointerId) return
    const active = current.active || Math.abs(event.clientY - current.startY) >= 7
    if (!active) return
    event.preventDefault()
    let targetIndex = order.length - 1
    for (let index = 0; index < order.length; index += 1) {
      if (order[index] === current.club) continue
      const rect = rowRefs.current[order[index]]?.getBoundingClientRect()
      if (rect && event.clientY < rect.bottom) {
        targetIndex = index
        break
      }
    }
    const edge = 72
    if (event.clientY < edge) window.scrollBy(0, -12)
    if (event.clientY > window.innerHeight - edge) window.scrollBy(0, 12)
    const next = { ...current, currentY: event.clientY, targetIndex, active }
    dragRef.current = next
    setDragState(next)
  }

  const endDrag = (event?: ReactPointerEvent<HTMLButtonElement>, forcedTarget?: number) => {
    const current = dragRef.current
    if (!current || (event && current.pointerId !== event.pointerId)) return
    const targetIndex = forcedTarget ?? current.targetIndex
    if (current.active && targetIndex !== current.originIndex) changeOrder(current.originIndex, targetIndex)
    if (event?.currentTarget.hasPointerCapture?.(current.pointerId)) event.currentTarget.releasePointerCapture(current.pointerId)
    dragRef.current = null
    setDragState(null)
  }

  const cancelDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
    setDragState(null)
  }

  return <>
    <h2>Premier League table</h2>
    <p>Drag clubs into order, or use the arrow buttons. Confirm the table when it is ready.</p>
    <p className={`table-confirmation ${confirmed ? 'is-confirmed' : ''}`}>{confirmed ? 'Confirmed · 20 positions' : 'Not confirmed'}</p>
    <p className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>
    <ol className={`league-table ${dragState?.active ? 'is-dragging' : ''}`} aria-label="Premier League prediction table">
      {order.map((club, index) => {
        const isDragging = dragState?.club === club && dragState.active
        const isDropTarget = Boolean(dragState?.active && dragState.club !== club && dragState.targetIndex === index)
        const dropDirection = dragState && dragState.targetIndex > dragState.originIndex ? 'after' : 'before'
        const dragOffset = isDragging ? dragState.currentY - dragState.startY : 0
        return <li ref={(node) => { rowRefs.current[club] = node }} className={`table-row table-zone-${positionZone(index + 1).toLowerCase().replaceAll(' ', '-')} ${isDragging ? 'is-dragging' : ''} ${isDropTarget ? `is-drop-target drop-${dropDirection}` : ''}`} style={{ '--drag-offset': `${dragOffset}px` } as CSSProperties} key={club} onPointerUp={() => {
          if (dragRef.current?.active) endDrag(undefined, index)
        }}>
          <span className="table-position" aria-label={`Position ${index + 1}`}>{index + 1}</span>
          <button className="drag-handle" type="button" aria-label={`Drag ${clubNameById[club]}`} aria-pressed={isDragging} onPointerDown={(event) => beginDrag(event, club, index)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={cancelDrag}><GripIcon /></button>
          <span className="table-club-wrap"><span className="table-club">{clubNameById[club]}</span>{positionBoundary(index + 1) && <span className="table-zone-label">{positionBoundary(index + 1)}</span>}</span>
          <span className="table-controls"><button type="button" aria-label={`Move ${clubNameById[club]} up`} disabled={index === 0} onClick={() => changeOrder(index, index - 1)}><ArrowIcon direction="up" /></button><button type="button" aria-label={`Move ${clubNameById[club]} down`} disabled={index === order.length - 1} onClick={() => changeOrder(index, index + 1)}><ArrowIcon direction="down" /></button></span>
        </li>
      })}
    </ol>
    <div className="table-actions">
      <button className="primary-button" type="button" onClick={confirm}>{confirmed ? 'Table confirmed' : 'Confirm table'}</button>
      <button className="secondary-button" type="button" onClick={skip}>Skip table</button>
    </div>
  </>
}

function AnswerFields({ predictions, onText }: { predictions: PredictionPayload; onText: (group: 'cups' | 'questions', id: string, value: string) => void }) {
  return <><h2>Cup winners</h2><div className="answer-grid">
    {cupQuestions.map((cup) => <label className="answer-card" key={cup}>{cup}<input list="club-suggestions" maxLength={120} value={predictions.cups[cup] ?? ''} onChange={(event) => onText('cups', cup, event.target.value)} placeholder="Choose or type a club" /></label>)}
  </div><datalist id="club-suggestions">{suggestionCatalog.map((name) => <option value={name} key={name} />)}</datalist></>
}

function QuestionFields({ predictions, onText, onNumber, onScore }: { predictions: PredictionPayload; onText: (group: 'cups' | 'questions', id: string, value: string) => void; onNumber: (id: string, value: string) => void; onScore: (id: string, side: keyof ScoreAnswer, value: string) => void }) {
  return <><h2>Premier League questions</h2><div className="answer-grid">
    {leagueQuestions.map((question) => <div className="answer-card" key={question.id}><label htmlFor={question.id}>{question.label}</label>
      {question.helper && <details><summary>What counts as a set-piece goal?</summary><p>{question.helper}</p></details>}
      {question.kind === 'number' ? <input id={question.id} inputMode="numeric" pattern="[0-9]*" value={(predictions.questions[question.id] as number | undefined) ?? ''} onChange={(event) => onNumber(question.id, event.target.value)} placeholder="0" aria-label={question.label} /> :
       question.kind === 'score' ? <div className="score-inputs"><input inputMode="numeric" pattern="[0-9]*" value={(predictions.questions[question.id] as ScoreAnswer | undefined)?.home ?? ''} onChange={(event) => onScore(question.id, 'home', event.target.value)} aria-label={`${question.label}: home score`} placeholder="Home" /><span aria-hidden="true">–</span><input inputMode="numeric" pattern="[0-9]*" value={(predictions.questions[question.id] as ScoreAnswer | undefined)?.away ?? ''} onChange={(event) => onScore(question.id, 'away', event.target.value)} aria-label={`${question.label}: away score`} placeholder="Away" /></div> :
       <input id={question.id} list="people-suggestions" maxLength={120} value={(predictions.questions[question.id] as string | undefined) ?? ''} onChange={(event) => onText('questions', question.id, event.target.value)} placeholder={question.kind === 'manager-departure' ? 'Choose a manager or no departure' : 'Choose or type an answer'} />}
    </div>)}
  </div><datalist id="people-suggestions">{suggestionCatalog.map((name) => <option value={name} key={name} />)}</datalist></>
}

export function App({ loadCompetition = loadCompetitionHome, predictionStore }: { loadCompetition?: CompetitionLoader; predictionStore?: PredictionStore }) {
  const [viewState, setViewState] = useState<ViewState>({ phase: 'loading' })
  const [store] = useState<PredictionStore>(() => predictionStore ?? createPredictionStore())
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [requestId, setRequestId] = useState(0)

  useEffect(() => {
    let active = true
    void loadCompetition()
      .then((competition) => {
        if (!active) return
        setViewState({ phase: 'ready', competition })
        setSelectedSlug(readSelectedProfile(window.localStorage))
      })
      .catch((error: unknown) => {
        if (!active) return
        const kind = error instanceof CompetitionLoadError ? error.kind : 'unavailable'
        setViewState({ phase: 'error', kind, attempts: requestId + 1 })
      })
    return () => {
      active = false
    }
  }, [loadCompetition, requestId])

  const retry = () => {
    setViewState({ phase: 'loading' })
    setRequestId((current) => current + 1)
  }

  const refreshCompetition = useCallback(async () => {
    const competition = await loadCompetition()
    setViewState({ phase: 'ready', competition })
    return competition
  }, [loadCompetition])

  let content
  if (viewState.phase === 'loading') {
    content = <LoadingState />
  } else if (viewState.phase === 'error') {
    content = <ErrorState kind={viewState.kind} attempts={viewState.attempts} onRetry={retry} />
  } else {
    const selectedProfile = viewState.competition.profiles.find(({ slug }) => slug === selectedSlug)
    content = selectedProfile ? (
      <Workspace key={selectedProfile.id} profile={selectedProfile} competition={viewState.competition} predictionStore={store} onSwitch={() => setSelectedSlug(null)} onRefresh={refreshCompetition} onStatusSaved={(hasPredictions, locked) => {
        setViewState((current) => current.phase !== 'ready' ? current : {
          ...current,
          competition: {
            ...current.competition,
            profiles: current.competition.profiles.map((profile) => profile.id === selectedProfile.id
              ? { ...profile, status: locked ? 'Locked' : hasPredictions ? 'In progress' : 'Not started' }
              : profile),
          },
        })
      }} />
    ) : (
      <CompetitionHomeView
        competition={viewState.competition}
        onSelect={(profile) => {
          rememberSelectedProfile(window.localStorage, profile.slug)
          setSelectedSlug(profile.slug)
        }}
      />
    )
  }

  return (
    <main className="app-shell">
      <div className="ambient ambient-cyan" aria-hidden="true" />
      <div className="ambient ambient-violet" aria-hidden="true" />
      {content}
    </main>
  )
}
