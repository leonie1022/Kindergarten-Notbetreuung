import { Outlet, Link } from 'react-router-dom'

export default function App() {
  return (
    <div className="container">
      <header className="header">
        <h1>Denkmit Pöring Kindergarten Notbetreuung</h1>
        <nav>
          <Link to="/">Dates</Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="footer">© {new Date().getFullYear()} Mengyi Zhang</footer>
    </div>
  )
}
