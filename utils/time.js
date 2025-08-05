const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

function toVNDate(date) {
  return dayjs(date).tz("Asia/Ho_Chi_Minh").toDate();
}

module.exports = {
  toVNDate,
  getNowVN: () => dayjs().tz("Asia/Ho_Chi_Minh").toDate()
};
