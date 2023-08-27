export interface CommandSent {
  success: boolean;
}

export interface StatusResponse {
  success: boolean;
  RESULT: result;
}

export interface result {
  sp: number;
  wm: number;
  fn: number;
  kl: number;
  lastworkingModeSet: number;
  ps: number;
  cm: number;
  a: string[];
  ta: number;
  tw: number;
  ns: number;
  cloudStatus: number;
  connectionStatus: number;
  cloudConfig: number;
  timerStatus: number;
  inputFlags: number;
  ncc: number;
  lcc: number;
  pwd: string;
  heap: number;
  ccv: number;
  cci: number;
  daynumber: number;
  uptime: number;
  fclFw: number;
  uscm: number;
  lastRefresh: number;
}
