const cron = require('node-cron');
const { keyRotationService } = require('./index');

class KeyRotationScheduler {
  constructor(schedule = '0 0 * * 0') { // Default: weekly rotation
    this.schedule = schedule;
    this.job = null;
  }

  start() {
    this.job = cron.schedule(this.schedule, async () => {
      try {
        await keyRotationService.rotateKeys();
        console.log('🔄 Key rotation completed successfully');
      } catch (error) {
        console.error('❌ Key rotation failed:', error);
      }
    });
  }

  stop() {
    if (this.job) {
      this.job.stop();
    }
  }
}

module.exports = new KeyRotationScheduler();