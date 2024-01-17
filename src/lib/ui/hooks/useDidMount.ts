import { useEffect } from 'react';

export const useDidMount = (callback: EmptyFn) => useEffect(() => void callback(), []);
