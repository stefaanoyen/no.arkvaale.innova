import { Driver } from 'homey';

interface Device {
  id: string;
  mac: string;
  name?: string;
}

interface ApiResponse {
  devices: Device[];
}

class InnovaFancoilDriver extends Driver {

  async onPair(session: any) {
    session.setHandler('list_devices', async () => {
      try {
        const devices: Device[] = await this.discoverDevices();
        if (!devices || devices.length === 0) {
          this.log('Geen apparaten gevonden. Controleer netwerkverbinding of compatibiliteit.');
          throw new Error('Geen apparaten gevonden.');
        }

        return devices.map((device: Device) => ({
          name: device.name || 'Onbekend apparaat',
          data: {
            id: device.id,
            mac: device.mac,
          },
        }));
      } catch (error) {
        this.error('Fout bij apparaatdetectie:', error);
        throw new Error('Apparaatdetectie is mislukt. Controleer de logs voor meer informatie.');
      }
    });
  }

  async discoverDevices(): Promise<Device[]> {
    this.log('Start apparaatdetectie...');
    try {
      const response: ApiResponse | null = await this.apiCall('/devices');
      this.log('Ontvangen respons van apparaten:', response);

      if (!response || !response.devices) {
        this.error('Ongeldige respons ontvangen:', response);
        return [];
      }

      return response.devices.filter((device: Device) => {
        if (!device.mac || !device.id) {
          this.log('Apparaat uitgesloten vanwege ontbrekende MAC- of ID-gegevens:', device);
          return false;
        }
        return true;
      });
    } catch (error) {
      this.error('Fout tijdens apparaatdetectie:', error);
      return [];
    }
  }

  async apiCall(endpoint: string): Promise<ApiResponse | null> {
    try {
      this.log(`API-aanroep naar ${endpoint}`);
      const result = await fetch(`http://192.168.0.x${endpoint}`);
      if (!result.ok) {
        this.error(`API-fout: ${result.status} - ${result.statusText}`);
        return null;
      }
      const data = await result.json();
      if (typeof data !== 'object' || data === null || !('devices' in data)) {
        this.error('Onverwacht responsformaat ontvangen:', data);
        return null;
      }
      this.log('Succesvolle API-respons:', data);
      return data as ApiResponse;
    } catch (error) {
      this.error('API-aanroep mislukt:', error);
      return null;
    }
  }

  async onSettings({ oldSettings, newSettings, changedKeys }: { oldSettings: Record<string, any>; newSettings: Record<string, any>; changedKeys: string[] }): Promise<void> {
    this.log('Instellingen gewijzigd:', changedKeys);
    
    if (changedKeys.length === 0) {
      this.log('Geen instellingen gewijzigd, waarschijnlijk een fout in de Homey UI.');
      return;
    }
    
    this.log('Oude instellingen:', oldSettings);
    this.log('Nieuwe instellingen:', newSettings);
    
    if (changedKeys.includes('ip_address')) {
      this.log(`Nieuw IP-adres ingesteld: ${newSettings.ip_address}`);
    }
  }

  log(message: string, ...args: any[]): void {
    console.log(`[Innova Fancoil] ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`[Innova Fancoil] ${message}`, ...args);
  }
}

module.exports = InnovaFancoilDriver;
