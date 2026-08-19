import { useCallback, useEffect, useRef, useState } from 'react'
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

type ViewState =
  | { phase: 'loading' }
  | { phase: 'ready'; competition: CompetitionHome }
  | { phase: 'error'; kind: LoadFailureKind; attempts: number }

function LoadingState() {
  return (
    <section className="state-card" aria-live="polite" aria-busy="true">
      <span className="loading-mark" aria-hidden="true" />
      <h2>Opening the prediction room</h2>
      <p>Loading the shared competition and profile statuses…</p>
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
      title: 'Competition setup is incomplete',
      body: 'This build needs a browser-safe Supabase URL and publishable key before shared data can load.',
    },
    empty: {
      title: 'Competition data is empty',
      body: 'The shared service responded, but the fixed competition or its four profiles were not present.',
    },
    invalid: {
      title: 'Competition data is incomplete',
      body: 'A shared competition record is malformed. No profile statuses have been invented.',
    },
    unavailable: {
      title: 'Competition data cannot be reached',
      body:
        attempts > 1
          ? 'The shared service is still unavailable. Keshav may need to resume the competition service.'
          : 'The shared service may be offline or paused. Your competition data has not been replaced.',
    },
  }[kind]

  return (
    <section className="state-card error-card" role="alert">
      <p className="state-kicker">Shared data unavailable</p>
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
        className={`profile-card accent-${profile.accent} ${profile.status === 'Locked' ? 'is-locked' : ''}`}
        type="button"
        onClick={onSelect}
      >
        <span className="profile-pennant" aria-hidden="true">
          {profile.monogram}
        </span>
        <span className="profile-copy">
          <span className="profile-name">{profile.name}</span>
          <span className="profile-status">{profile.status}</span>
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
        <p className="eyebrow">Four seats · one season</p>
        <h1 id="product-title">{competition.title}</h1>
        <p className="competition-subtitle">{competition.subtitle}</p>
      </header>

      <div className="selection-heading">
        <div>
          <h2>Who are you?</h2>
          <p>Choose your profile on the honour system. You can switch at any time.</p>
        </div>
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

function Workspace({ profile, onSwitch, predictionStore, onStatusSaved }: { profile: Profile; onSwitch: () => void; predictionStore: PredictionStore; onStatusSaved: (hasPredictions: boolean, locked?: boolean) => void }) {
  const [activeTab, setActiveTab] = useState<(typeof workspaceTabs)[number]>(workspaceTabs[0])
  const [predictions, setPredictions] = useState<PredictionPayload>(emptyPredictions)
  const [saveState, setSaveState] = useState<'loading' | 'saved' | 'saving' | 'failed' | 'offline' | 'invalid'>('loading')
  const [changed, setChanged] = useState(false)
  const pending = useRef<PredictionPayload | null>(null)
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
  return (
    <section className="workspace-card" aria-labelledby="workspace-title">
      <header className="workspace-header">
        <div className={`workspace-identity accent-${profile.accent}`}>
          <span className="workspace-monogram" aria-hidden="true">
            {profile.monogram}
          </span>
          <div>
            <p className="eyebrow">Selected profile</p>
            <h1 id="workspace-title">{profile.name}'s predictions</h1>
            <p className="workspace-status">{profile.status}</p>
          </div>
        </div>
        <button className="secondary-button" type="button" onClick={onSwitch}>
          Switch profile
        </button>
      </header>

      <p className="honour-note">Profiles are shared on trust—there is no sign-in or verified identity.</p>

      <div className={`save-status save-${saveState}`} role="status" aria-live="polite">
        <span>{statusText}</span><span>{count} of 39 predictions answered</span>
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
            onClick={() => setActiveTab(tab)}
          >
            {tab}
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
        {saveState === 'invalid' ? <MalformedTableState /> : locked ? <LockedEntry profile={profile} predictions={predictions} /> : <>
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
    </section>
  )
}

function MalformedTableState() {
  return <section className="table-error" role="alert">
    <p className="state-kicker">Saved table needs attention</p>
    <h2>We could not safely load this table</h2>
    <p>The saved table has a missing, duplicate, or unrecognised club. Nothing has been changed or saved over it. Ask Keshav to correct the shared entry before continuing.</p>
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
    <section className="review-group">{heading('Premier League table', 'Premier League table')}{table ? <ol className="review-table">{table.map((club, index) => <li key={club}><span>{index + 1}</span>{clubNameById[club]}</li>)}</ol> : <p className="no-prediction">No prediction</p>}</section>
    <section className="review-group">{heading('Cup winners', 'Cup winners')}<dl className="review-list">{cupQuestions.map((cup) => <div key={cup}><dt>{cup}</dt><dd className={predictions.cups[cup] ? '' : 'no-prediction'}>{answerText(predictions.cups[cup])}</dd></div>)}</dl></section>
    <section className="review-group">{heading('Premier League questions', 'Premier League questions')}<dl className="review-list">{leagueQuestions.map((question) => <div key={question.id}><dt>{question.label}</dt><dd className={answerText(predictions.questions[question.id]) === 'No prediction' ? 'no-prediction' : ''}>{answerText(predictions.questions[question.id])}</dd></div>)}</dl></section>
  </>
}

function ReviewAndLock({ predictions, count, saveState, changed, confirmed, error, onConfirmed, onEdit, onLock, canLock, canRetry }: { predictions: PredictionPayload; count: number; saveState: string; changed: boolean; confirmed: boolean; error: string; onConfirmed: (value: boolean) => void; onEdit: (tab: (typeof workspaceTabs)[number]) => void; onLock: (retry?: boolean) => void; canLock: boolean; canRetry: boolean }) {
  const lockReason = count === 0 ? 'Add at least one valid prediction before locking.' : changed || saveState === 'saving' ? 'Wait for your latest changes to save before locking.' : saveState !== 'saved' ? 'Locking is unavailable until the shared save succeeds.' : !confirmed ? 'Confirm that you understand the entry becomes read-only.' : ''
  return <div className="review-lock"><p className="state-kicker">Review & lock</p><h2>{count} predictions ready</h2><p>Unanswered items stay optional and will show as No prediction.</p>
    <ReviewContent predictions={predictions} onEdit={onEdit} />
    <ScoringReference />
    <label className="lock-confirmation"><input type="checkbox" checked={confirmed} onChange={(event) => onConfirmed(event.target.checked)} /> I understand this entry becomes read-only. Only Keshav can reopen it in the competition database.</label>
    {lockReason && <p className="lock-reason" role="status">{lockReason}</p>}{error && <p className="lock-error" role="alert">{error}</p>}
    <button className="primary-button lock-button" type="button" disabled={!canLock} onClick={() => onLock()}>Lock my predictions</button>
    {error && <button className="secondary-button" type="button" disabled={!canRetry} onClick={() => onLock(true)}>Retry locking</button>}
  </div>
}

function ScoringReference() {
  return <details className="scoring-reference"><summary>Scoring reference — {SCORING_TOTAL} points available</summary><div><p><strong>Premier League table — {SCORING_ALLOCATION.table}:</strong> each club is worth 5 exact, 3 one away, 1 two away; plus champion 5, top-five inclusion 2 each (10) plus all-five 5, relegation inclusion 3 each (9) plus all-three 6.</p><p><strong>Cups — {SCORING_ALLOCATION.cups}:</strong> Champions League 10; Europa League and FA Cup 8 each; Conference League and Carabao Cup 6 each. Winners only.</p><p><strong>Ten categorical questions — {SCORING_ALLOCATION.categoricalQuestions}:</strong> 7 each. Shared official or Keshav-accepted winners each receive the full 7. A manager departure includes dismissal, resignation, or mutual consent; interim and caretaker managers do not count. No managerial departure is valid.</p><p><strong>Two numeric questions — {SCORING_ALLOCATION.numericQuestions}:</strong> closest answer gets 7, with 3 more for exact. Tied closest answers each receive full points; blanks score zero. Chelsea red cards are the final official Premier League player total: straight reds and second-yellow dismissals count; staff dismissals and non-league matches do not. Arsenal set-piece goals come from corners, direct or indirect free kicks, or throw-ins before open play resumes; penalties are excluded and opponent own goals from that phase count.</p><p><strong>Two match scores — {SCORING_ALLOCATION.matchPredictions}:</strong> 7 each for the exact official score. A replayed or abandoned fixture uses the final Premier League-recognised score. Categories without an official or supplied outcome are void and score zero; totals are not renormalized. Joint overall leaders remain tied.</p></div></details>
}

function LockedEntry({ profile, predictions }: { profile: Profile; predictions: PredictionPayload }) {
  return <div className={`locked-entry accent-${profile.accent}`}><div className="locked-pennant" aria-hidden="true">{profile.monogram}</div><p className="state-kicker">You’re locked in</p><h2>{profile.name}'s entry is read-only</h2><p>Your pennant is illuminated. Keshav can reopen this entry in the competition database if a correction is needed; reopening hides it and requires locking again.</p><p>{answeredCount(predictions)} predictions locked. Other locked participant entries become available after refresh; draft entries remain hidden.</p><ReviewContent predictions={predictions} /></div>
}

function positionZone(position: number): string {
  if (position === 1) return 'Champion'
  if (position <= 5) return 'Champions League'
  if (position <= 7) return 'Europa League'
  if (position === 8) return 'Conference League'
  if (position >= 18) return 'Relegation'
  return 'League position'
}

function TablePredictionFields({ predictions, onUpdate }: { predictions: PredictionPayload; onUpdate: (next: PredictionPayload) => void }) {
  const order = predictions.table?.order ?? initialTableOrder
  const confirmed = predictions.table?.confirmed ?? false
  const [announcement, setAnnouncement] = useState('')
  const draggedClub = useRef<ClubId | null>(null)

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

  return <>
    <p className="state-kicker">Optional prediction</p>
    <h2>Premier League table</h2>
    <p>Rank every club. Drag the handle or use Move up and Move down. The alphabetical starting order only counts after you confirm it.</p>
    <p className={`table-confirmation ${confirmed ? 'is-confirmed' : ''}`}>{confirmed ? 'Confirmed — 20 predictions included' : 'Not confirmed — 0 table predictions included'}</p>
    <p className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>
    <ol className="league-table" aria-label="Premier League prediction table">
      {order.map((club, index) => <li className={`table-row table-zone-${positionZone(index + 1).toLowerCase().replaceAll(' ', '-')}`} key={club} onPointerUp={() => {
        if (draggedClub.current && draggedClub.current !== club) changeOrder(order.indexOf(draggedClub.current), index)
        draggedClub.current = null
      }}>
        <span className="table-position" aria-label={`Position ${index + 1}`}>{index + 1}</span>
        <button className="drag-handle" type="button" aria-label={`Drag ${clubNameById[club]}`} onPointerDown={() => { draggedClub.current = club }} onPointerCancel={() => { draggedClub.current = null }}>↕</button>
        <span className="table-club">{clubNameById[club]}</span>
        <span className="table-zone-label">{positionZone(index + 1)}</span>
        <span className="table-controls"><button type="button" aria-label={`Move ${clubNameById[club]} up`} disabled={index === 0} onClick={() => changeOrder(index, index - 1)}>Move up</button><button type="button" aria-label={`Move ${clubNameById[club]} down`} disabled={index === order.length - 1} onClick={() => changeOrder(index, index + 1)}>Move down</button></span>
      </li>)}
    </ol>
    <div className="table-actions">
      <button className="primary-button" type="button" onClick={confirm}>{confirmed ? 'Table confirmed' : 'Confirm table'}</button>
      <button className="secondary-button" type="button" onClick={skip}>Skip table</button>
    </div>
  </>
}

function AnswerFields({ predictions, onText }: { predictions: PredictionPayload; onText: (group: 'cups' | 'questions', id: string, value: string) => void }) {
  return <><p className="state-kicker">Optional answers</p><h2>Cup winners</h2><p>Choose a suggestion or type any club. Leave a field blank to skip it.</p><div className="answer-grid">
    {cupQuestions.map((cup) => <label className="answer-card" key={cup}>{cup}<input list="club-suggestions" maxLength={120} value={predictions.cups[cup] ?? ''} onChange={(event) => onText('cups', cup, event.target.value)} placeholder="Choose or type a club" /></label>)}
  </div><datalist id="club-suggestions">{suggestionCatalog.map((name) => <option value={name} key={name} />)}</datalist></>
}

function QuestionFields({ predictions, onText, onNumber, onScore }: { predictions: PredictionPayload; onText: (group: 'cups' | 'questions', id: string, value: string) => void; onNumber: (id: string, value: string) => void; onScore: (id: string, side: keyof ScoreAnswer, value: string) => void }) {
  return <><p className="state-kicker">Optional answers</p><h2>Premier League questions</h2><p>Suggestions are local only. You can always type a different answer.</p><div className="answer-grid">
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

  let content
  if (viewState.phase === 'loading') {
    content = <LoadingState />
  } else if (viewState.phase === 'error') {
    content = <ErrorState kind={viewState.kind} attempts={viewState.attempts} onRetry={retry} />
  } else {
    const selectedProfile = viewState.competition.profiles.find(({ slug }) => slug === selectedSlug)
    content = selectedProfile ? (
      <Workspace key={selectedProfile.id} profile={selectedProfile} predictionStore={store} onSwitch={() => setSelectedSlug(null)} onStatusSaved={(hasPredictions, locked) => {
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
