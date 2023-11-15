import Homey from 'homey';
import PROCESS from 'process';
import PairSession from 'homey/lib/PairSession';
import { Device, DeviceDataInput } from '../../interfaces/device.interface';
import axios from 'axios';
import { StatusResponse } from '../../interfaces/innova-api.interface';
import { v4 as uuid } from 'uuid';

class FancoilDriver extends Homey.Driver {
  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('FancoilDriver has been initialized');
  }

  async onPair(session: PairSession) {
    const devices: Device[] = [];
    if (PROCESS.env.DEBUG === '1') {
      devices.push({
        name: 'Innova Fancoil2',
        data: {
          id: uuid(),
        },
        settings: {
          ip: 'localhost:5000',
        },
      });
      await session.emit('found', null);
    }
    const currentDevicesIds: string[] = this.getDevices().map((d) => d.getData().id);
    const discoveryStrategy = this.getDiscoveryStrategy();
    const discoveryResults = Object.values(discoveryStrategy.getDiscoveryResults()).filter(
      (d) => !currentDevicesIds.includes(d.id),
    );

    if (discoveryResults.length > 0) {
      discoveryResults.forEach((discoveryResult) => {
        devices.push({
          name: 'Innova Fancoil',
          data: {
            id: discoveryResult.id,
          },
          settings: {
            ip: discoveryResult.address,
          },
        });
      });

      // ready to continue pairing
      await session.emit('found', null);
    }

    // this is called when the user presses save settings button in start.html
    session.setHandler('get_devices', async (data: DeviceDataInput) => {
      const currentDevicesIps: string[] = this.getDevices().map((d) => d.getSetting('ip'));
      if (currentDevicesIps.includes(data.ip)) {
        await session.emit('already_added', data.ip);
        return;
      }
      this.log('Innova app - get_devices data: ' + JSON.stringify(data));
      if (PROCESS.env.DEBUG === '1') {
        devices.push({
          name: data.name,
          data: {
            id: uuid(),
          },
          settings: {
            ip: data.ip,
          },
        });

        await session.emit('found', null);
        return;
      }
      const uri = `http://${data.ip}/api/v/1/status`;
      await axios
        .get(uri)
        .then((res) => {
          if (res) {
            const statusResponse = res.data as StatusResponse;
            if (!statusResponse.success) {
              session.emit('api_error', 'Status success from Innova API was false');
              this.log('Innova app - response is not ok');
            } else {
              this.log('Innova app - response is ok');
              devices.push({
                name: data.name,
                data: { id: statusResponse.UID },
                settings: { ip: data.ip },
              });

              // ready to continue pairing
              session.emit('found', null);
            }
          } else {
            session.emit('api_error', 'Got no result from Innova API');
            this.log('Fetch of current status failed!');
          }
        })
        .catch((error) => {
          session.emit('api_error', JSON.stringify(error));
          this.log('Fetch of current status failed!', error);
        });
    });

    // this method is run when Homey.emit('list_devices') is run on the front-end
    // which happens when you use the template `list_devices`
    // pairing: start.html -> get_devices -> list_devices -> add_devices
    session.setHandler('list_devices', async (data) => {
      this.log('Innova app - list_devices data: ' + JSON.stringify(data));
      this.log('Innova app - list_devices devices: ' + JSON.stringify(devices));

      return devices;
    });
  }

  /**
   * onPairListDevices is called when a user is adding a device and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    return [];
  }
}

module.exports = FancoilDriver;
