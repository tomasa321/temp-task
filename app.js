const fs = require('fs');
const request = require('request-promise');
const cfg = require('./config');

const inputFilePath = process.argv[2];
const { cashInConfigUrl, cashOutNaturalConfigUrl, cashOutLegalConfigUrl } = cfg;

function parseFileData(filePath) {
  return new Promise((resolve) => {
    const inputData = fs.readFileSync(filePath, 'utf8');
    // https://stackoverflow.com/a/34347475
    const regex = /,(?!\s*?[{["'\w])/g;
    const correct = inputData.replace(regex, ''); // remove all trailing commas
    const result = JSON.parse(correct); // build a new JSON object based on correct string
    resolve(result);
  });
}

function getConfigurations() {
  const promises = [];
  promises.push(request(cashInConfigUrl));
  promises.push(request(cashOutNaturalConfigUrl));
  promises.push(request(cashOutLegalConfigUrl));
  return Promise.all(promises)
    .then((configs) => ({
      cashInConfig: JSON.parse(configs[0]),
      cashOutNaturalConfig: JSON.parse(configs[1]),
      cashOutLegalConfig: JSON.parse(configs[2]),
    }));
}

function roundToCents(amount) {
  return Math.ceil(amount * 100) / 100;
}

function calculateCashInCommissionFees(data, config) {
  return new Promise((resolve) => {
    const result = data.operation.amount * config.percents * 0.01;
    resolve(result > config.max.amount ? roundToCents(config.max.amount) : roundToCents(result));
  });
}

function calculateCashOutNaturalCommissionFees(data, config, index) {
  return new Promise((resolve) => {
    let weekDay = new Date(data[index].date).getDay();
    if (weekDay === 0) {
      weekDay = 7;
    }
    let sum = 0;
    let shuffleIndex = index;

    if (weekDay === 1) {
      sum = data[shuffleIndex].operation.amount;
    } else {
      while (shuffleIndex > 0 && weekDay > 1) {
        if (data[shuffleIndex].user_id === data[index].user_id
          && data[shuffleIndex].type === 'cash_out'
          && data[shuffleIndex].user_type === 'natural') {
          // including current transaction:
          if (sum === 0 || data[shuffleIndex].operation.amount < config.week_limit.amount) {
            sum += data[shuffleIndex].operation.amount;

            // if transaction before current one is bigger then week limit it means that limit
            // is exceeded
          } else if (sum !== 0 && data[shuffleIndex].operation.amount >= config.week_limit.amount) {
            sum = data[index].operation.amount + config.week_limit.amount;
            shuffleIndex = 1;
          }
          weekDay = new Date(data[shuffleIndex].date).getDay();
          if (weekDay === 0) {
            weekDay = 7;
          }
        }
        shuffleIndex -= 1;
      }
    }

    const fees = sum <= config.week_limit.amount ? 0 : (sum - config.week_limit.amount)
      * config.percents * 0.01;

    resolve(fees);
  });
}

function calculateCashOutLegalCommissionFees(data, config) {
  return new Promise((resolve) => {
    const result = data.operation.amount * config.percents * 0.01;
    resolve(result < config.min.amount ? roundToCents(config.min.amount) : roundToCents(result));
  });
}

async function main(filePath) {
  let inputData = null;
  let configs = null;
  if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
    inputData = await parseFileData(filePath);
    configs = await getConfigurations();
    inputData.map(async (item, index) => {
      if (item.type === 'cash_in') {
        const commissionFee = await calculateCashInCommissionFees(item, configs.cashInConfig);
        console.log(commissionFee.toFixed(2));
      } else if (item.type === 'cash_out' && item.user_type === 'natural') {
        const commissionFee = await calculateCashOutNaturalCommissionFees(inputData,
          configs.cashOutNaturalConfig, index);
        console.log(commissionFee.toFixed(2));
      } else if (item.type === 'cash_out' && item.user_type === 'juridical') {
        const commissionFee = await calculateCashOutLegalCommissionFees(item,
          configs.cashOutLegalConfig);
        console.log(commissionFee.toFixed(2));
      }
    });
  } else {
    return Promise.reject();
  }
  return Promise.resolve();
}

main(inputFilePath).catch(() => { });
