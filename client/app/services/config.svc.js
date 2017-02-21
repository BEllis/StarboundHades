angular
    .module('app.services')
    .factory('configService', function() {

        var fs = require('fs');
        var jsonfile = require('jsonfile');
        var os = require('os');
        var path = require('path');

        const {app} = require('electron').remote;

        let userDataPath = path.resolve(app.getPath('userData'));
        let configFilePath = path.join(userDataPath, 'app.config');

        return {

          saveConfigFile: function(config) {
            if (fs.existsSync(configFilePath)) {
                fs.unlinkSync(configFilePath);
            }

            jsonfile.writeFileSync(configFilePath, config);
          },

          resetConfigFile: function() {
              var me = this;
                if (os.platform() == 'win32') {
                    starboundPath = path.resolve(path.normalize('C:\\program files (x86)\\steam\\steamapps\\common\\Starbound'));
                } else if (os.type() == 'Darwin') {
                    starboundPath = path.resolve(path.normalize(path.join(process.env['HOME'], '/Library/Application\ Support/Steam/steamapps/common/Starbound')));
                } else {
                    throw os.type() + ' not currently supported.'
                }

                configFileData = {
                    starboundPath: starboundPath
                }

                me.saveConfigFile(configFileData);
          },

          loadConfigFile: function() {
              var me = this;
            let configFileData;
            let starboundPath;
            if (!fs.existsSync(configFilePath)) {
                me.resetConfigFile();
            }

            configFileData = jsonfile.readFileSync(configFilePath);
            starboundPath = configFileData.starboundPath;
            if (!fs.existsSync(starboundPath)) { 
                me.resetConfigFile();
                configFileData = jsonfile.readFileSync(configFilePath);
                starboundPath = configFileData.starboundPath;
            }

            if (!fs.existsSync(starboundPath)) {
                let error = new Error('Unable to locate Starbound directory at ' + starboundPath);
                error.scanForStarboundDirectory = true;
                throw error;
            }

            return configFileData;
          },

          loadConfig: function() {
            var me = this;

            let configFileData = me.loadConfigFile();

            let starboundPath = configFileData.starboundPath;

            let userStoragePath = path.join(userDataPath, 'storage');
            let clientConfigFilePath = path.join(userDataPath, 'client.config');
            let modsPath = path.join(userDataPath, 'mods');

            let starboundStoragePath = path.resolve(starboundPath, 'storage');
            let starboundConfigFilePath = path.join(storagePath, 'starbound.config');

            let starboundExecutable;
            let clientConfigTemplateFilePath;
            
            let appPath = path.resolve(path.join(path.parse(require.resolve('../app.js')).dir, '..'));
            if (os.platform() == 'win32') {
                starboundExecutable = path.join(starboundPath, 'win32\\starbound.exe');
                clientConfigTemplateFilePath = path.join(appPath, 'templates\\client.config.win32.template');  
            } else if (os.type() == 'Darwin') {
                starboundExecutable = path.join(starboundPath, 'Starbound/osx/Starbound.app/Contents/MacOS/starbound');
                clientConfigTemplateFilePath = path.join(appPath, 'templates/client.config.darwin.template');
                modsPath = path.join(userDataPath, 'mods');
            } else {
                throw os.type() + ' not currently supported.'
            }

            if (!fs.existsSync(starboundExecutable)) {
                let error = new Error('Unable to locate Starbound executable at ' + starboundExecutable);
                error.scanForStarboundDirectory = true;
                throw error;
            }

            let configData = {
                userStoragePath: userStoragePath,
                starboundStoragePath: starboundStoragePath,
                starboundExecutable: starboundExecutable,
                clientConfigFilePath: clientConfigFilePath,
                clientConfigTemplateFilePath: clientConfigTemplateFilePath,
                storageDirectoryPath: storageDirectoryPath,
                starboundConfigFilePath: starboundConfigFilePath,
                modsPath: modsPath
            };

            return configData;
          },

        };

    });