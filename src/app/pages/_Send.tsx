// import * as React from "react";
// import classNames from "clsx";
// import { useForm, Controller } from "react-hook-form";
// import { useReadyThanos, useBalance } from "lib/thanos/front";
// import PageLayout from "app/layouts/PageLayout";
// import Money from "app/atoms/Money";
// import FormField from "app/atoms/FormField";
// import FormSubmitButton from "app/atoms/FormSubmitButton";
// import xtzImgUrl from "app/misc/xtz.png";
// import { ReactComponent as SendIcon } from "app/icons/send.svg";

// interface FormData {
//   address: string;
//   amount: string;
//   fee: string;
// }

// const DEFAULT_FEES = [
//   {
//     name: "Slow",
//     fee: 0.01
//   },
//   {
//     name: "Average",
//     fee: 0.02
//   },
//   {
//     name: "Fast",
//     fee: 0.04
//   }
// ];

// const Send: React.FC = () => {
//   const { account } = useReadyThanos();

//   const balRes = useBalance(account.publicKeyHash, true);
//   const balance = balRes.data!;

//   const assetSymbol = "XTZ";

//   const {
//     watch,
//     register,
//     handleSubmit,
//     errors,
//     control,
//     // triggerValidation,
//     formState,
//     setValue
//   } = useForm<FormData>();

//   const amountValue = watch("amount");
//   const setAmountValue = React.useCallback(
//     (val: string) => setValue("amount", val),
//     [setValue]
//   );
//   const handleAmountInput = React.useCallback(
//     evt => {
//       const { value } = evt.target;
//       ensureNumber(value, 8, setAmountValue);
//     },
//     [setAmountValue]
//   );

//   const feeValue = watch("fee", String(TRX_FEE.small));
//   const setFeeValue = React.useCallback((val: string) => setValue("fee", val), [
//     setValue
//   ]);
//   const handleFeeInput = React.useCallback(
//     evt => {
//       const { value } = evt.target;
//       ensureNumber(value, 8, setFeeValue);
//     },
//     [setFeeValue]
//   );

//   // const secondaryAmount = React.useMemo(() => {
//   //   if (isPrimaryExchange) {
//   //     return getValidNumber(String(+primaryAmount / primaryRate), 2) || 0;
//   //   } else {
//   //     return getValidNumber(String(+primaryAmount * primaryRate)) || 0;
//   //   }
//   // }, [isPrimaryExchange, primaryAmount]);

//   // const toggleExchange = React.useCallback(
//   //   (e: React.MouseEvent) => {
//   //     e.preventDefault();
//   //     setPrimaryAmount(String(secondaryAmount));
//   //     return setPrimaryExchange(!isPrimaryExchange);
//   //   },
//   //   [isPrimaryExchange, secondaryAmount, setPrimaryAmount]
//   // );

//   // const isActiveTrxFeeBtn = React.useCallback(
//   //   (btnName: TRX_FEE_KEYS): boolean => {
//   //     return +feeValue === TRX_FEE[btnName];
//   //   },
//   //   [feeValue]
//   // );

//   // const handleChange = React.useCallback(
//   //   (
//   //     evt: React.ChangeEvent<HTMLInputElement>,
//   //     setMethod: (val: React.SetStateAction<string>) => string | void,
//   //     decimals?: number
//   //   ) => {
//   //     let val = evt.target.value.replace(/ /g, "").replace(/,/g, ".");

//   //     const validNumber = getValidNumber(val, decimals);
//   //     if (typeof validNumber === "string") {
//   //       setMethod(validNumber);
//   //     }
//   //   },
//   //   []
//   // );

//   // const handleChangeAmount = React.useCallback(
//   //   (e: React.ChangeEvent<HTMLInputElement>): void =>
//   //     handleChange(e, setPrimaryAmount, !isPrimaryExchange ? 2 : undefined),
//   //   [handleChange, isPrimaryExchange, setPrimaryAmount]
//   // );

//   // const handleChangeTrxFee = React.useCallback(
//   //   (e: React.ChangeEvent<HTMLInputElement>): void =>
//   //     handleChange(e, setTrxFee),
//   //   [handleChange, setTrxFee]
//   // );

//   // React.useEffect(() => {
//   //   if (formState.isSubmitted) triggerValidation("primaryAmount");
//   // }, [errors, formState, primaryAmount, triggerValidation]);

//   const onSubmit = React.useCallback(
//     async (data: FormData) => {
//       console.info(data);
//     },
//     []
//     // async (data: FormData) => {
//     //   const fetchData = () => new Promise(res => setTimeout(res, 800));

//     //   try {
//     //     const amountXTZ = isPrimaryExchange ? primaryAmount : secondaryAmount;

//     //     await fetchData();
//     //     console.log({ ...data, amountXTZ });
//     //   } catch (err) {
//     //     if (process.env.NODE_ENV === "development") {
//     //       console.error(err);
//     //     }

//     //     alert(err.message);
//     //   }
//     // },
//     // [isPrimaryExchange, primaryAmount, secondaryAmount]
//   );

//   return (
//     <PageLayout
//       pageTitle={
//         <>
//           <SendIcon
//             className={classNames("mr-1 h-4 w-auto", "stroke-current")}
//           />{" "}
//           Send
//         </>
//       }
//     >
//       <div className="py-4">
//         <div className={classNames("w-full max-w-sm mx-auto")}>
//           <form onSubmit={handleSubmit(onSubmit)}>
//             <div className="flex items-center mb-4 border p-2 rounded-md">
//               <img
//                 src={xtzImgUrl}
//                 alt={assetSymbol}
//                 className="h-12 w-auto mr-2"
//               />

//               <div className="font-light leading-none">
//                 <div className="text-xl font-normal text-gray-800 mb-1">
//                   {assetSymbol}
//                 </div>

//                 <div className="text-base text-gray-600">
//                   Balance: <Money>{balance}</Money> {assetSymbol}
//                 </div>
//               </div>
//             </div>

//             <FormField
//               ref={register({
//                 required: "Required"
//               })}
//               name="address"
//               id="send-address"
//               label="Recipient address"
//               labelDescription={`Address to send ${assetSymbol} funds to`}
//               placeholder="tz1a9w1S7h..."
//               errorCaption={errors.address?.message}
//               containerClassName="mb-4"
//             />

//             <Controller
//               as={AssetField}
//               control={control}
//               rules={{
//                 required: "Required",
//                 validate: {
//                   min: v => {
//                     // const primaryValue = 0.1 + +trxFee;
//                     // const minValue = isPrimaryExchange
//                     //   ? primaryValue
//                     //   : primaryValue / primaryRate;
//                     // const message = `Minimal value: ${minValue}`;
//                     // return +v >= minValue || message;
//                     return v && true;
//                   },
//                   max: v => {
//                     // const primaryValue = balance - +trxFee;
//                     // const maxValue = isPrimaryExchange
//                     //   ? primaryValue
//                     //   : primaryValue / primaryRate;
//                     // const message = `Maximal value: ${maxValue}`;
//                     // return +v <= maxValue || message;
//                     return v && true;
//                   }
//                 }
//               }}
//               name="amount"
//               id="send-amount"
//               label="Amount"
//               type="text"
//               placeholder="e.g. 123.45"
//               errorCaption={errors.amount?.message}
//               containerClassName="mb-4"
//             />

//             {/* <FormField
//               name="amount"
//               id="send-amount"
//               label="Amount"
//               value={amountValue}
//               onInput={handleAmountInput}
//               labelDescription={`${secondaryAmount} ${
//                 isPrimaryExchange ? "USD" : "XTZ"
//               }`}
//               placeholder="e.g. 123.45"
//               errorCaption={errors.amount?.message}
//               extraButton={
//                 <FormSubmitButton
//                   onClick={toggleExchange}
//                   className="ml-2 px-2"
//                 >
//                   Max
//                 </FormSubmitButton>
//               }
//               containerClassName="mb-4"
//             /> */}

//             <Controller
//               as={AssetField}
//               control={control}
//               rules={{
//                 required: "Required"
//               }}
//               id="send-fee"
//               name="fee"
//               type="text"
//               label="Transaction fee"
//               placeholder="0"
//               labelDescription={
//                 <div className="mt-1">
//                   <button
//                     className={classNames(
//                       "mr-2 border rounded-md p-2",
//                       isActiveTrxFeeBtn("small") &&
//                         "text-primary-orange hover:text-primary-orange border-primary-orange",
//                       "cursor-pointer hover:text-gray-800"
//                     )}
//                     onClick={(e: any) => {
//                       e.preventDefault();
//                       setFeeValue(String(TRX_FEE.small));
//                     }}
//                   >
//                     Slow <br /> ({TRX_FEE.small} XTZ)
//                   </button>
//                   <button
//                     className={classNames(
//                       "mr-2 border rounded-md p-2",
//                       "cursor-pointer hover:text-gray-800",
//                       isActiveTrxFeeBtn("medium") &&
//                         "text-primary-orange hover:text-primary-orange border-primary-orange"
//                     )}
//                     onClick={(e: any) => {
//                       e.preventDefault();
//                       setFeeValue(String(TRX_FEE.medium));
//                     }}
//                   >
//                     Average <br /> ({TRX_FEE.medium} XTZ)
//                   </button>
//                   <button
//                     className={classNames(
//                       "mr-2 border rounded-md p-2",
//                       isActiveTrxFeeBtn("large") &&
//                         "text-primary-orange hover:text-primary-orange border-primary-orange",
//                       "cursor-pointer hover:text-gray-800"
//                     )}
//                     onClick={(e: any) => {
//                       e.preventDefault();
//                       setFeeValue(String(TRX_FEE.large));
//                     }}
//                   >
//                     Fast <br /> ({TRX_FEE.large} XTZ)
//                   </button>
//                 </div>
//               }
//               errorCaption={errors.fee ? "Invalid transaction fee" : null}
//               containerClassName="mb-4"
//             />

//             {/* <FormField
//               value={feeValue}
//               onInput={handleFeeInput}
//               id="send-fee"
//               name="fee"
//               label="Transaction fee"
//               placeholder="0"
//               labelDescription={
//                 <div className="mt-1">
//                   <button
//                     className={classNames(
//                       "mr-2 border rounded-md p-2",
//                       isActiveTrxFeeBtn("small") &&
//                         "text-primary-orange hover:text-primary-orange border-primary-orange",
//                       "cursor-pointer hover:text-gray-800"
//                     )}
//                     onClick={(e: any) => {
//                       e.preventDefault();
//                       setFeeValue(String(TRX_FEE.small));
//                     }}
//                   >
//                     Slow <br /> ({TRX_FEE.small} XTZ)
//                   </button>
//                   <button
//                     className={classNames(
//                       "mr-2 border rounded-md p-2",
//                       "cursor-pointer hover:text-gray-800",
//                       isActiveTrxFeeBtn("medium") &&
//                         "text-primary-orange hover:text-primary-orange border-primary-orange"
//                     )}
//                     onClick={(e: any) => {
//                       e.preventDefault();
//                       setFeeValue(String(TRX_FEE.medium));
//                     }}
//                   >
//                     Average <br /> ({TRX_FEE.medium} XTZ)
//                   </button>
//                   <button
//                     className={classNames(
//                       "mr-2 border rounded-md p-2",
//                       isActiveTrxFeeBtn("large") &&
//                         "text-primary-orange hover:text-primary-orange border-primary-orange",
//                       "cursor-pointer hover:text-gray-800"
//                     )}
//                     onClick={(e: any) => {
//                       e.preventDefault();
//                       setFeeValue(String(TRX_FEE.large));
//                     }}
//                   >
//                     Fast <br /> ({TRX_FEE.large} XTZ)
//                   </button>
//                 </div>
//               }
//               errorCaption={errors.fee ? "Invalid transaction fee" : null}
//               containerClassName="mb-4"
//             /> */}

//             <FormSubmitButton loading={formState.isSubmitting}>
//               Send
//             </FormSubmitButton>
//           </form>
//         </div>
//       </div>
//     </PageLayout>
//   );
// };

// export default Send;

// type AssetFieldProps = React.ComponentProps<typeof FormField>;

// const AssetField: React.FC<AssetFieldProps> = ({
//   defaultValue,
//   onChange,
//   ...rest
// }) => {
//   // const [value, setValue] = React.useState(defaultValue ?? "");
//   const handleChange = React.useCallback(
//     evt => {
//       ensureNumber(evt.target.value, 8, v => {
//         if (onChange) {
//           onChange(evt);
//         }
//         setValue(v);
//       });
//     },
//     [onChange]
//   );

//   return (
//     <FormField
//       defaultValue={defaultValue}
//       value={value}
//       onChange={handleChange}
//       {...rest}
//     />
//   );
// };

// function ensureNumber(value: string, decimals = 4, cb: (v: string) => void) {
//   let val = value.replace(/ /g, "").replace(/,/g, ".");
//   let numVal = +val;
//   const indexOfDot = val.indexOf(".");
//   if (indexOfDot !== -1 && val.length - indexOfDot > decimals + 1) {
//     val = val.substring(0, indexOfDot + decimals + 1);
//     numVal = +val;
//   }
//   if (!isNaN(numVal) && numVal >= 0 && numVal < Number.MAX_SAFE_INTEGER) {
//     cb(val);
//   }
// }
export {};
