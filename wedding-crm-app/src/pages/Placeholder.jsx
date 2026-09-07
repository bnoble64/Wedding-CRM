export default function Placeholder({ title }) {
  return (
    <div className="page">
      <header className="page-head">
        <h1 className="display page-title">{title}</h1>
      </header>
      <div className="empty">
        <p>{title} lives here next. The database behind it is already built —
        this screen is where we will wire it up.</p>
      </div>
    </div>
  )
}
