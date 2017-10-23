# ue4-autoconfig-changer

Automation tool that helps with making changes to UE4 project configs

# Install

`npm install Allar/ue4-autoconfig-changer -g`

# Usage

`ue4-autoconfig-changer -d ProjectDir -a SteamAppID`

# Things

`-d ProjectDir` is required. This should be the folder that contains your .uproject file.

`-a SteamAppID` is optional. SteamAppID should be your integer Steam App ID.

`-s true` is optional. If `-s true`, project will have plugin `OnlineSubsystemSteam` *enabled*. If false (default), no changes are made.

`-v true` is optional. If `-v true`, project will have plugins `SteamVR` and `OculusVR` *disabled*. If false (default), no changes are made.