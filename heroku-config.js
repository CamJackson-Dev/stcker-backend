const readline = require('readline');
const fs = require('fs');
const util = require('util');

const exec = util.promisify(require('child_process').exec);
const readInterface = readline.createInterface({
  input: fs.createReadStream('./.env.production'),
  output: process.stdout,
  terminal: false,
});

readInterface.on('line', async (line) => {
  if (line) {
    const keyValuePair = line.trim().split('=');
    if (keyValuePair.length > 1) {
      const key = keyValuePair[0].trim();
      const value = keyValuePair.slice(1).join('').trim();
      const cmd = `heroku config:set ${key}="${value}" -a=stckerbackend`;
      await exec(cmd);
      console.log('Ran ' + cmd);
    }
  }
});
