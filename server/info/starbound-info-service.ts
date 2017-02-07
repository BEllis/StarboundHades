import * as Rx from "rx";
import * as fs from "fs";
import * as Promise from "promise";
import { ServerInfoMonitor } from "./ServerInfoMonitor";
import { ServerStatusMonitor } from "./ServerStatusMonitor";
import { ServerInfo } from "./server-info";

export class StarboundInfoService {

    serverInfoMonitor: ServerInfoMonitor;
    serverStatusMonitor: ServerStatusMonitor;

    serverInfoSubscription: Rx.Subscription = null;
    serverStatusSubscription: Rx.Subscription = null;

    serverStatusTimeoutMs = 30000;
    serverStatusSubject = new Rx.ReplaySubject(1);
    serverStatus =
        this.serverStatusSubject
        .first()
        .timeout(this.serverStatusTimeoutMs, new Error('Timed out waiting for server status to be generated.'));

    serverInfoTimeoutMs = 30000;
    serverInfoSubject = new Rx.ReplaySubject(1);
    serverInfo =
        this.serverInfoSubject
        .first()
        .timeout(this.serverInfoTimeoutMs, new Error('Timed out waiting for server info to be generated.'));

    constructor(config: any) {

        let me = this;
        me.serverStatusMonitor = new ServerStatusMonitor(config.serverConfigFilePath, config.serverLogFilePath);
        me.serverStatusSubscription =
                me.serverStatusMonitor.getServerStatus()
                .doOnError(function(err) {
                    console.log(err + '\n' + err.stack);
                })
                .retryWhen(function(errors) {
                    return errors.delay(5000);
                })
                .subscribe(me.serverStatusSubject);

        me.serverInfoMonitor = new ServerInfoMonitor(
            config.serverConfigFilePath,
            config.serverLogFilePath,
            config.serverAddress,
            config.serverBaseUrl,
            config.serverWebsiteUrl,
            config.serverUserRegistrationUrl,
            config.contactEmail,
            config.serverDescription);

        me.serverInfoSubscription = me.serverInfoMonitor.getServerInfo()
                .doOnError(function(err) {
                    console.log(err + '\n' + err.stack);
                })
                .retryWhen(function(errors) {
                    return errors.delay(5000);
                })
                .subscribe(me.serverInfoSubject);
    };

    getServerInfo(): Promise {
        return this.serverInfo.toPromise();
    }

    getServerStatus(): Promise {
        return this.serverStatus.toPromise();
    }

    getModFilePath(modHash) {
        let me = this;
        return new Promise(function(fulfill, reject) {
            var result;
            try {
                // TODO: Make this only return when the server info has been updated.
                result = me.serverInfoMonitor.getModLocalFilePath(modHash);
            } catch (err) {
                reject(err);
                return;
            }

            fulfill(result);
        });
    }
};