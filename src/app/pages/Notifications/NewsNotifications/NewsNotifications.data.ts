import { NewsNotificationInterface, NewsType, PlatformType, StatusType } from './NewsNotifications.interface';

export const welcomeNewsNotificationsMockData: Array<NewsNotificationInterface> = [
  {
    id: '0e',
    createdAt: '2022-09-01T00:00:00.000Z',
    status: StatusType.New,
    type: NewsType.News,
    platform: PlatformType.Extension,
    language: 'en-US',
    title: 'Temple Wallet Greetings',
    description: 'Welcome message',
    content: 'Some welcome message lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem.',
    extensionImageUrl: 'https://pbs.twimg.com/profile_images/1364551906283110400/4Ts3YPJz_400x400.jpg',
    mobileImageUrl: 'https://pbs.twimg.com/profile_images/1364551906283110400/4Ts3YPJz_400x400.jpg',
    readInOriginalUrl: 'https://templewallet.com/'
  }
];
