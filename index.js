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
  bEnableSteam: [ 's', 'Whether to enable steam (does not disable if already enabled)', 'bool', false],
  appid: [ 'a', 'Steam App ID', 'int' ]
});

if (options.sourcefolder == null) {
  console.error("Please pass project path argument '-d'. See help -h.")
  process.exit(FailureCode);
  return;
}

//@TODO: Search for .uproject file instead
var ProjectName = path.basename(options.sourcefolder);

var ProjectFilePath = path.join(options.sourcefolder, ProjectName + '.uproject');
var ProjectFileExists = fs.pathExistsSync(ProjectFilePath);

if (options.bEnableSteam) {
  if (!ProjectFileExists) {
    console.error("Attempting to enable Steam subsystem but could not find Project's .uproject file!")
    process.exit(FailureCode);
    return;
  }

  winattr.setSync(ProjectFilePath, {readonly: false});

  let rawdata = fs.readFileSync(ProjectFilePath);  
  let ProjectJSON = JSON.parse(rawdata);  

  console.log(JSON.stringify(ProjectJSON));

  if (!ProjectJSON.hasOwnProperty('Plugins')) { // Has no plugin configuration, just add Steam enabled
    var Steam = { "Name": "OnlineSubsystemSteam", "Enabled": true}
    ProjectJSON["Plugins"] = [Steam];
    console.log("Added Plugins field and enabled Steam.");
  } else {
    var SteamIndex = ProjectJSON.Plugins.findIndex( (element) => { return element["Name"] == "OnlineSubsystemSteam"; } );
    if (SteamIndex != -1) {
      ProjectJSON.Plugins[SteamIndex]["Enabled"] = true;
      console.log("Forced OnlineSubsystemSteam to be enabled.");
    } else {
      ProjectJSON.Plugins.push({ "Name": "OnlineSubsystemSteam", "Enabled": true});
      console.log("Added OnlineSubsystemSteam to plugins list.");
    }
  }
  fs.writeFileSync(ProjectFilePath, JSON.stringify(ProjectJSON, null, '\t'), {flag: 'w'});
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