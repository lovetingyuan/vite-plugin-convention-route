declare module "virtual:route*" {
  import { type RouteObject } from "react-router";
  const routes: RouteObject[];
  export default routes;
}
