var cli = require('cli');
const path = require('path');
const fs = require('fs-extra');
const klawSync = require('klaw-sync')
const replace = require("replace");
const winattr = require('winattr');

var SuccessCode = 0;
var FailureCode = 2;

options = cli.parse({
  sourcefolder: [ 'd', 'Path to project folder', 'path'],
  appid: [ 'a', 'Steam App ID', 'int' ]
});

if (options.sourcefolder == null) {
  console.error("Please pass project path argument '-d'. See help -h.")
  process.exit(FailureCode);
  return;
}

var DefaultEngineConfigPath = path.join(options.sourcefolder, 'Config', 'DefaultEngine.ini');
var DefaultEngineConfigExists = fs.pathExistsSync(DefaultEngineConfigPath);

if (options.appid != null) {
  if (!DefaultEngineConfigExists) {
    console.error("Attempting to change App ID but could not find DefaultEngine.ini in project folder!")
    process.exit(FailureCode);
    return;
  }

  winattr.setSync(DefaultEngineConfigPath, {readonly: false});

  replace({
    regex: /(SteamDevAppId=)(\d+)\b/g,
    replacement: "$1" + options.appid,
    paths: [DefaultEngineConfigPath]
  });

  replace({
    regex: /(SteamAppId=)(\d+)\b/g,
    replacement: "$1" + options.appid,
    paths: [DefaultEngineConfigPath]
  });

  console.log("Edited Steam AppID settings.");
}

console.log("Done performing config changes.");
process.exit(SuccessCode);