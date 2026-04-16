import { Outlet } from 'react-router'

export default function AuthLayout() {
  return (
    <div style={{ border: '2px solid #4f46e5', borderRadius: '8px', padding: '1rem' }}>
      <p style={{ color: '#4f46e5', fontWeight: 'bold' }}>Auth Group Layout (no path segment)</p>
      <p>Convention: <code>pages/(auth)/layout.tsx</code></p>
      <Outlet />
    </div>
  )
}
