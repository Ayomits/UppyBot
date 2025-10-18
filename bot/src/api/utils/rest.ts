import axios from "axios";

import { Env } from "#/libs/config/index.js";

export const uppyRest = axios.create({
  ...axios.defaults,
  baseURL: Env.ApiUrl,
  headers: {
    Authorization: Env.SecretKey,
  },
});
