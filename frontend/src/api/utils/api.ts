import axios from "axios";
import { Env } from "../../const/env";

export const api = axios.create({
  baseURL: Env.ApiUrl,
  validateStatus: (status) => status >= 200 && status < 300,
  responseType: "json",
  withCredentials: true,
});
