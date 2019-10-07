const fs = require('fs');

const inputFilePath = process.argv[2];

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

parseFileData(inputFilePath).then(console.log).catch((err) => {
  console.log('Error:');
  console.log(err.message);
});
