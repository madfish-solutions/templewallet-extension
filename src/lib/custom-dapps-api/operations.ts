import axios from "axios";

import { CustomDAppsInfo } from "./types";

export function getDApps() {
  return axios
    .get<CustomDAppsInfo>("https://api.templewallet.com/api/dapps")
    .then((res) => res.data);
}
