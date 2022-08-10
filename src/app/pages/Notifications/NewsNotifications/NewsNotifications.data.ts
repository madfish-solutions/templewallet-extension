import { NewsNotificationInterface, NewsType, PlatformType, StatusType } from './NewsNotifications.interface';

export const newsNotificationsMockData: Array<NewsNotificationInterface> = [
  {
    id: '1e',
    createdAt: '2020-01-01T00:00:00.000Z',
    status: StatusType.New,
    type: NewsType.News,
    platform: PlatformType.Extension,
    language: 'en-US',
    title: 'Temple Wallet',
    description: 'First news',
    content: 'First news lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem.',
    extensionImageUrl: 'https://pbs.twimg.com/profile_images/1364551906283110400/4Ts3YPJz_400x400.jpg',
    mobileImageUrl: 'https://pbs.twimg.com/profile_images/1364551906283110400/4Ts3YPJz_400x400.jpg',
    readInOriginalUrl: 'https://templewallet.com/'
  },
  {
    id: '1m',
    createdAt: '2020-01-01T00:00:00.000Z',
    status: StatusType.New,
    type: NewsType.News,
    platform: PlatformType.Mobile,
    language: 'en-US',
    title: 'Temple Wallet Mobile',
    description: 'First news',
    content: 'First news lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem.',
    extensionImageUrl: 'https://pbs.twimg.com/profile_images/1364551906283110400/4Ts3YPJz_400x400.jpg',
    mobileImageUrl: 'https://pbs.twimg.com/profile_images/1364551906283110400/4Ts3YPJz_400x400.jpg',
    readInOriginalUrl: 'https://templewallet.com/'
  },
  {
    id: '2e',
    createdAt: '2022-02-01T00:00:00.000Z',
    status: StatusType.Read,
    type: NewsType.News,
    platform: PlatformType.Extension,
    language: 'en-US',
    title: 'Temple Wallet',
    description: 'Second news',
    content: 'Second news lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem.',
    extensionImageUrl: 'https://mj-gallery.com/ce5347a1-000e-4d77-8703-aef971c835ee/grid_0.png',
    mobileImageUrl: 'https://mj-gallery.com/ce5347a1-000e-4d77-8703-aef971c835ee/grid_0.png',
    readInOriginalUrl: 'https://templewallet.com/'
  },
  {
    id: '2m',
    createdAt: '2022-02-01T00:00:00.000Z',
    status: StatusType.Read,
    type: NewsType.News,
    platform: PlatformType.Mobile,
    language: 'en-US',
    title: 'Temple Wallet Mobile',
    description: 'Second news',
    content: 'Second news lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem.',
    extensionImageUrl: 'https://mj-gallery.com/ce5347a1-000e-4d77-8703-aef971c835ee/grid_0.png',
    mobileImageUrl: 'https://mj-gallery.com/ce5347a1-000e-4d77-8703-aef971c835ee/grid_0.png',
    readInOriginalUrl: 'https://templewallet.com/'
  },
  {
    id: '3e',
    createdAt: '2022-01-01T00:00:00.000Z',
    status: StatusType.Read,
    type: NewsType.ApplicationUpdate,
    platform: PlatformType.Extension,
    language: 'en-US',
    title: 'Temple Wallet',
    description: 'Very important update',
    content: 'Very important update lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem.',
    extensionImageUrl:
      'https://assets.objkt.media/file/assets-003/QmbatSRJHqPzbvVLAxQkQFeHumWdiSSXSTY4VxBbawwJxb/artifact',
    mobileImageUrl:
      'https://assets.objkt.media/file/assets-003/QmbatSRJHqPzbvVLAxQkQFeHumWdiSSXSTY4VxBbawwJxb/artifact',
    readInOriginalUrl: 'https://templewallet.com/'
  },
  {
    id: '3m',
    createdAt: '2022-01-01T00:00:00.000Z',
    status: StatusType.Read,
    type: NewsType.ApplicationUpdate,
    platform: PlatformType.Mobile,
    language: 'en-US',
    title: 'Temple Wallet Mobile',
    description: 'Very important update',
    content: 'Very important update lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem.',
    extensionImageUrl:
      'https://assets.objkt.media/file/assets-003/QmbatSRJHqPzbvVLAxQkQFeHumWdiSSXSTY4VxBbawwJxb/artifact',
    mobileImageUrl:
      'https://assets.objkt.media/file/assets-003/QmbatSRJHqPzbvVLAxQkQFeHumWdiSSXSTY4VxBbawwJxb/artifact',
    readInOriginalUrl: 'https://templewallet.com/'
  },
  {
    id: '4e',
    createdAt: '2022-01-03T00:00:00.000Z',
    status: StatusType.New,
    type: NewsType.ApplicationUpdate,
    platform: PlatformType.Extension,
    language: 'en-US',
    title: 'Temple Wallet',
    description: 'Very important unread update',
    content: 'Very important unread update lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem.',
    extensionImageUrl: 'https://mj-gallery.com/8c84ef87-eaec-42e8-9e58-7e4ca530030e/grid_0.png',
    mobileImageUrl: 'https://mj-gallery.com/8c84ef87-eaec-42e8-9e58-7e4ca530030e/grid_0.png',
    readInOriginalUrl: 'https://templewallet.com/'
  },
  {
    id: '4m',
    createdAt: '2022-01-03T00:00:00.000Z',
    status: StatusType.New,
    type: NewsType.ApplicationUpdate,
    platform: PlatformType.Mobile,
    language: 'en-US',
    title: 'Temple Wallet Mobile',
    description: 'Very important unread update',
    content: 'Very important unread update lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem.',
    extensionImageUrl: 'https://mj-gallery.com/8c84ef87-eaec-42e8-9e58-7e4ca530030e/grid_0.png',
    mobileImageUrl: 'https://mj-gallery.com/8c84ef87-eaec-42e8-9e58-7e4ca530030e/grid_0.png',
    readInOriginalUrl: 'https://templewallet.com/'
  },
  {
    id: '5e',
    createdAt: '2022-01-01T00:00:00.000Z',
    status: StatusType.New,
    type: NewsType.Alert,
    platform: PlatformType.Extension,
    language: 'en-US',
    title: 'Temple Wallet',
    description: 'Very important unread alert',
    content: 'Very important unread alert lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem.',
    extensionImageUrl: 'https://mj-gallery.com/119d8b55-41b6-49fb-bfd2-5e6e46355363/grid_0.png',
    mobileImageUrl: 'https://mj-gallery.com/119d8b55-41b6-49fb-bfd2-5e6e46355363/grid_0.png',
    readInOriginalUrl: 'https://templewallet.com/'
  },
  {
    id: '5m',
    createdAt: '2022-01-01T00:00:00.000Z',
    status: StatusType.New,
    type: NewsType.Alert,
    platform: PlatformType.Mobile,
    language: 'en-US',
    title: 'Temple Wallet Mobile',
    description: 'Very important unread alert',
    content: 'Very important unread alert lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem.',
    extensionImageUrl: 'https://mj-gallery.com/119d8b55-41b6-49fb-bfd2-5e6e46355363/grid_0.png',
    mobileImageUrl: 'https://mj-gallery.com/119d8b55-41b6-49fb-bfd2-5e6e46355363/grid_0.png',
    readInOriginalUrl: 'https://templewallet.com/'
  },
  {
    id: '6e',
    createdAt: '2022-01-02T00:00:00.000Z',
    status: StatusType.Read,
    type: NewsType.Alert,
    platform: PlatformType.Extension,
    language: 'en-US',
    title: 'Temple Wallet',
    description: 'Very important alert readed',
    content: 'Very important alert readed lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem.',
    extensionImageUrl: 'https://mj-gallery.com/876c08c5-3ead-4fd8-99ba-215812e03885/grid_0.png',
    mobileImageUrl: 'https://mj-gallery.com/876c08c5-3ead-4fd8-99ba-215812e03885/grid_0.png',
    readInOriginalUrl: 'https://templewallet.com/'
  },
  {
    id: '6m',
    createdAt: '2022-01-02T00:00:00.000Z',
    status: StatusType.Read,
    type: NewsType.Alert,
    platform: PlatformType.Mobile,
    language: 'en-US',
    title: 'Temple Wallet Mobile',
    description: 'Very important alert readed',
    content: 'Very important alert readed lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem.',
    extensionImageUrl: 'https://mj-gallery.com/876c08c5-3ead-4fd8-99ba-215812e03885/grid_0.png',
    mobileImageUrl: 'https://mj-gallery.com/876c08c5-3ead-4fd8-99ba-215812e03885/grid_0.png',
    readInOriginalUrl: 'https://templewallet.com/'
  }
];

export const welcomeNewsNotificationsMockData: Array<NewsNotificationInterface> = [
  {
    id: '0e',
    createdAt: '2020-01-01T00:00:00.000Z',
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
  },
  {
    id: '0m',
    createdAt: '2020-01-01T00:00:00.000Z',
    status: StatusType.New,
    type: NewsType.News,
    platform: PlatformType.Mobile,
    language: 'en-US',
    title: 'Temple Wallet Greetings',
    description: 'Welcome message',
    content: 'Some welcome message lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem.',
    extensionImageUrl: 'https://pbs.twimg.com/profile_images/1364551906283110400/4Ts3YPJz_400x400.jpg',
    mobileImageUrl: 'https://pbs.twimg.com/profile_images/1364551906283110400/4Ts3YPJz_400x400.jpg',
    readInOriginalUrl: 'https://templewallet.com/'
  }
];
