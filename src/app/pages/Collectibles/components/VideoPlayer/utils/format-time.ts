export const formatTime = (timeInSeconds: number): string => {
  const result = new Date(Math.round(timeInSeconds) * 1000).toISOString().substring(11, 19);
  // if duration is over hour
  if (+result.substring(0, 2) > 0) {
    // show 00:00:00
    return result;
  } else {
    // else show 00:00
    return result.substring(3);
  }
};
