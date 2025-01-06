import Homey from 'homey';
import PairSession from 'homey/lib/PairSession';
import { Device, DeviceDataInput } from '../../interfaces/device.interface';
import axios from 'axios';
import { StatusResponse } from '../../interfaces/innova-api.interface';

class FancoilDriver extends Homey.Driver {
  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('FancoilDriver has been initialized');

    // Flows
    const fancoilModeCondition = this.homey.flow.getConditionCard('fancoil-mode-is');
    fancoilModeCondition.registerRunListener(async (args) => {
      const { device, fancoil_mode } = await args;
      const fancoilMode = device.getCapabilityValue('fancoil_mode');
      return fancoilMode === fancoil_mode;
    });
    const fancoilModeAction = this.homey.flow.getActionCard('set-fancoil-mode');
    fancoilModeAction.registerRunListener(async (args) => {
      const { device, fancoil_mode } = await args;
      device.setCapabilityValue('fancoil_mode', fancoil_mode).catch(this.error);
      await device.onCapabilityFancoilMode(fancoil_mode);
    });
    const fanSpeedCondition = this.homey.flow.getConditionCard('fan-speed-is');
    fanSpeedCondition.registerRunListener(async (args) => {
      const { device, fan_speed } = await args;
      const fanSpeed = device.getCapabilityValue('fan_speed_state');
      return fanSpeed === fan_speed;
    });
    const fanSpeedAction = this.homey.flow.getActionCard('set-fan-speed-mode');
    fanSpeedAction.registerRunListener(async (args) => {
      const { device, fan_speed } = await args;
      device.setCapabilityValue('fan_speed', fan_speed).catch(this.error);
      await device.onCapabilityFanSpeed(fan_speed);
    });
  }

  async onPair(session: PairSession) {
    const devices: Device[] = [];
    const currentDevicesIds: string[] = this.getDevices().map((d) => d.getData().id);
    const currentDevicesIps: string[] = this.getDevices().map((d) => d.getSetting('ip'));

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
      this.log('Innova app - get_devices data: ' + JSON.stringify(data));
      if (currentDevicesIps.includes(data.ip)) {
        await session.emit('already_added', data.ip);
      } else {
        // if (PROCESS.env.DEBUG === '1') {
        //   devices.push({
        //     name: data.name,
        //     data: {
        //       id: (Math.random() + 1).toString(36).substring(7),
        //     },
        //     settings: {
        //       ip: data.ip,
        //     },
        //   });
        //
        //   await session.emit('found', null);
        //   return;
        // }
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
            session.emit('api_error', error.message);
            this.log('Fetch of current status failed!', error.message);
          });
      }
    });

    // this method is run when Homey.emit('list_devices') is run on the front-end
    // which happens when you use the template `list_devices`
    // pairing: start.html -> get_devices -> list_devices -> add_devices
    session.setHandler('list_devices', async (data) => {
      this.log('Innova app - list_devices data: ' + JSON.stringify(data));
      this.log('Innova app - list_devices devices: ' + JSON.stringify(devices));
      return devices;
    });

    // if (PROCESS.env.DEBUG === '1' && !currentDevicesIps.includes('localhost:5000')) {
    //   devices.push({
    //     name: 'Innova Fancoil2',
    //     data: {
    //       id: (Math.random() + 1).toString(36).substring(7),
    //     },
    //     settings: {
    //       ip: 'localhost:5000',
    //     },
    //   });
    //   await session.emit('found', null);
    //   return;
    // }
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
