import { useParams } from 'react-router'

export default function SplatPage() {
  const { '*': splat } = useParams()
  return (
    <div>
      <h1>Splat Route</h1>
      <p>Route: <code>/slug/*</code></p>
      <p>Convention: <code>pages/[...slug]/index.tsx</code></p>
      <p>Splat: <strong>{splat ?? '(none)'}</strong></p>
    </div>
  )
}
