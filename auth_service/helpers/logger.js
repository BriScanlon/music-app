import fs from 'fs';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

const { LOG_LEVEL, LOG_HISTORY, LOG_NAME } = process.env;

const logTypes = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
const logColors = ['36m', '33m', '31m', '32m'];
const logCount = parseInt(LOG_HISTORY || '7', 10);
const logLevel = parseInt(LOG_LEVEL || '0', 10);

cron.schedule('0 0 * * *', () => {
  for (const type of logTypes) {
    if (logTypes.indexOf(type) < logLevel) continue;
    const fileName = `./log/${LOG_NAME}.${type.toLowerCase()}`;
    for (let i = logCount; i >= 0; i--) {
      const logFile = `${fileName}.${i === 0 ? '' : `${i}.`}log`;
      if (!fs.existsSync(logFile)) continue;
      if (i === logCount - 1) {
        fs.unlinkSync(`${fileName}.${i}.log`);
        continue;
      }
      try {
        fs.renameSync(logFile, `${fileName}.${i + 1}.log`);
      } catch (err) {
        log(2, `Failed to rotate log files. Error: \n ${err}`);
      }
    }
    fs.writeFileSync(`./log/${LOG_NAME}.${type.toLowerCase()}.log`, '');
  }
}, { timeZone: "Europe/London" });

if (!fs.existsSync('./log')) {
  fs.mkdirSync('./log');
}

for (const type of logTypes) {
  if (logTypes.indexOf(type) < logLevel) continue;
  const fileName = `./log/${LOG_NAME}.${type.toLowerCase()}.log`;
  if (!fs.existsSync(fileName)) fs.writeFileSync(fileName, '');
}

export default function log(type, message) {
  if (type < logLevel) return;
  const now = Date.now();
  const data = Intl.DateTimeFormat('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: "Europe/London" }).format(now);
  const time = Intl.DateTimeFormat('en-GB', { timeStyle: 'medium', hour12: false, timeZone: "Europe/London" }).format(now);
  console.log(`[\x1b[${logColors[type]}${logTypes[type]}${'\x1b[0m'}] ${data} ${time} - ${message}\x1b[0m`);
  fs.appendFileSync(`./log/${LOG_NAME}.${logTypes[type].toLowerCase()}.log`, `${data} ${time}: ${message}\r\n`);
}
