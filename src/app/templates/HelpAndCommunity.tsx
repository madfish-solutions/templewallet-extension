import React, { FC, SVGProps } from "react";

import { ReactComponent as CannyIcon } from "app/icons/canny.svg";
import { ReactComponent as DiscordIcon } from "app/icons/discord.svg";
import { ReactComponent as HelpCrunchIcon } from "app/icons/helpcrunch.svg";
import { ReactComponent as RedditIcon } from "app/icons/reddit.svg";
import { ReactComponent as TelegramIcon } from "app/icons/telegram.svg";
import { ReactComponent as TwitterIcon } from "app/icons/twitter.svg";
import { ReactComponent as YoutubeIcon } from "app/icons/youtube.svg";
import { T } from "lib/i18n/react";

const links = [
  {
    name: "Knowledge Base",
    href: "https://madfish.crunch.help/temple-wallet",
    background: "#2182f7",
    Icon: HelpCrunchIcon,
  },
  {
    name: "Feature Request",
    href: "https://madfish.canny.io/feature-requests",
    Icon: CannyIcon,
  },
  {
    name: "Twitter",
    href: "https://twitter.com/madfishofficial",
    background: "#1DA1F2",
    Icon: TwitterIcon,
  },
  {
    name: "Telegram",
    href: "https://t.me/MadFishCommunity",
    background: "#26A5E4",
    Icon: TelegramIcon,
  },
  {
    name: "Discord",
    href: "https://www.madfish.solutions/discord",
    background: "#7289DA",
    Icon: DiscordIcon,
  },
  {
    name: "Reddit",
    href: "https://www.reddit.com/r/MadFishCommunity",
    background: "#FF4500",
    Icon: RedditIcon,
  },
  {
    name: "Youtube",
    href: "https://www.youtube.com/channel/UCUp80EXfJEigks3xU5hiwyA",
    background: "#FF0000",
    Icon: YoutubeIcon,
  },
];

const HelpAndCommunity: FC = () => {
  return (
    <div className="w-full max-w-sm mx-auto my-8 text-sm text-gray-700">
      <p>
        <T id="communityResourcesTitle" />
      </p>
      <ul className="my-2">
        {links.map(({ name, href, background, Icon }) => (
          <ResourceLink
            key={name}
            name={name}
            href={href}
            background={background}
            Icon={Icon}
          />
        ))}
      </ul>
      <p>
        <T id="joinPrompt" />
      </p>
    </div>
  );
};

export default HelpAndCommunity;

type ResourceLinkProps = {
  name: string;
  href: string;
  background?: string;
  Icon: React.FC<SVGProps<SVGSVGElement>>;
};

const ResourceLink: FC<ResourceLinkProps> = ({
  name,
  href,
  background,
  Icon,
}) => {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center py-1 my-1 hover:underline text-blue-600"
      >
        <div
          className="mr-4 w-8 h-8 flex justify-center items-center rounded-md"
          style={{ background, padding: background ? "0.375rem" : 0 }}
        >
          <Icon className="h-full w-auto" />
        </div>
        {name}
      </a>
    </li>
  );
};
