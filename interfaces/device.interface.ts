export interface Device {
  name: string;
  data: Data;
  settings: Settings;
}

export interface Data {
  id: string;
}

export interface Settings {
  ip: string;
}

export interface DeviceDataInput {
  ip: string;
  name: string;
}
