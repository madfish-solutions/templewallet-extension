const padTo2Digits = (num: number) => num.toString().padStart(2, '0');

const formatAMPM = (date: Date) => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const finalMinutes = minutes < 10 ? '0' + minutes : minutes;

  return hours + ':' + finalMinutes + ' ' + ampm;
};

export const formatDate = (createdAt: string) => {
  const date = new Date(createdAt);

  return (
    [date.getFullYear(), padTo2Digits(date.getMonth() + 1), padTo2Digits(date.getDate())].join('-') +
    ' ' +
    formatAMPM(date)
  );
};
