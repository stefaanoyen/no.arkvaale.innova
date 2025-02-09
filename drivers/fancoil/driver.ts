import { Device, Driver } from 'homey';

class InnovaFancoilDriver extends Driver {

  async onPair(session: any) { // Verwijderd HomeyAPI.Session
    session.setHandler('list_devices', async () => {
      try {
        const devices: any[] = await this.discoverDevices();
        if (!devices || devices.length === 0) {
          this.log('Geen apparaten gevonden. Controleer netwerkverbinding of compatibiliteit.');
          throw new Error('Geen apparaten gevonden.');
        }

        return devices.map((device: any) => ({
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

  async discoverDevices(): Promise<any[]> {
    this.log('Start apparaatdetectie...');
    try {
      const response: any = await this.apiCall('/devices'); // Hypothetische API-call
      this.log('Ontvangen respons van apparaten:', response);

      if (!response || typeof response !== 'object' || !response.devices) {
        this.error('Ongeldige respons ontvangen:', response);
        return [];
      }

      return response.devices.filter((device: any) => {
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

  async apiCall(endpoint: string): Promise<any> {
    try {
      this.log(`API-aanroep naar ${endpoint}`);
      const result = await fetch(`http://192.168.0.x${endpoint}`); // Pas aan naar correct IP/netwerk
      if (!result.ok) {
        this.error(`API-fout: ${result.status} - ${result.statusText}`);
        return null;
      }
      const data = await result.json();
      this.log('Succesvolle API-respons:', data);
      return data;
    } catch (error) {
      this.error('API-aanroep mislukt:', error);
      return null;
    }
  }

  log(message: string, ...args: any[]): void {
    console.log(`[Innova Fancoil] ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`[Innova Fancoil] ${message}`, ...args);
  }
}

export default InnovaFancoilDriver;
