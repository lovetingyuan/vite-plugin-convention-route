import { Outlet, Link } from 'react-router'

export default function RootLayout() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '1rem' }}>
      <nav style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to="/">Home</Link>
        <Link to="/about">About (static)</Link>
        <Link to="/123">/123 (dynamic :id)</Link>
        <Link to="/login">Login (auth group)</Link>
        <Link to="/register">Register (auth group)</Link>
        <Link to="/slug/a/b/c">Splat /slug/a/b/c</Link>
        <Link to="/nonexistent">404 test</Link>
      </nav>
      <hr />
      <Outlet />
    </div>
  )
}
