// noinspection HttpUrlsUsage

import Homey, { DiscoveryResult, DiscoveryResultMAC } from 'homey';
import axios from 'axios';
import PROCESS from 'process';
import { CommandSent, Result, StatusResponse } from '../../interfaces/innova-api.interface';

class FancoilDevice extends Homey.Device {
  refreshInterval: NodeJS.Timeout | undefined;

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('FancoilDevice has been initialized');
    await this.refreshStatus();
    clearInterval(this.refreshInterval);
    this.refreshInterval = setInterval(() => {
      this.refreshStatus();
    }, 300000);

    this.on('connected', (_address) => {
      this.setAvailable().catch(this.error);
    });

    this.on('disconnected', (_address) => {
      this.setUnavailable().catch(this.error);
    });

    // Capabilities
    this.registerCapabilityListener('onoff', this.onCapabilityOnOff.bind(this));
    this.registerCapabilityListener(
      'onoff.scheduling',
      this.onCapabilityOnOffScheduling.bind(this),
    );
    this.registerCapabilityListener('fancoil_mode', this.onCapabilityFancoilMode.bind(this));
    this.registerCapabilityListener(
      'target_temperature',
      this.onCapabilityTargetTemperature.bind(this),
    );
    this.registerCapabilityListener('fan_speed', this.onCapabilityFanSpeed.bind(this));

    // Flows
    const fancoilModeCondition = this.homey.flow.getConditionCard('fancoil-mode-is');
    fancoilModeCondition.registerRunListener(async (args) => {
      const fancoilMode = this.getCapabilityValue('fancoil_mode');
      return fancoilMode === args.fancoil_mode;
    });
    const fancoilModeAction = this.homey.flow.getActionCard('set-fancoil-mode');
    fancoilModeAction.registerRunListener(async (args) => {
      const { fancoil_mode } = args;
      this.setCapabilityValue('fancoil_mode', fancoil_mode).catch(this.error);
      await this.onCapabilityFancoilMode(fancoil_mode);
    });
    const fanSpeedCondition = this.homey.flow.getConditionCard('fan-speed-is');
    fanSpeedCondition.registerRunListener(async (args) => {
      const fanSpeed = this.getCapabilityValue('fan_speed_state');
      return fanSpeed === args.fan_speed;
    });
    const fanSpeedAction = this.homey.flow.getActionCard('set-fan-speed-mode');
    fanSpeedAction.registerRunListener(async (args) => {
      const { fan_speed } = args;
      this.setCapabilityValue('fan_speed', fan_speed).catch(this.error);
      await this.onCapabilityFanSpeed(fan_speed);
    });
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
      .catch(() => {
        throw new Error(errorMessage);
      });
  }

  async onCapabilityOnOffScheduling(value: boolean) {
    const command = value ? 'set/calendar/on' : 'set/calendar/off';
    const errorMessage = `${value ? 'Activating' : 'Deactivating'} scheduling failed!`;
    await this.sendCommand(command)
      .then((res) => {
        if (!res) {
          throw new Error(errorMessage);
        }
      })
      .catch(() => {
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
        } else {
          this.setCapabilityValue('fancoil_mode_state', mode).catch(this.error);
        }
      })
      .catch(() => {
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
        } else {
          this.setCapabilityValue('measure_temperature.target', temp).catch(this.error);
        }
      })
      .catch(() => {
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
        } else {
          this.setCapabilityValue('fan_speed_state', fanSpeed).catch(this.error);
        }
      })
      .catch(() => {
        throw new Error(errorMessage);
      });
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('FanCoilDevice has been added');
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
    this.log('FancoilDevice settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param _name
   */
  async onRenamed(_name: string) {
    this.log('FancoilDevice was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('FancoilDevice has been deleted');
    clearInterval(this.refreshInterval);
  }

  onDiscoveryResult(discoveryResult: DiscoveryResult) {
    // Return a truthy value here if the discovery result matches your device.
    return discoveryResult.id === this.getData().id;
  }

  async onDiscoveryAvailable(_discoveryResult: DiscoveryResult) {
    // This method will be executed once when the device has been found (onDiscoveryResult returned true)
    await this.refreshStatus();
  }

  onDiscoveryAddressChanged(discoveryResult: DiscoveryResultMAC) {
    // Update your connection details here, reconnect when the device is offline
    this.setSettings({
      ip: discoveryResult.address,
    }).catch(() => {
      throw new Error('Update IP address failed!');
    });
  }

  async refreshStatus() {
    this.log('Refreshing status');
    if (PROCESS.env.DEBUG === '1') {
      this.setCapabilityValues(this.getMockResult());
      return;
    }
    const settings = this.getSettings();
    const uri = `http://${settings.ip}/api/v/1/status`;
    await axios
      .get(uri)
      .then((res) => {
        if (res) {
          const statusResponse = res.data as StatusResponse;
          this.setCapabilityValues(statusResponse.RESULT);
        } else {
          this.log('Fetch of current status failed!');
        }
      })
      .catch(() => {
        this.log('Fetch of current status failed!');
      });
  }

  setCapabilityValues(result: Result) {
    this.setCapabilityValue('onoff', result.ps === 1).catch(this.error);
    this.setCapabilityValue('onoff.scheduling', result.cm === 1).catch(this.error);
    const targetTemperature = result.sp / 10;
    this.setCapabilityValue('target_temperature', targetTemperature).catch(this.error);
    this.setCapabilityValue('measure_temperature.target', targetTemperature).catch(this.error);
    const currentTemperature = result.ta / 10;
    this.setCapabilityValue('measure_temperature', currentTemperature).catch(this.error);
    this.setCapabilityValue('measure_temperature.current', currentTemperature).catch(this.error);
    this.setCapabilityValue('measure_temperature.water', result.tw / 10).catch(this.error);
    const fancoilMode = this.getFancoilMode(result.wm);
    this.setCapabilityValue('fancoil_mode', fancoilMode).catch(this.error);
    this.setCapabilityValue('fancoil_mode_state', fancoilMode).catch(this.error);
    const fanSpeed = this.getFanSpeed(result.fn);
    this.setCapabilityValue('fan_speed', fanSpeed).catch(this.error);
    this.setCapabilityValue('fan_speed_state', fanSpeed).catch(this.error);
    this.setCapabilityValue('alarm_generic', result.a.length > 0).catch(this.error);
    if (result.a.length > 0) {
      this.setCapabilityOptions('alarm_generic', {
        insightsTitleTrue: {
          en: `Current error message${result.a.length > 1 ? 's' : ''}: ${result.a.join(', ')}`,
        },
      }).catch(this.error);
    }
  }

  async sendCommand(command: string, body = {}) {
    if (PROCESS.env.DEBUG === '1') {
      return true;
    }
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

  private getMockResult(): Result {
    return {
      sp: 220,
      wm: 3,
      fn: 1,
      ta: 210,
      tw: 280,
      a: [],
      ps: 1,
      cm: 0,
    };
  }
}

module.exports = FancoilDevice;
