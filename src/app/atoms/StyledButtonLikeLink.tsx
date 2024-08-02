import React, { memo } from 'react';

import { ButtonLikeStylingProps, useStyledButtonOrLinkProps } from 'lib/ui/button-like-styles';
import { Link, LinkProps } from 'lib/woozie/Link';

export const StyledButtonLikeLink = memo<LinkProps & ButtonLikeStylingProps>(inputProps => {
  const linkProps = useStyledButtonOrLinkProps(inputProps);

  return <Link {...linkProps} />;
});
