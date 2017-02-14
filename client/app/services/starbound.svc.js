angular
    .module('app.services')
    .factory('starbound', function($http) {
        var fs = require('fs');
        var jsonfile = require('jsonfile');
        var path = require('path');
        var http = require('http');
        var os = require('os');
        var crypto = require('crypto');
        var execFile = require('child_process').execFile;
        const {app} = require('electron').remote;
        var userDataPath = app.getPath('userData');

        var dataPath = path.resolve(app.getPath('userData'));
        var configFilePath = path.join(dataPath, 'app.config');
        var appPath = path.resolve(path.join(path.parse(require.resolve('../app.js')).dir, '..'));

        var masterListUrl = 'http://starbound.hades.rocks/master-list.json'

        let filename = 'mod.pak';

        return {

          syncServers(servers) {
                $http
                    .get(masterListUrl)
                    .then(function(response){
                        let masterList = response.data;
                        for (var i = 0; i < masterList.servers.length; i++) {
                            let listingServer = masterList.servers[i];
                            $http
                                .get(listingServer.address)
                                .then(function(response){
                                    let serverList = response.data;
                                    for (var j = 0; j < serverList.servers.length; j++) {
                                        let server = serverList.servers[j];
                                        server.playerCount = 0;
                                        server.maxPlayers = 8;
                                        servers[server.address] = server;
                                        $http
                                            .get(server.statusUrl)
                                            .then(function(response){
                                                let status = response.data;
                                                server.status = status;
                                                server.playerCount = status.players.length;
                                            })
                                            .catch(function(err) {
                                                console.log(err + '\n' + err.stack);
                                                // TODO: Error handling / retry?
                                            });
                                    }
                                })
                                .catch(function(err) {
                                    // TODO: Error handling / retry?
                                    console.log(err + '\n' + err.stack);
                                });
                        }
                    })
                    .catch(function(err) {
                        // TODO: Error handling / retry?
                        console.log(err + '\n' + err.stack);
                    });
          },

          saveConfig: function(config) {
            if (fs.existsSync(configFilePath)) {
                fs.unlinkSync(configFilePath);
            }

            jsonfile.writeFileSync(configFilePath, config);
          },

          loadConfig: function() {
            var me = this;
            if (!fs.existsSync(configFilePath)) {
              var commonPath;
              var storagePath;
              var starboundExecutable;
              var clientConfigFilePath;
              var starboundConfigFilePath;
              var clientConfigTemplateFilePath;
              var storageDirectoryPath = path.join(dataPath, 'storage');
              if (os.platform() == 'win32') {
                commonPath = path.resolve(path.normalize('C:\\program files (x86)\\steam\\steamapps\\common'));
                storagePath = path.resolve(commonPath, 'Starbound\\storage');
                starboundExecutable = path.join(commonPath, 'starbound\\win32\\starbound.exe');
                clientConfigFilePath = path.join(dataPath, 'client.config');
                starboundConfigFilePath = path.join(storagePath, 'starbound.config');
                clientConfigTemplateFilePath = path.join(appPath, 'templates\\client.config.win32.template');
                modsPath = path.join(dataPath, 'mods\\');
              } else if (os.type() == 'Darwin') {
                commonPath = path.resolve(path.normalize(path.join(process.env['HOME'], '/Library/Application\ Support/Steam/steamapps/common')));
                storagePath = path.resolve(commonPath, 'Starbound/storage');
                starboundExecutable = path.join(commonPath, 'Starbound/osx/Starbound.app/Contents/MacOS/starbound');
                clientConfigFilePath = path.join(dataPath, 'client.config');
                starboundConfigFilePath = path.join(storagePath, 'starbound.config');
                clientConfigTemplateFilePath = path.join(appPath, 'templates/client.config.darwin.template');
                modsPath = path.join(dataPath, 'mods/');
              } else {
                throw os.type() + ' not currently supported.'
              }

              var configFileData = {
                commonPath: commonPath,
                storagePath: storagePath,
                starboundExecutable: starboundExecutable,
                clientConfigFilePath: clientConfigFilePath,
                clientConfigTemplateFilePath: clientConfigTemplateFilePath,
                storageDirectoryPath: storageDirectoryPath,
                starboundConfigFilePath: starboundConfigFilePath,
                modsPath: modsPath
              }

              me.saveConfig(configFileData);
            }

            return jsonfile.readFileSync(configFilePath);
          },

          

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

          downloadOrUpdateMod: function(platformConfig, server, callback) {

            var directory = platformConfig.modsPath;
            if (!fs.existsSync(directory)) {
                fs.mkdirSync(directory);
            }

            let doneMods = server.mods.length;

            function modDone() {
              doneMods--;
              if (doneMods == 0) {
                callback();
              }
            }

            function downloadModFile(pakUrl, filePath) {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }

              console.log('Downloading mod file.')
              var request = http.get(pakUrl, function(response) {
                console.log(response.statusCode);
                if (response.statusCode == 200) {
                  response.pipe(fs.createWriteStream(filePath));
                  response.on('end', function() {
                    console.log('Mod file downloaded.')
                    modDone();
                  })
                } else {
                  console.log('Unable to get mod ' + pakUrl + ' as received status code ' + response.statusCode);
                  modDone();
                }
              });
            }

            for (var i = 0; i < server.mods.length; i++) {
              let mod = server.mods[i];
              let serverHash = mod.pakSha256;
              let url = mod.pakUrl;

              let modPath = platformConfig.modsPath + mod.pakSha256 + '/';
              let modFilePath = modPath + filename;

              if (!fs.existsSync(modPath)) {
                  fs.mkdirSync(modPath);
              }

              if (fs.existsSync(modFilePath)) {
                    console.log('Server Hash Code :: ' + serverHash);
                    let hash = crypto.createHash('sha256');
                    let input = fs.createReadStream(modFilePath);
                    input.on('readable', () => {
                      let data = input.read();
                      if (data)
                        hash.update(data);
                      else {
                        let fileHash = hash.digest('hex');
                        console.log('Local Hash Code  :: ' + fileHash);
                        if (fileHash != serverHash) {
                          console.log('Hashes differ, downloading newer mods file.');
                          downloadModFile(mod.pakUrl, modFilePath);
                        } else {
                          console.log('Hashes match.');
                          modDone();
                        }
                      }
                    });
              } else {
                console.log('No local mod file found.');
                downloadModFile(mod.pakUrl, modFilePath);
              }
            }

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
            var config = this.loadConfig();
            this.downloadOrUpdateMod(config, server, function() {
              me.updateClientConfig(config, server);
              me.updateStarboundConfig(config, server);
              me.startStarbound(config);
            });

          }
        }
    });
