const fs = require('fs');
const request = require('request-promise');

const inputFilePath = process.argv[2];
const cashInConfigUrl = 'http://private-38e18c-uzduotis.apiary-mock.com/config/cash-in';
const cashOutNaturalConfigUrl = 'http://private-38e18c-uzduotis.apiary-mock.com/config/cash-out/natural';
const cashOutLegalConfigUrl = 'http://private-38e18c-uzduotis.apiary-mock.com/config/cash-out/juridical';

function parseFileData(filePath) {
  return new Promise((resolve) => {
    let inputData = fs.readFileSync(filePath, 'utf8');
    inputData = inputData.split('\n');
    inputData = inputData.map((item) => item.replace('},', '}'));
    const finalDataArray = [];
    for (let i = 1; i < inputData.length - 1; i += 1) {
      finalDataArray.push(JSON.parse(inputData[i]));
    }
    resolve(finalDataArray);
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
    resolve(result > config.max.amount ? roundToCents(5) : roundToCents(result));
  });
}

async function main() {
  let inputData = null;
  let configs = null;
  if (inputFilePath) {
    try {
      inputData = await parseFileData(inputFilePath);
      configs = await getConfigurations();
      inputData.map(async (item) => {
        console.log(item);
        if (item.type === 'cash_in') {
          const commissionFee = await calculateCashInCommissionFees(item, configs.cashInConfig);
          console.log(commissionFee.toFixed(2));
        }
        return true;
      });
    } catch (err) {
      console.log('Error:');
      console.log(err.message);
    }
  }
}

main();
