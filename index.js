var cli = require('cli');
const path = require('path');
const fs = require('fs-extra');
const klawSync = require('klaw-sync')
const replace = require("replace");
const winattr = require('winattr');

var SuccessCode = 0;
var FailureCode = 2;

options = cli.parse({
  sourcefolder: ['d', 'Path to project folder', 'path'],
  bDisableVR: ['v', 'Whether to disable VR', 'bool', false],
  bEnableSteam: ['s', 'Whether to enable steam (does not disable if already enabled)', 'bool', false],
  bDisableLinter: ['l', 'Whether to disable Linter (does not enable if already disabled)', 'bool', false],
  appid: ['a', 'Steam App ID', 'int']
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


/**
 * @param {object} ProjectObject Project object loaded from .uproject
 * @param {string} PluginName Name of plugin
 * @param {bool} PluginEnabled Whether plugin should be enabled
 * @returns modified project object
 */
function SetPluginState(ProjectObject, PluginName, PluginEnabled, bRemoveFromList = false) {
  if (!ProjectObject.hasOwnProperty('Plugins')) { // Has no plugin configuration
    if (bRemoveFromList) { // Want to simply remove from list
      return ProjectObject; // do nothing
    }
    ProjectObject["Plugins"] = [{ "Name": PluginName, "Enabled": PluginEnabled }];
    console.log(`Added Plugins field and ${PluginEnabled ? 'enabled' : 'disabled'} ${PluginName}.`);
  } else {
    var PluginIndex = ProjectObject.Plugins.findIndex((element) => { return element["Name"] == PluginName; });
    if (PluginIndex != -1) {
      if (bRemoveFromList) { // Want to simply remove from list
        ProjectObject.Plugins.splice(PluginIndex, 1);
        console.log(`Removed ${PluginName} from plugin list.`);
        return ProjectObject;
      }
      ProjectObject.Plugins[PluginIndex]["Enabled"] = PluginEnabled;
      console.log(`Forced ${PluginName} to be ${PluginEnabled ? 'enabled' : 'disabled'}.`);
    } else {
      if (bRemoveFromList) {
        console.log(`Could not find ${PluginName} so there was nothing to remove.`);
        return ProjectObject;
      }
      ProjectObject.Plugins.push({ "Name": PluginName, "Enabled": PluginEnabled });
      console.log(`Added ${PluginName} as ${PluginEnabled ? 'enabled' : 'disabled'} to plugins list.`);
    }
  }

  return ProjectObject;
}


if (options.bEnableSteam || options.bDisableVR || options.bDisableLinter) {
  if (!ProjectFileExists) {
    console.error("Attempting to make .uproject file changes but could not find .uproject file!")
    process.exit(FailureCode);
    return;
  }

  winattr.setSync(ProjectFilePath, { readonly: false });

  let rawdata = fs.readFileSync(ProjectFilePath);
  let ProjectJSON = JSON.parse(rawdata);

  console.log(JSON.stringify(ProjectJSON));

  if (options.bEnableSteam) {
    ProjectJSON = SetPluginState(ProjectJSON, 'OnlineSubsystemSteam', true);
  }

  if (options.bDisableVR) {
    ProjectJSON = SetPluginState(ProjectJSON, 'SteamVR', false);
    ProjectJSON = SetPluginState(ProjectJSON, 'OculusVR', false);
  }

  if (options.bDisableLinter) {
    ProjectJSON = SetPluginState(ProjectJSON, 'Linter', false, true);
  }

  fs.writeFileSync(ProjectFilePath, JSON.stringify(ProjectJSON, null, '\t'), { flag: 'w' });
}

var DefaultEngineConfigPath = path.join(options.sourcefolder, 'Config', 'DefaultEngine.ini');
var DefaultEngineConfigExists = fs.pathExistsSync(DefaultEngineConfigPath);

if (options.appid != null) {
  if (!DefaultEngineConfigExists) {
    console.error("Attempting to change App ID but could not find DefaultEngine.ini in project folder!")
    process.exit(FailureCode);
    return;
  }

  winattr.setSync(DefaultEngineConfigPath, { readonly: false });

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