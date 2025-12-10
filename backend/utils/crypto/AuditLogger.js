const fs = require('fs').promises;
const path = require('path');

class AuditLogger {
  constructor() {
    this.logPath = path.join(__dirname, '../../../logs/crypto');
  }

  async log(action, details) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      action,
      details,
    };

    await fs.mkdir(this.logPath, { recursive: true });
    await fs.appendFile(
      path.join(this.logPath, 'crypto-audit.log'),
      JSON.stringify(logEntry) + '\n'
    );
  }
}

module.exports = new AuditLogger();