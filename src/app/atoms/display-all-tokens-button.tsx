import { T } from 'lib/i18n';

import { StyledButton } from './StyledButton';

interface Props {
  onClick?: EmptyFn;
}

export const DisplayAllTokensButton = ({ onClick }: Props) => (
  <StyledButton color="secondary-low" size="S" onClick={onClick}>
    <T id="displayAllTokens" />
  </StyledButton>
);
