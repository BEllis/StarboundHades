angular
    .module('app.services')
    .factory('starboundControlService', function(starboundInfoService, configService) {

        var fs = require('fs');
        var jsonfile = require('jsonfile');
        var execFile = require('child_process').execFile;

        return {
          updateClientConfig: function(platformConfig, server) {
            var clientConfig = jsonfile.readFileSync(platformConfig.clientConfigTemplateFilePath);
            clientConfig.assetDirectories = [];
            clientConfig.assetDirectories.push('../assets/');
            for (var i = 0; i < server.mods.length; i++) {
              let mod = server.mods[i];
              let modPath = platformConfig.modsPath + mod.pakSha256 + '/';
              let modFilePath = modPath + filename;
              if (fs.existsSync(modFilePath)) {
                clientConfig.assetDirectories.push(modPath);
              }
            }

            clientConfig.assetDirectories.push('../user/');
            jsonfile.writeFileSync(platformConfig.clientConfigFilePath, clientConfig);

            /*
            if (!fs.existsSync(platformConfig.storageDirectoryPath)) {
                fs.mkdirSync(platformConfig.storageDirectoryPath);
            } */
          },

          updateStarboundConfig: function(platformConfig, server) {
            var starboundConfig = jsonfile.readFileSync(platformConfig.starboundConfigFilePath);
            if (!starboundConfig.title) {
              starboundConfig.title = {
                multiPlayerAccount : ""
              }      
            } else {
              starboundConfig.title.multiPlayerAddress = server.address;
              if (server.port) {
                starboundConfig.title.multiPlayerPort = server.port;
              } else {
                starboundConfig.title.multiPlayerPort = "";
              }
            }

            jsonfile.writeFileSync(platformConfig.starboundConfigFilePath, starboundConfig);
          },

          startStarbound: function(platformConfig) {
            console.log('Starting starbound...')

            var sbExec = execFile(platformConfig.starboundExecutable, [ '-bootconfig', platformConfig.clientConfigFilePath ], function (error, stdout, stderr) {
              if (error) {
                console.error(error);
                console.log(error);
              }
            });

            sbExec.stdout.on('data', function (data) {
              console.log('stdout: ' + data.toString());
            });

            sbExec.stderr.on('data', function (data) {
              console.log('stderr: ' + data.toString());
            });

            sbExec.on('exit', function (code) {
              console.log('child process exited with code ' + code);
              $('.console-close').click();
            });
          },

          connect: function(server) {
            var me = this;
            var config = configService.loadConfig();
            starboundInfoService.downloadOrUpdateMod(config, server, function() {
              me.updateClientConfig(config, server);
              me.updateStarboundConfig(config, server);
              me.startStarbound(config);
            });

          }
        }

    });