import { NewsNotificationInterface, NewsType, PlatformType, StatusType } from './news-interfaces';

export const welcomeNewsNotificationsMockData: Array<NewsNotificationInterface> = [
  {
    id: '0e',
    createdAt: '2022-09-01T00:00:00.000Z',
    status: StatusType.New,
    type: NewsType.News,
    platform: PlatformType.Extension,
    language: 'en-US',
    title: 'Just a heads up!',
    description: `• Jakarta protocol testnet is up. 
    \n• Ghostnet is now supported.
    \n• QuipuSwap Stable pools, Plenty Sta...`,
    content: `On June 27 we expect a Tezos protocol update, which entails some common network hurdles.

    \nNamely, on June 27-29 Exolix will be updating their software. Our integrated top-up service will not be 
available on those days.
    
    \nAdditionally, CEXes will likely enter the maintenance mode and temporarily suspend Tezos transactions.
    
    
    \n\nPlan accordingly and have a great`,
    extensionImageUrl: 'https://pbs.twimg.com/profile_images/1364551906283110400/4Ts3YPJz_400x400.jpg',
    mobileImageUrl: 'https://pbs.twimg.com/profile_images/1364551906283110400/4Ts3YPJz_400x400.jpg',
    readInOriginalUrl: 'https://templewallet.com/'
  }
];
