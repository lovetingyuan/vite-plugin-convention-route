import { useParams } from 'react-router'

export default function OptionalDynamicPage() {
  const { id } = useParams()
  return (
    <div>
      <h1>Optional Dynamic Route</h1>
      <p>Route: <code>/:id?</code></p>
      <p>Convention: <code>pages/-[id]/index.tsx</code></p>
      <p>Current id: <strong>{id ?? '(none)'}</strong></p>
    </div>
  )
}
