import Analytics from 'analytics-node';

const client = new Analytics(process.env.TEMPLE_WALLET_SEGMENT_WRITE_KEY ?? '');

export const trackEvent = (event: string) => {
    console.log('event');

    client.track({
        event,
        userId: 'user id'
    });
}
