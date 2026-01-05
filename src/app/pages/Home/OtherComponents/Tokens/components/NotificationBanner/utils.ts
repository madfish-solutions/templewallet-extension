export const makeAnimationOptions = (animationData: any) =>
  ({
    loop: true,
    autoplay: true,
    animationData,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    }
  } as const);
