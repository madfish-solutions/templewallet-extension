import { use } from 'react';

const importPartnersPromotionModule = async () => {
  try {
    return await import('app/templates/partners-promotion/partners-promotion');
  } catch {
    return null;
  }
};

const importPromise = importPartnersPromotionModule();

export const usePartnersPromotionModule = () => use(importPromise);
