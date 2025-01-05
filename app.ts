import Homey from 'homey';

class InnovaFancoilApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('Innova Fancoil has been initialized');
  }

}

module.exports = InnovaFancoilApp;
