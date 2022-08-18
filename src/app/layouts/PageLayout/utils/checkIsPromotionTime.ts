export const checkIsPromotionTime = () => {
  const now = new Date().getTime();
  const promotionStart = new Date('2022-08-24T00:00:00').getTime();
  const promotionEnd = new Date('2022-09-07T00:30:00').getTime();

  return now >= promotionStart && now <= promotionEnd;
};
