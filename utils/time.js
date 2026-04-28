const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

// function toVNDate(date) {
//   return dayjs(date).tz("Asia/Ho_Chi_Minh").toDate();
// }
function toVNDate(date) {
  return new Date(new Date(date).getTime() + 7 * 60 * 60 * 1000);
}

function calculateExpirationDate(durationDays, startDate = new Date()) {
  return dayjs(startDate).add(durationDays, 'day').toDate();
}

function generateRandomString(length = 30) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = {
  toVNDate,
  getNowVN: () => dayjs().tz("Asia/Ho_Chi_Minh").toDate(),
  calculateExpirationDate,
  generateRandomString
};
