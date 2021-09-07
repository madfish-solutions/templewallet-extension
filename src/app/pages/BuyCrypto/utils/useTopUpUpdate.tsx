import {useEffect} from "react";

import {exchangeDataInterface, getExchangeData} from "../../../../lib/templewallet-api/exolix";

const useTopUpUpdate = (
    exchangeData: exchangeDataInterface | null,
    setExchangeData: (exchangeData: exchangeDataInterface | null) => void,
    setIsError: (isError: boolean) => void
) => {
    useEffect(() => {
        const statusCheck = setTimeout(function repeat() {
            (async () => {
                try {
                    const data = await getExchangeData(exchangeData!.id);
                    console.log({data});
                    setExchangeData(data);
                    setTimeout(repeat, 3000);
                } catch (e) {
                    setIsError(true)
                }
            })()
        }, 3000)
        return () => {
            clearTimeout(statusCheck);
        }
    }, [exchangeData!.id])
};

export default useTopUpUpdate;
