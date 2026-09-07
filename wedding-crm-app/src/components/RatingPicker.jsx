const LABELS = { 5: 'Love it', 4: 'Like it', 3: 'Neutral', 2: 'Not really', 1: 'Hard no' }

export function RatingDots({ value }) {
  if (value == null) return <span className="rating-empty">—</span>
  return (
    <span className="rating-dots" title={LABELS[value]}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={'rdot' + (n <= value ? ' on' : '')} />
      ))}
    </span>
  )
}

export function RatingPicker({ label, value, onChange }) {
  return (
    <div className="rating-picker">
      <span className="rp-label">{label}</span>
      <div className="rp-buttons">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button"
            className={'rp-btn' + (value === n ? ' on' : '')}
            title={LABELS[n]} onClick={() => onChange(value === n ? null : n)}>
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

export { LABELS as RATING_LABELS }
