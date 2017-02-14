import * as express from "express";
import { StarboundInfoService } from "./starbound-info-service";
import { ServerInfo } from "./server-info";
import * as fs from 'fs';

// TODO: Error handling.
// TODO: Inject from entrypoint.
var config = JSON.parse(fs.readFileSync('./config.json').toString());

let starboundInfoService = new StarboundInfoService(config);
let router = express.Router();

router.get('/', serverInfoRequestHandler);
router.get('/info', serverInfoRequestHandler);
router.get('/status', serverStatusRequestHandler);
router.get('/servers', serverListRequestHandler);
router.get('/masters', masterListRequestHandler);
router.get('/mods', listModsRequestHandler);
router.get('/mods/:modHash.metadata', modMetadataRequestHandler);
router.get('/mods/:modHash.sha256', modSha256RequestHandler);
router.get('/mods/:modHash.pak', modFileRequestHandler);
router.get('/mods/:modHash', modMetadataRequestHandler);

function getDefaultErrorHandler(res, msg?: string) {
    if (msg == null) {
        msg = 'An error occurred making this request. Please try again. If the problem persists contact your server administrator.';
    }

    return function(err) {
            console.error(err + '\n' + err.stack);
            res.status(500).send(msg);
        };
};

function serverInfoRequestHandler(req, res) {
    starboundInfoService
            .getServerInfo()
            .then(
                function(serverInfo: ServerInfo) {
                    res.setHeader("Content-Type", "application/json");
                    res.json(serverInfo);
                },
                getDefaultErrorHandler(res));
}

function serverStatusRequestHandler(req, res) {
    starboundInfoService
            .getServerStatus()
            .then(
                function(serverStatus: any) {
                    res.setHeader("Content-Type", "application/json");
                    res.json(serverStatus);
                },
                getDefaultErrorHandler(res));
}

function modSha256RequestHandler(req, res) {
    let modHash = req.params.modHash;
    getMod(modHash).then(
        function(mod) {
            if (mod == null) {
                res.status(404).send('Mod Not Found');
                return;
            }

            res.setHeader("Content-Type", "text/plain");
            res.send(mod.pakSha256);
        },
        getDefaultErrorHandler(res)
    );
}

function modMetadataRequestHandler(req, res) {
    let modHash = req.params.modHash;
    getMod(modHash).then(
        function(mod) {
            if (mod == null) {
                res.status(404).send('Mod Not Found');
                return;
            }

            res.setHeader("Content-Type", "application/json");
            res.json(mod);
        },
        getDefaultErrorHandler(res)
    );
}

function modFileRequestHandler(req, res) {
    let modHash = req.params.modHash;
    starboundInfoService.getModFilePath(modHash).then(
        function(assetFilePath) {
            if (assetFilePath == null) {
                res.status(404).send('Mod Not Found');
                return;
            }
            
            let readStream = fs.createReadStream(assetFilePath);
            readStream.on('open', function () {
                // res.setHeader("Content-Type", "application/binary");
                readStream.pipe(res);
            });

            readStream.on('error', function(err) {
                getDefaultErrorHandler(res, 'An error occured reading pak file.')
            });
        },
        getDefaultErrorHandler(res)
        );
}

function listModsRequestHandler(req, res) {
    starboundInfoService.getServerInfo()
        .then(
                function(serverInfo: ServerInfo) {
                    res.setHeader("Content-Type", "application/json");
                    res.json({ mods: serverInfo.mods});
                },
                getDefaultErrorHandler(res));
}

function masterListRequestHandler(req, res) {
    let readStream = fs.createReadStream(config.masterListFilePath);
    readStream.on('open', function () {
        res.setHeader("Content-Type", "application/json");
        readStream.pipe(res);
    });

    readStream.on('error', function(err) {
        getDefaultErrorHandler(res, 'An error occured reading ' + config.masterListFilePath + ' file.')
    });
}

function serverListRequestHandler(req, res) {
    let readStream = fs.createReadStream(config.serverListFilePath);
    readStream.on('open', function () {
        res.setHeader("Content-Type", "application/json");
        readStream.pipe(res);
    });

    readStream.on('error', function(err) {
        getDefaultErrorHandler(res, 'An error occured reading ' + config.serverListFilePath + ' file.')
    });
}

function getMod(modHash) {
    return starboundInfoService.getServerInfo()
        .then(
                function(serverInfo: ServerInfo) {
                    var matchingMods = serverInfo.mods.filter(function(val) { return val.pakSha256 == modHash; });
                    if (matchingMods.length == 0) {
                        return null;
                    }

                    return matchingMods[0];
                });
}

export = router;