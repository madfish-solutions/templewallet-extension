// import * as React from "react";
// import classNames from "clsx";
// import Popper from "lib/ui/Popper";
// import BigNumber from "bignumber.js";
// import DropdownWrapper from "app/atoms/DropdownWrapper";
// import { ReactComponent as ChevronDownIcon } from "app/icons/chevron-down.svg";
// import { ReactComponent as SignalAltIcon } from "app/icons/signal-alt.svg";

// type AssetSelectProps = {
//   symbol: string;
//   balance: BigNumber;
// };

// const ITEMS = [
//   {
//     symbol: "XTZ",
//   },
//   {
//     symbol: "KEK",
//   },
//   {
//     symbol: "LOLO",
//   },
//   {
//     symbol: "WOW",
//   },
//   {
//     symbol: "SASA",
//   },
// ];

// const AssetSelect: React.FC<AssetSelectProps> = ({ balance }) => {
//   const [expanded, setExpanded] = React.useState(false);

//   const handleClick = React.useCallback(() => {
//     setExpanded((e) => !e);
//   }, [setExpanded]);

//   return (
//     <>
//       <Popper
//         placement="bottom"
//         strategy="fixed"
//         popup={({ opened, setOpened }) => (
//           <DropdownWrapper opened={opened} className="origin-top">
//             {allNetworks.map(({ id, name, color, disabled }) => {
//               const selected = id === network.id;

//               return (
//                 <button
//                   key={id}
//                   className={classNames(
//                     "w-full",
//                     "mb-1",
//                     "rounded",
//                     "transition easy-in-out duration-200",
//                     !disabled &&
//                       (selected ? "bg-white-10" : "hover:bg-white-5"),
//                     disabled ? "cursor-default" : "cursor-pointer",
//                     "flex items-center",
//                     disabled && "opacity-25"
//                   )}
//                   style={{
//                     padding: "0.375rem 1.5rem 0.375rem 0.5rem",
//                   }}
//                   disabled={disabled}
//                   autoFocus={selected}
//                   onClick={() => {
//                     if (!disabled) {
//                       if (!selected) {
//                         setNetworkId(id);
//                       }
//                       setOpened(false);
//                     }
//                   }}
//                 >
//                   <div
//                     className={classNames(
//                       "mr-2 w-3 h-3",
//                       "border border-primary-white",
//                       "rounded-full",
//                       "shadow-xs"
//                     )}
//                     style={{ backgroundColor: color }}
//                   />

//                   <span className="text-white text-sm text-shadow-black">
//                     {name}
//                   </span>
//                 </button>
//               );
//             })}
//           </DropdownWrapper>
//         )}
//       >
//         {({ ref, opened, toggleOpened }) => (
//           <button
//             ref={ref}
//             className={classNames(
//               "px-2 py-1",
//               "bg-white-10 rounded",
//               "border border-primary-orange-25",
//               "text-primary-white text-shadow-black",
//               "text-xs font-medium",
//               "transition ease-in-out duration-200",
//               opened ? "shadow-md" : "shadow hover:shadow-md focus:shadow-md",
//               opened
//                 ? "opacity-100"
//                 : "opacity-90 hover:opacity-100 focus:opacity-100",
//               "flex items-center",
//               "select-none"
//             )}
//             onClick={toggleOpened}
//           >
//             <div
//               className={classNames(
//                 "mr-2",
//                 "w-3 h-3",
//                 "border border-primary-white",
//                 "rounded-full",
//                 "shadow-xs"
//               )}
//               style={{ backgroundColor: network.color }}
//             />

//             <span>{network.name}</span>

//             <ChevronDownIcon
//               className="ml-1 -mr-1 stroke-current stroke-2"
//               style={{ height: 16, width: "auto" }}
//             />
//           </button>
//         )}
//       </Popper>

//       <div className={classNames("mb-6", "border rounded-md")}>
//         {ITEMS.map(({ symbol }, i) =>
//           expanded || symbol === "XTZ" ? (
//             <div
//               key={symbol}
//               className={classNames("p-2", "flex items-center")}
//             >
//               <img src={xtzImgUrl} alt={symbol} className="h-12 w-auto mr-3" />

//               <div className="font-light leading-none">
//                 <div className="flex items-center">
//                   <div className="flex flex-col">
//                     <span className="text-xl text-gray-700">
//                       <Money>{balance}</Money>{" "}
//                       <span style={{ fontSize: "0.75em" }}>{symbol}</span>
//                     </span>

//                     <InUSD volume={balance}>
//                       {(usdBalance) => (
//                         <div className="mt-1 text-sm text-gray-500">
//                           ${usdBalance}
//                         </div>
//                       )}
//                     </InUSD>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ) : null
//         )}
//       </div>
//     </>
//   );
// };

// export default AssetSelect;
export {};
