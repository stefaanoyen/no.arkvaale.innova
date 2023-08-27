import Homey, { DiscoveryResult, DiscoveryResultMAC } from 'homey';
import axios from 'axios';
import { CommandSent, StatusResponse } from '../../interfaces/innova-api.interface';

class FanCoilDevice extends Homey.Device {
  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('MyDevice has been initialized');

    this.on('connected', (_address) => {
      this.setAvailable().catch(this.error);
    });

    this.on('disconnected', (_address) => {
      this.setUnavailable().catch(this.error);
    });

    // Capabilities
    this.registerCapabilityListener('onoff', this.onCapabilityOnOff.bind(this));
    this.registerCapabilityListener('fancoil_mode', this.onCapabilityFancoilMode.bind(this));
    this.registerCapabilityListener(
      'target_temperature',
      this.onCapabilityTargetTemperature.bind(this),
    );
    this.registerCapabilityListener('fan_speed', this.onCapabilityFanSpeed.bind(this));
  }

  async onCapabilityOnOff(value: boolean) {
    const command = value ? 'power/on' : 'power/off';
    const errorMessage = `Power ${value ? 'on' : 'off'} failed!`;
    await this.sendCommand(command)
      .then((res) => {
        if (!res) {
          throw new Error(errorMessage);
        }
      })
      .catch((err) => {
        throw new Error(errorMessage);
      });
  }

  async onCapabilityFancoilMode(mode: 'cool' | 'heat') {
    const command = mode === 'cool' ? 'set/mode/cooling' : 'set/mode/heating';
    const errorMessage = `Changing mode to ${mode} failed!`;
    await this.sendCommand(command)
      .then((res) => {
        if (!res) {
          throw new Error(errorMessage);
        }
      })
      .catch((err) => {
        throw new Error(errorMessage);
      });
  }

  async onCapabilityTargetTemperature(temp: number) {
    const command = 'set/setpoint';
    const errorMessage = `Changing temperature to ${temp} failed!`;
    await this.sendCommand(command, { temp: temp * 10 })
      .then((res) => {
        if (!res) {
          throw new Error(errorMessage);
        }
      })
      .catch((err) => {
        throw new Error(errorMessage);
      });
  }

  async onCapabilityFanSpeed(fanSpeed: 'auto' | 'night' | 'min' | 'max') {
    const command = `set/function/${fanSpeed}`;
    const errorMessage = `Changing fan speed to ${fanSpeed} failed!`;
    await this.sendCommand(command, { value: 1 })
      .then((res) => {
        if (!res) {
          throw new Error(errorMessage);
        }
      })
      .catch((err) => {
        throw new Error(errorMessage);
      });
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('MyDevice has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({
    oldSettings,
    newSettings,
    changedKeys,
  }: {
    oldSettings: {
      [key: string]: boolean | string | number | undefined | null;
    };
    newSettings: {
      [key: string]: boolean | string | number | undefined | null;
    };
    changedKeys: string[];
  }): Promise<string | void> {
    this.log('MyDevice settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param _name
   */
  async onRenamed(_name: string) {
    this.log('MyDevice was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('MyDevice has been deleted');
  }

  onDiscoveryResult(discoveryResult: DiscoveryResult) {
    // Return a truthy value here if the discovery result matches your device.
    return discoveryResult.id === this.getData().id;
  }

  async onDiscoveryAvailable(_discoveryResult: DiscoveryResult) {
    // This method will be executed once when the device has been found (onDiscoveryResult returned true)
    const settings = this.getSettings();
    const uri = `http://${settings.ip}/api/v/1/status`;
    await axios
      .get(uri)
      .then((res) => {
        if (res) {
          const statusResponse = res.data as StatusResponse;
          this.setCapabilityValue('onoff', statusResponse.RESULT.ps === 1).catch(this.error);
          this.setCapabilityValue('target_temperature', statusResponse.RESULT.sp / 10).catch(
            this.error,
          );
          this.setCapabilityValue('measure_temperature', statusResponse.RESULT.ta / 10).catch(
            this.error,
          );
          this.setCapabilityValue(
            'fancoil_mode',
            this.getFancoilMode(statusResponse.RESULT.wm),
          ).catch(this.error);
          this.setCapabilityValue('fan_speed', this.getFanSpeed(statusResponse.RESULT.fn)).catch(
            this.error,
          );
        } else {
          throw new Error('Fetch of current status failed!');
        }
      })
      .catch(() => {
        throw new Error('Fetch of current status failed!');
      });
  }

  onDiscoveryAddressChanged(discoveryResult: DiscoveryResultMAC) {
    // Update your connection details here, reconnect when the device is offline
    this.setSettings({
      ip: discoveryResult.address,
    });
  }

  async sendCommand(command: string, body = {}) {
    const settings = this.getSettings();
    const uri = `http://${settings.ip}/api/v/1/${command}`;
    const res = await axios.post(uri, body);
    const response = res?.data as CommandSent;
    return response.success;
  }

  private getFancoilMode(mode: number): 'cool' | 'heat' {
    if (mode === 5) {
      return 'cool';
    }
    return 'heat';
  }

  private getFanSpeed(fanSpeed: number): 'auto' | 'night' | 'min' | 'max' {
    switch (fanSpeed) {
      case 2:
        return 'night';
      case 3:
        return 'min';
      case 4:
        return 'max';
      default:
        return 'auto';
    }
  }
}

module.exports = FanCoilDevice;
