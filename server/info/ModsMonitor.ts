import * as Rx from "rx";
import * as fs from "fs";
import * as XRegExp from "xregexp";
import * as crypto from "crypto";
import { LogMonitor } from "./LogMOnitor";
import { SBAsset6 } from "./SBAsset6";

export class ModsMonitor {

    serverLogFilePath: string;
    serverBaseUrl: string;
    modsCache: any;

    constructor(serverLogFilePath: string, serverBaseUrl: string) {
        this.serverLogFilePath = serverLogFilePath;
        if (!serverBaseUrl.endsWith('/')) {
            serverBaseUrl += '/';
        }

        this.serverBaseUrl = serverBaseUrl;

    }

    getMods() {
        let me = this;
        return ModsLogParser.observe(LogMonitor.create(this.serverLogFilePath), this.serverBaseUrl).doOnNext(function(mods) {
            me.modsCache = {};
            for (let mod of mods) {
                me.modsCache[mod.pakSha256] = mod.localPakFilePath;
                delete mod.localPakFilePath;
            }
        });
    }

    getModLocalFilePath(modHash) {
        return this.modsCache[modHash];
    }
}

class ModsLogParser {
    
    // [08:43:17.925] [Info] Root: Done preparing Root.
    resetRegex: XRegExp = new XRegExp('^\\[[^\\]]+\\] \\[[^\\]]+\\] Root: Done preparing Root\.$');

    // [08:43:18.585] [Info] Loading assets from: '/steamcmd/starbound/mods/729427744/729427744.pak'
    assetRegex: XRegExp = new XRegExp('^\\[[^\\]]+\\] \\[[^\\]]+\\] Loading assets from: \'(?<pakPath>.+)\'$');
    
    // [08:43:19.463] [Info] Assets digest is 165ee7c10cd2eb3b63238eb402c74ed18d985e2693ab8e4b9b7f4da1f64c2375
    completeRegex: XRegExp = new XRegExp('^\\[[^\\]]+\\] \\[[^\\]]+\\] Assets digest is (?<assetDigest>.+)$');

    ignoreAssets: Array<string> = [
        "../assets/packed.pak",
        "../assets/user"
    ];

    observer: Rx.Observer;
    serverBaseUrl: string;

    assetPakPaths: string[];  
    modsMap: any;
    inprogressCounter: number = 0;
    completed: boolean = false;
    errored: boolean = false;

    private constructor(observer: Rx.Observer, serverBaseUrl: string) {
        this.observer = observer;
        this.serverBaseUrl = serverBaseUrl;
    };

    parse(line: string) {

        let me = this;

        if (me.resetRegex.test(line)) {
            // Reset server info
            console.log('New mods listing detected');
            me.assetPakPaths = [];
            me.modsMap = {};
            me.errored = false;
            me.completed = false;
            me.inprogressCounter = 0;
            // TODO: Stop any workers from previous round?
            return;
        }

        if (me.assetRegex.test(line)) {
            let assetPakPath = XRegExp.exec(line, me.assetRegex).pakPath;
            if (me.ignoreAssets.includes(assetPakPath)) {
                console.log('Skipping asset ' + assetPakPath);
                return;
            }

            me.assetPakPaths.push(assetPakPath);

            // Load up the assets package and play a sound from it.
            // console.log('Parsing ' + assetPakPath);
            let pakFileData = new SBAsset6(assetPakPath);
            var metadata = pakFileData.getMetadata();
            // console.log('Hashing ' + assetPakPath);
            let sha256sum = crypto.createHash('sha256');
            var readStream = fs.createReadStream(assetPakPath);
            readStream.on('data', function(d) { sha256sum.update(d); });
            readStream.on('end', function() {
                if ((me.completed && me.inprogressCounter == 0) || me.errored) {
                    return;
                }

                let hash = sha256sum.digest('hex');
                metadata.pakUrl = me.serverBaseUrl + 'mod/' + hash + ".pak";
                metadata.pakSha256 = hash;
                metadata.localPakFilePath = assetPakPath;
                me.modsMap[assetPakPath] = metadata;
                console.log('Loading mod ' + assetPakPath);

                if (--me.inprogressCounter == 0 && me.completed) {
                    console.log('Completed mod listing [async]');
                    let modsList = [];
                    for (let modPath of me.assetPakPaths) {
                        console.log('Publishing mod ' + modPath);
                        modsList.push(me.modsMap[modPath]);
                    }

                    me.observer.onNext(modsList);
                }
            });
            readStream.on('error', function(err) {
                if ((me.completed && me.inprogressCounter == 0) || me.errored) {
                    return;
                }

                me.errored = true;
                me.observer.onError(err);
            });

            me.inprogressCounter++;
            return;
        }

        if (me.completeRegex.test(line)) {
            me.completed = true;
            if (me.inprogressCounter == 0 && me.completed) {
                console.log('Completed mod listing [sync]');
                let modsList = [];
                for (let modPath of me.assetPakPaths) {
                    modsList.push(me.modsMap[modPath]);
                }

                me.observer.onNext(modsList);
            }

            return;
        }
    };

    static observe(source: Rx.Observable, serverBaseUrl: string) {
        return Rx.Observable.create(function(observer) {
            let parser = new ModsLogParser(observer, serverBaseUrl);
            let subscription = source.subscribe(
                function(line) {
                    parser.parse(line);
                }, function(err) {
                    observer.onError(err);
                },
                function() {
                    observer.onComplete();
                }
            );

            return subscription;
        });
    };
}