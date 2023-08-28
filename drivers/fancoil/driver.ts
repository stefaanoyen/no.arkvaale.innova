import Homey from 'homey';

class FancoilDriver extends Homey.Driver {
  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('FancoilDriver has been initialized');
  }

  /**
   * onPairListDevices is called when a user is adding a device and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    const discoveryStrategy = this.getDiscoveryStrategy();
    const discoveryResults = Object.values(discoveryStrategy.getDiscoveryResults());
    return discoveryResults.map((discoveryResult) => {
      return {
        name: 'Innova Fancoil',
        data: {
          id: discoveryResult.id,
        },
        settings: {
          ip: discoveryResult.address,
        },
      };
    });
  }
}

module.exports = FancoilDriver;
