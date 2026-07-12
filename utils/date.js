// utils/date.js
import moment from "moment-timezone";

export function getIranDate() {
  return moment().tz("Asia/Tehran").format("YYYY-MM-DD");
}

export function getIranDateTime() {
  return moment().tz("Asia/Tehran").format("YYYY-MM-DD HH:mm:ss");
}