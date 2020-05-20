// import {
//   AppMetadata,
//   BeaconMessage,
//   BeaconMessageType,
//   ChromeMessageTransport,
//   ChromeStorage,
//   ExtensionMessage,
//   ExtensionMessageTarget,
//   P2PCommunicationClient,
//   PermissionRequest,
//   PermissionResponse,
//   Serializer,
//   Transport,
//   TransportType,
//   Origin
// } from "@airgap/beacon-sdk";
// import { BeaconClient } from "@airgap/beacon-sdk/dist/clients/beacon-client/BeaconClient";
// import { IntercomServer } from "lib/intercom/server";
// import { ThanosMessageType, ThanosRequest } from "lib/thanos/types";

// export function startBeacon(intercom: IntercomServer) {
//   new ThanosBeaconClient(intercom);
// }

// class ThanosBeaconClient extends BeaconClient {
//   private readonly transport: Transport;

//   constructor(intercom: IntercomServer) {
//     const name = "Thanos Wallet";

//     super({ name, storage: new ChromeStorage() });

//     this.transport = new IntercomBeaconTransport(name, intercom);
//   }
// }

// class IntercomBeaconTransport extends Transport {
//   public readonly type: TransportType = TransportType.CHROME_MESSAGE;

//   private readonly intercom: IntercomServer;

//   constructor(name: string, intercom: IntercomServer) {
//     super(name);

//     this.intercom = intercom;
//     this.init().catch((err) => console.error(err));
//   }

//   public static async isAvailable() {
//     return Promise.resolve(true);
//   }

//   public async send(payload: string | Record<string, unknown>) {
//     this.intercom.broadcast({
//       type: ThanosMessageType.BeaconMessage,
//       payload
//     });
//   }

//   private async init() {
//     this.intercom.onRequest(async (req: ThanosRequest) => {
//       if (req?.type === ThanosMessageType.BeaconRequest) {
//         await this.notifyListeners(
//           {
//             target: ExtensionMessageTarget.EXTENSION,
//             sender: req.origin,
//             payload: req.payload
//           },
//           {
//             origin: Origin.WEBSITE,
//             id: req.origin
//           }
//         );
//         return ;
//       }
//     });

//     chrome.runtime.onMessage.addListener(
//       (
//         message: ExtensionMessage<string>,
//         sender: chrome.runtime.MessageSender,
//         sendResponse: (response?: unknown) => void
//       ) => {
//         logger.log("init", "receiving chrome message", message, sender);
//         const connectionContext: ConnectionContext = ;
//         this.notifyListeners(message, connectionContext).catch((error) =>
//           logger.error(error)
//         );

//         // return true from the event listener to indicate you wish to send a response asynchronously
//         // (this will keep the message channel open to the other end until sendResponse is called).
//         return true;
//       }
//     );
//   }
// }

export {};
