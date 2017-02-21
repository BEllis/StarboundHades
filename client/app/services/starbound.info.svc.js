angular
    .module('app.services')
    .factory('starboundInfoService', function($http) {
        var fs = require('fs');
        var http = require('http');
        var crypto = require('crypto');

        // var masterListUrl = 'http://localhost:21080/masters';
        var masterListUrl = 'http://starbound.hades.rocks:21080/masters'

        let filename = 'mod.pak';

        return {

          syncServers(servers, errorCallback) {
            let handleHttpError = function(failureType, err) {
                let failureReason;
                
                if (err.status == -1) {
                  failureReason = 'No network connection available.'
                } else {
                  failureReason = "Server returned status code " + err.status;
                }

                console.error(err);
                console.error(err.stack);
                errorCallback(failureType, failureReason);
            }

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
                                              handleHttpError('Unable to fetch status from ' + server.statusUrl, err);
                                            });
                                    }
                                })
                                .catch(function(err) {
                                  handleHttpError('Unable to fetch server list from ' + listingServer.address, err);
                                });
                        }
                    })
                    .catch(function(err) {
                      handleHttpError('Unable to fetch master list from ' + masterListUrl, err)
                    });
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

          }

        }
    });
