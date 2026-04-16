import { useLocation } from 'react-router'

export default function NotFoundPage() {
  const location = useLocation()
  return (
    <div>
      <h1>404 — Not Found</h1>
      <p>Route: <code>*</code></p>
      <p>Convention: <code>pages/404.tsx</code></p>
      <p>Tried to access: <strong>{location.pathname}</strong></p>
    </div>
  )
}
