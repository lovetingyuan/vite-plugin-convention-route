import { createBrowserRouter, RouterProvider } from 'react-router'
import routes from 'virtual:route?routePath=/src/pages'

const router = createBrowserRouter(routes)

export default function App() {
  return <RouterProvider router={router} />
}
