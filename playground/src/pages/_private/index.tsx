export default function PrivatePage() {
  return (
    <div>
      <h1>Private Page</h1>
      <p>This file is ignored by the plugin (prefix: <code>_</code>).</p>
      <p>You should never see this rendered via routing.</p>
    </div>
  )
}
