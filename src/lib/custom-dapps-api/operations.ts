import axios from "axios";

import { CustomDAppsInfo } from "./types";

export function getDApps() {
  return axios.get<CustomDAppsInfo>("http://104.236.217.192/api/dapps")
    .then(res => res.data);
}
