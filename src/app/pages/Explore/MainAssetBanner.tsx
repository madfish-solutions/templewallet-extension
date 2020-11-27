import * as React from "react";
import classNames from "clsx";
import { ThanosAsset } from "lib/thanos/front";
import AssetIcon from "app/templates/AssetIcon";
import Balance from "app/templates/Balance";
import InUSD from "app/templates/InUSD";
import Name from "app/atoms/Name";
import Money from "app/atoms/Money";

type MainAssetBannerProps = {
  asset: ThanosAsset;
  accountPkh: string;
  className?: string;
};

const MainAssetBanner: React.FC<MainAssetBannerProps> = ({
  asset,
  accountPkh,
  className,
}) => {
  return (
    <div
      className={classNames(
        "w-full mx-auto",
        "pt-1",
        "flex flex-col items-center",
        className
      )}
      style={{ maxWidth: "19rem" }}
    >
      <div
        className={classNames(
          "relative",
          "w-full",
          "border rounded-md",
          "p-2",
          "flex items-center"
        )}
      >
        <div
          className={classNames(
            "absolute top-0 left-0 right-0",
            "flex justify-center"
          )}
        >
          <div
            className={classNames(
              "-mt-4 py-1 px-2",
              "bg-white rounded-full",
              "text-sm font-light text-center",
              "text-gray-500"
            )}
          >
            <Name style={{ maxWidth: "13rem" }}>{asset.name}</Name>
          </div>
        </div>

        <AssetIcon asset={asset} size={48} className="mr-3" />

        <div className="font-light leading-none">
          <div className="flex items-center">
            <Balance address={accountPkh} asset={asset}>
              {(balance) => (
                <div className="flex flex-col">
                  <span className="text-xl text-gray-700">
                    <Money>{balance}</Money>{" "}
                    <span className="text-lg opacity-90">{asset.symbol}</span>
                  </span>

                  <InUSD volume={balance}>
                    {(usdBalance) => (
                      <div className="mt-1 text-sm text-gray-500">
                        ${usdBalance}
                      </div>
                    )}
                  </InUSD>
                </div>
              )}
            </Balance>
          </div>
        </div>
      </div>
    </div>
  );

  // return (
  //   <div className="flex flex-col items-center justify-around p-2">
  //     <AssetIcon asset={asset} size={56} />

  //     <Name
  //       className={classNames(
  //         "mt-1 w-16",
  //         "text-center",
  //         "text-xs text-gray-600 font-medium leading-tight"
  //       )}
  //     >
  //       {asset.name}
  //     </Name>

  //     <Balance address={accountPkh} asset={asset}>
  //       {(balance) => (
  //         <div className="flex flex-col items-center">
  //           <div className="text-2xl font-light text-gray-800">
  //             <Money>{balance}</Money>{" "}
  //             <span className="text-lg opacity-90">{asset.symbol}</span>
  //           </div>

  //           <InUSD volume={balance} asset={asset}>
  //             {(usdBalance) => (
  //               <div className="text-lg font-light text-gray-600">
  //                 <span className="mr-px">$</span>
  //                 {usdBalance} <span className="text-sm opacity-75">USD</span>
  //               </div>
  //             )}
  //           </InUSD>
  //         </div>
  //       )}
  //     </Balance>
  //   </div>
  // );

  // return (
  //   <div
  //     className={classNames(
  //       "w-full flex items-center justify-center",
  //       className
  //     )}
  //   >
  //     <div className="flex items-center">
  //       <AssetIcon asset={asset} size={56} className="mr-3" />

  //       <Balance address={accountPkh} asset={asset}>
  //         {(balance) => (
  //           <div className="flex flex-col items-start">
  //             <div className="text-2xl font-light text-gray-800">
  //               <Money>{balance}</Money>{" "}
  //               <span className="text-lg opacity-90">{asset.symbol}</span>
  //             </div>

  //             <InUSD volume={balance} asset={asset}>
  //               {(usdBalance) => (
  //                 <div className="text-lg font-light text-gray-600">
  //                   <span className="mr-px">$</span>
  //                   {usdBalance} <span className="text-sm opacity-75">USD</span>
  //                 </div>
  //               )}
  //             </InUSD>
  //           </div>
  //         )}
  //       </Balance>
  //     </div>
  //   </div>
  // );
};

export default MainAssetBanner;
