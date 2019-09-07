import * as React from "react";
import PageLayout from "app/layouts/Page";
import WidthContainer from "app/layouts/WidthContainer";
import { Game } from "app/games";

const DiceGame = React.lazy(() => import("app/games/Dice"));

const COMPONENT_MAP = {
  [Game.Dice]: DiceGame
};

interface GamePageProps {
  game: Game.Dice;
  platform?: string | null;
}

const GamePage: React.FC<GamePageProps> = ({ game, platform }) => {
  const GameComponent: React.FC<any> = COMPONENT_MAP[game];

  return (
    <PageLayout>
      <WidthContainer className="py-20 flex flex-row items-center justify-center">
        <GameComponent platform={platform} />
      </WidthContainer>
    </PageLayout>
  );
};

export default GamePage;
