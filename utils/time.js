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

module.exports = {
  toVNDate,
  getNowVN: () => dayjs().tz("Asia/Ho_Chi_Minh").toDate()
};
