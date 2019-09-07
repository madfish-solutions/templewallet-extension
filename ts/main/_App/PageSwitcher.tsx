import * as React from "react";
import * as PathRouter from "pathRouter";
import { useLocationContext, Redirect } from "persist/location";
import { Game } from "app/games";

const NotFoundPage = React.lazy(() => import("app/pages/NotFound"));
const HomePage = React.lazy(() => import("app/pages/Home"));
const GamePage = React.lazy(() => import("app/pages/Game"));

const ROUTE_MAP = PathRouter.prepare([
  ["/", () => <HomePage />],
  ["/game", () => <Redirect to="/" />],
  [
    "/game/:game/:platform?",
    ({ game, platform }) =>
      Object.values(Game).includes(game as Game) ? (
        <GamePage game={game as Game} platform={platform} />
      ) : (
        PathRouter.NOT_FOUND
      )
  ],
  ["*", () => <NotFoundPage />]
]);

const PageSwitcher: React.FC = () => {
  const { pathname } = useLocationContext();
  return PathRouter.resolve(pathname, ROUTE_MAP);
};

export default PageSwitcher;
