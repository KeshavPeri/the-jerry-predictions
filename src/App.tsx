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
  cupQuestions,
  emptyPredictions,
  leagueQuestions,
  normalizeManualAnswer,
  parseWholeNumber,
  suggestionCatalog,
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
        className={`profile-card accent-${profile.accent}`}
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

function Workspace({ profile, onSwitch, predictionStore, onStatusSaved }: { profile: Profile; onSwitch: () => void; predictionStore: PredictionStore; onStatusSaved: (hasPredictions: boolean) => void }) {
  const [activeTab, setActiveTab] = useState<(typeof workspaceTabs)[number]>(workspaceTabs[0])
  const [predictions, setPredictions] = useState<PredictionPayload>(emptyPredictions)
  const [saveState, setSaveState] = useState<'loading' | 'saved' | 'saving' | 'failed' | 'offline'>('loading')
  const [changed, setChanged] = useState(false)
  const pending = useRef<PredictionPayload | null>(null)

  useEffect(() => {
    let active = true
    void predictionStore.load(profile.id).then((loaded) => {
      if (!active) return
      setPredictions(loaded)
      setSaveState('saved')
    }).catch(() => active && setSaveState('offline'))
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

  const update = (next: PredictionPayload) => { setPredictions(next); setChanged(true) }
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
  const statusText = saveState === 'loading' ? 'Loading saved draft' : saveState === 'saving' ? 'Saving' : saveState === 'failed' ? 'Not saved' : saveState === 'offline' ? 'Offline — changes are not shared' : 'Saved'
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
        <span>{statusText}</span><span>{count} of 19 cup and question predictions answered</span>
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
        {activeTab === 'Cup winners' && <AnswerFields predictions={predictions} onText={saveText} />}
        {activeTab === 'Premier League questions' && <QuestionFields predictions={predictions} onText={saveText} onNumber={saveNumber} onScore={saveScore} />}
        {activeTab === 'Premier League table' && <><p className="state-kicker">Next up</p><h2>Premier League table</h2><p>Table ranking arrives in the next focused feature. Cup and question answers are ready to save now.</p></>}
        {activeTab === 'Review & lock' && <><p className="state-kicker">Draft review</p><h2>{count} predictions ready</h2><p>Review and locking arrive after the table prediction feature. Your saved cup and question answers remain editable.</p></>}
      </div>
    </section>
  )
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
      <Workspace key={selectedProfile.id} profile={selectedProfile} predictionStore={store} onSwitch={() => setSelectedSlug(null)} onStatusSaved={(hasPredictions) => {
        setViewState((current) => current.phase !== 'ready' ? current : {
          ...current,
          competition: {
            ...current.competition,
            profiles: current.competition.profiles.map((profile) => profile.id === selectedProfile.id && profile.status !== 'Locked'
              ? { ...profile, status: hasPredictions ? 'In progress' : 'Not started' }
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
