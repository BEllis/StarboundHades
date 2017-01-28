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
var appPath = path.resolve(path.join(path.parse(require.resolve('./starbound.js')).dir, '../..'));

module.exports = {

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
      var starboundExecutable;
      var clientConfigFilePath;
      var clientConfigTemplateFilePath;
      var storageDirectoryPath = path.join(dataPath, 'storage');
      if (os.platform() == 'win32') {
        commonPath = path.resolve(path.normalize('C:\\program files (x86)\\steam\\steamapps\\common'));
        starboundExecutable = path.join(commonPath, 'starbound\\win32\\starbound.exe');
        clientConfigFilePath = path.join(dataPath, 'client.config');
        clientConfigTemplateFilePath = path.join(appPath, 'templates\\client.config.win32.template');
        modFilePath = path.join(dataPath, 'mods\\mods.pak');
      } else if (os.type() == 'Darwin') {
        commonPath = path.resolve(path.normalize(path.join(process.env['HOME'], '/Library/Application\ Support/Steam/steamapps/common')));
        starboundExecutable = path.join(commonPath, 'Starbound/osx/Starbound.app/Contents/MacOS/starbound');
        clientConfigFilePath = path.join(dataPath, 'client.config');
        clientConfigTemplateFilePath = path.join(appPath, 'templates/client.config.darwin.template');
        modFilePath = path.join(dataPath, 'mods/mods.pak');
      } else {
        throw os.type() + ' not currently supported.'
      }

      var configFileData = {
        commonPath: commonPath,
        starboundExecutable: starboundExecutable,
        clientConfigFilePath: clientConfigFilePath,
        clientConfigTemplateFilePath: clientConfigTemplateFilePath,
        storageDirectoryPath: storageDirectoryPath,
        modFilePath: modFilePath
      }

      me.saveConfig(configFileData);
    }

    return jsonfile.readFileSync(configFilePath);
  },

  updateClientConfig: function(platformConfig) {
    var clientConfigTemplateFilePath = platformConfig.clientConfigTemplateFilePath;
    var clientConfigString = fs.readFileSync(clientConfigTemplateFilePath).toString();
    clientConfigString = clientConfigString.replace(new RegExp("{CUR_PATH}", 'g'), path.normalize(dataPath).replace(new RegExp('\\\\', 'g'), '\\\\'));
    fs.writeFileSync(platformConfig.clientConfigFilePath, clientConfigString);

    if (!fs.existsSync(platformConfig.storageDirectoryPath)) {
        fs.mkdirSync(platformConfig.storageDirectoryPath);
    }
  },

  downloadOrUpdateMod: function(platformConfiguration, callback) {

    var directory = path.parse(platformConfiguration.modFilePath).dir;
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
    }

    function downloadModFile() {
      if (fs.existsSync(platformConfiguration.modFilePath)) {
        fs.unlinkSync(platformConfiguration.modFilePath);
      }

      userConsole.log('Downloading mod file.')
      var file = fs.createWriteStream(platformConfiguration.modFilePath);
      var request = http.get("http://starbound.hades.rocks/mods.pak", function(response) {
        response.pipe(file);
        response.on('end', function() {
          userConsole.log('Mod file downloaded.')
          callback();
        })
      });
    }

    if (fs.existsSync(platformConfiguration.modFilePath)) {
      userConsole.log('Fetching Server Mod File SHA256 Hash');
      http.get("http://starbound.hades.rocks/mods.pak.sha256", function(response) {
        var serverHash = '';
          response.on('data', function(chunk) {
            serverHash += chunk;
          });
          response.on('end', function() {
            var re = /^[a-f0-9]+/;
            var reResult = re.exec(serverHash);
            serverHash = reResult[0];
            userConsole.log('Server Hash Code :: ' + serverHash);
            var hash = crypto.createHash('sha256');
            var input = fs.createReadStream(platformConfiguration.modFilePath);
            input.on('readable', () => {
              var data = input.read();
              if (data)
                hash.update(data);
              else {
                var fileHash = hash.digest('hex');
                userConsole.log('Local Hash Code  :: ' + fileHash);
                if (fileHash != serverHash) {
                  userConsole.log('Hashes differ, downloading newer mods file.');
                  downloadModFile();
                } else {
                  userConsole.log('Hashes match.');
                  callback();
                }
              }
            });
          });
      });
    } else {
      userConsole.log('No local mod file found.');
      downloadModFile();
    }

  },

  startStarbound: function(platformConfig) {
    userConsole.log('Starting starbound...')

    var sbExec = execFile(platformConfig.starboundExecutable, [ '-bootconfig', platformConfig.clientConfigFilePath ], function (error, stdout, stderr) {
      if (error) {
        console.error(error);
        userConsole.log(error);
      }
    });

    sbExec.stdout.on('data', function (data) {
      userConsole.log('stdout: ' + data.toString());
    });

    sbExec.stderr.on('data', function (data) {
      userConsole.log('stderr: ' + data.toString());
    });

    sbExec.on('exit', function (code) {
      userConsole.log('child process exited with code ' + code.toString());
      userConsole.close();
    });
  },

  connect: function() {
    var me = this;
    var config = this.loadConfig();
    this.downloadOrUpdateMod(config, function() {
      me.updateClientConfig(config)
      me.startStarbound(config);
    });

  }
}
