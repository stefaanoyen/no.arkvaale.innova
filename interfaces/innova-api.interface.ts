export interface CommandSent {
  success: boolean;
}

export interface StatusResponse {
  success: boolean;
  RESULT: result;
}

export interface result {
  sp: number; // Temperature Set point (x10)
  wm: number; // Working Mode: 3=heating. 5=cooling
  fn: number; // Fan Function: 1=auto, 2=night, 3=min, 4=ma
  ps?: number; // Power: 0=off, 1=on
  cm?: number; // Scheduling Mode: 0=off, 1=o
  ta: number; // Current Temperature (x10)
  tw?: number; // Water Temperature (x10)
  kl?: number;
  a?: string[];
  ns?: number;
  lastworkingModeSet?: number;
  cloudStatus?: number;
  connectionStatus?: number;
  cloudConfig?: number;
  timerStatus?: number;
  inputFlags?: number;
  ncc?: number;
  lcc?: number;
  pwd?: string;
  heap?: number;
  ccv?: number;
  cci?: number;
  daynumber?: number;
  uptime?: number;
  fclFw?: number;
  uscm?: number;
  lastRefresh?: number;
}
