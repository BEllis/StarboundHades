import { ServerStatus } from "./server-info";

import * as fs from "fs";
import * as Rx from "rx";

import * as XRegExp from "xregexp";
import { LogMonitor } from "./LogMOnitor";

export class ServerStatusMonitor {

    serverConfigFilePath: string;
    serverLogFilePath: string;

    constructor(serverConfigFilePath: string, serverLogFilePath: string) {
        this.serverConfigFilePath = serverConfigFilePath;
        this.serverLogFilePath = serverLogFilePath;
    }

    getServerStatus() {
        let me = this;
        let source = LogMonitor.create(me.serverLogFilePath);
        return Rx.Observable.combineLatest(
            StatusLogParser.observe(source),
            PlayersLogParser.observe(source)
        ).map(function(results) {
            // TODO: Must be a better way to do a shallow/deep copy.
            let newStatus = JSON.parse(JSON.stringify(results[0]));
            newStatus.players = results[1];
            return newStatus;
        });
    }
    
}

class StatusLogParser {

    // [15:21:10.174] [Info] Root: Preparing Root...
    startingRegex: XRegExp = new XRegExp('^\\[[^\\]]+\\] \\[[^\\]]+\\] Root: Preparing Root\\.\\.\\.$');

    // [15:21:15.610] [Info] UniverseServer: listening for incoming TCP connections on 0000:0000:0000:0000:0000:0000:0000:0000:21025
    listeningRegex: XRegExp = new XRegExp('^\\[[^\\]]+\\] \\[[^\\]]+\\] UniverseServer: listening for incoming TCP connections on (?<address>[\\d\\.:a-f]+)$');

    // [15:43:49.826] [Info] Interrupt caught!
    interruptRegex: XRegExp = new XRegExp('^\\[[^\\]]+\\] \\[[^\\]]+\\] Interrupt caught!$');

    // [15:21:15.581] [Info] Server Version 1.2.2 (linux x86_64) Source ID: 8656b8d30f3e41248de5868d2168c96962fbf6b2 Protocol: 729
    versionRegex: XRegExp = new XRegExp('^\\[[^\\]]+\\] \\[[^\\]]+\\] Server Version (?<version>[^\\s]*) \\((?<platform>.*)\\) Source ID: (?<sourceId>[\\da-f]*) Protocol: (?<protocol>[\\d]*)$');

    observer: Rx.Observer;

    // unknown | starting | active | stopped
    status: string = 'unknown';
    version: string = 'unknown';
    platform: string = 'unknown';
    sourceId: string = 'unknown';
    protocol: string = 'unknown';

    private constructor(observer: Rx.Observer) {
        this.observer = observer;
    };

    parse(line: string) {

        let me = this;

        if (me.startingRegex.test(line)) {
            me.status = 'starting';
            me.observer.onNext({
                    status: me.status,
                    version: me.version,
                    platform: me.platform,
                    sourceId: me.sourceId,
                    protocol: me.protocol,
                });
            return;
        }

        if (me.listeningRegex.test(line)) {
            me.status = 'active';
            me.observer.onNext({
                    status: me.status,
                    version: me.version,
                    platform: me.platform,
                    sourceId: me.sourceId,
                    protocol: me.protocol,
                });
            return;
        }

        if (me.interruptRegex.test(line)) {
            me.status = 'stopped';
            me.observer.onNext({
                    status: me.status,
                    version: me.version,
                    platform: me.platform,
                    sourceId: me.sourceId,
                    protocol: me.protocol,
                });
            return;
        }

        if (me.versionRegex.test(line)) {
            let version = XRegExp.exec(line, me.versionRegex).version;
            let sourceId = XRegExp.exec(line, me.versionRegex).sourceId;
            let protocol = XRegExp.exec(line, me.versionRegex).protocol;
            let platform = XRegExp.exec(line, me.versionRegex).platform;

            me.version = version;
            me.sourceId = sourceId;
            me.protocol = protocol;
            me.platform = platform;
            me.observer.onNext({
                    status: me.status,
                    version: me.version,
                    platform: me.platform,
                    sourceId: me.sourceId,
                    protocol: me.protocol,
                });
            return;
        }
    }


    static observe(source: Rx.Observable): Rx.Observable {
        return Rx.Observable.create(function(observer) {
            let parser = new StatusLogParser(observer);
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

class PlayersLogParser {

    // [15:28:54.420] [Info] UniverseServer: Client 'Rosa' <21> (0000:0000:0000:0000:0000:ffff:0124:c54b) disconnected for reason: 
    disconnectedRegex: XRegExp = new XRegExp('^\\[[^\\]]+\\] \\[[^\\]]+\\] UniverseServer: Client \\\'(?<player>.*)\\\' <[\\d]+> \\((?<address>[\\d\\.:a-f]+)\\) disconnected for reason: (?<reason>.*)$') 

    // [13:29:33.260] [Info] UniverseServer: Logged in account '<anonymous>' as player 'Rosa' from address 0000:0000:0000:0000:0000:ffff:0124:c54b
    connectedRegex: XRegExp = new XRegExp('^\\[[^\\]]+\\] \\[[^\\]]+\\] UniverseServer: Logged in account \\\'(?<account>.*)\\\' as player \\\'(?<player>.*)\\\' from address (?<address>[\\d\\.:a-f]+)$')

    // [15:21:15.610] [Info] UniverseServer: listening for incoming TCP connections on 0000:0000:0000:0000:0000:0000:0000:0000:21025
    listeningRegex: XRegExp = new XRegExp('^\\[[^\\]]+\\] \\[[^\\]]+\\] UniverseServer: listening for incoming TCP connections on (?<address>[\\d\\.:a-f]+)$');

    observer: Rx.Observer;

    players: any[] = [];

    private constructor(observer: Rx.Observer) {
        this.observer = observer;
    };

    parse(line: string) {
        let me = this;

        if (me.connectedRegex.test(line)) {
            // Player connected
            let player = XRegExp.exec(line, me.connectedRegex).player;
            let account = XRegExp.exec(line, me.connectedRegex).account;
            me.players.push({
                player: player,
                registered: account != '<anonymous>'
            });

            me.observer.onNext(me.players);
            return;
        }

        if (me.disconnectedRegex.test(line)) {
            // Player disconnected
            let player = XRegExp.exec(line, me.disconnectedRegex).player;
            me.players = me.players.filter(function(val) {
                return val.player != player;
            });

            me.observer.onNext(me.players);
            return;
        }
        
        if (me.listeningRegex.test(line)) {
            // Server restarted.
            me.players = [];
            me.observer.onNext(me.players);
            return;
        }
    }

    static observe(source: Rx.Observable): Rx.Observable {
        return Rx.Observable.create(function(observer) {
            // Start with empty array of players.
            observer.onNext([]);
            let parser = new PlayersLogParser(observer);
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