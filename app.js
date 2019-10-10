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

parseFileData(inputFilePath).then(console.log).catch((err) => {
  console.log('Error:');
  console.log(err.message);
});
getConfigurations().then(console.log);
