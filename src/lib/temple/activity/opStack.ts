// interface OpStackItem {
//   type: OpStackItemType;
//   param: string;
// }

// function parseOpStack(operation: Repo.IOperation, address: string): OpStackItem[] {
//   const { localGroup, tzktGroup, bcdTokenTransfers } = operation.data;

//   if (tzktGroup) {
//     return tzktGroup.map((tg) => {
//       if (tg.type === "delegation") {
//         return {
//           type: OpStackItemType.Delegation,
//           param: tg.newDelegate
//         };
//       }

//       if (tg.type === "transaction") {
//         if (tg.parameters) {
//           return {
//             type: OpStackItemType.Interaction,
//             param: tg.target.address
//           }
//         }

//         if (tg.sender.address === address) {
//           return {
//             type: OpStackItemType.TransferTo,
//             param: tg.target.address
//           }
//         }

//         if (tg.target.address === address) {
//           return {
//             type: OpStackItemType.TransferFrom,
//             param: tg.sender.address
//           }
//         }
//       }

//       return null;
//     }).filter(Boolean) as OpStackItem[];
//   }

//   if (localGroup) {
//     return localGroup.map((localOp) => {
//       return null;
//     }).filter(Boolean) as OpStackItem[];
//   }

//   return [];
// }

export {};
