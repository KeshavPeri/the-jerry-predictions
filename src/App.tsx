import { useEffect, useState } from 'react'
import {
  readSelectedProfile,
  rememberSelectedProfile,
  type CompetitionHome,
  type Profile,
} from './competition'
import {
  CompetitionLoadError,
  loadCompetitionHome,
  type CompetitionLoader,
  type LoadFailureKind,
} from './supabase'

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

function Workspace({ profile, onSwitch }: { profile: Profile; onSwitch: () => void }) {
  const [activeTab, setActiveTab] = useState<(typeof workspaceTabs)[number]>(workspaceTabs[0])
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
        <p className="state-kicker">Workspace preview</p>
        <h2>{activeTab}</h2>
        <p>This section is ready for its focused prediction feature.</p>
      </div>
    </section>
  )
}

export function App({ loadCompetition = loadCompetitionHome }: { loadCompetition?: CompetitionLoader }) {
  const [viewState, setViewState] = useState<ViewState>({ phase: 'loading' })
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
      <Workspace profile={selectedProfile} onSwitch={() => setSelectedSlug(null)} />
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
