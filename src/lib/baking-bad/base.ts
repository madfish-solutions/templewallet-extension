import axios from "axios";

export const BASE_URL = "https://api.baking-bad.org/v2";

export const api = axios.create({ baseURL: BASE_URL });
