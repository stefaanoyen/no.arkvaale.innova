// Aangepaste functies voor foutafhandeling, MAC-adresbereik, en logging in de Innova Fancoil-app.

const InnovaFancoilDriver = {
  async onPair(session) {
    session.setHandler('list_devices', async () => {
      try {
        const devices = await this.discoverDevices();
        if (!devices || devices.length === 0) {
          this.log('Geen apparaten gevonden. Controleer netwerkverbinding of compatibiliteit.');
          throw new Error('Geen apparaten gevonden.');
        }

        return devices.map(device => ({
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
  },

  async discoverDevices() {
    this.log('Start apparaatdetectie...');
    try {
      const response = await this.apiCall('/devices'); // Hypothetische API-call
      this.log('Ontvangen respons van apparaten:', response);

      if (!response || typeof response !== 'object') {
        this.error('Ongeldige respons ontvangen:', response);
        return [];
      }

      return response.devices.filter(device => {
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
  },

  async apiCall(endpoint) {
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
  },

  log(message, ...args) {
    console.log(`[Innova Fancoil] ${message}`, ...args);
  },

  error(message, ...args) {
    console.error(`[Innova Fancoil] ${message}`, ...args);
  },
};

module.exports = InnovaFancoilDriver;
