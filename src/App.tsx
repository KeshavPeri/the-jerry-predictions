const pennants = ['violet', 'cyan', 'teal', 'gold'] as const

export function App() {
  return (
    <main className="app-shell">
      <div className="ambient ambient-cyan" aria-hidden="true" />
      <div className="ambient ambient-violet" aria-hidden="true" />

      <section className="room-card" aria-labelledby="product-title">
        <p className="eyebrow">Four seats · one season</p>
        <h1 id="product-title">THE JERRY PREDICTIONS</h1>
        <p className="competition-subtitle">
          2026/27 Football Prediction Competition
        </p>

        <div className="pennant-rail" aria-hidden="true">
          {pennants.map((accent) => (
            <span className={`pennant pennant-${accent}`} key={accent} />
          ))}
        </div>

        <p className="setup-message">The prediction room is being prepared.</p>
      </section>
    </main>
  )
}
