import { ServerInfo } from "./server-info";
import { ModsMonitor } from "./ModsMonitor";

import * as fs from "fs";
import * as Rx from "rx";

export class ServerInfoMonitor {

    modsMonitor: ModsMonitor;

    serverConfigFilePath: string;
    serverPublicAddress: string;
    serverBaseUrl: string;
    serverWebsiteUrl: string;
    serverUserRegistrationUrl: string;
    contactEmail: string;
    serverDescription: string;

    constructor(
        serverConfigFilePath: string,
        serverLogFilePath: string,
        serverPublicAddress: string,
        serverBaseUrl: string,
        serverWebsiteUrl: string,
        serverUserRegistrationUrl: string,
        contactEmail: string,
        serverDescription: string) {
        this.serverConfigFilePath = serverConfigFilePath;
        this.serverPublicAddress = serverPublicAddress;
        if (!serverBaseUrl.endsWith('/')) {
            serverBaseUrl += '/';
        }

        this.serverBaseUrl = serverBaseUrl;
        this.serverWebsiteUrl = serverWebsiteUrl;
        this.serverUserRegistrationUrl = serverUserRegistrationUrl;
        this.contactEmail = contactEmail;
        this.serverDescription = serverDescription;
        this.modsMonitor = new ModsMonitor(serverLogFilePath, serverBaseUrl);
    }


    getServerInfo() {
        let me = this;
        return me.modsMonitor.getMods()
                .flatMap(function(mods) {
                    return me.getServerInfoWithMods(mods);
                })
    }

    getModLocalFilePath(modHash: string) {
        return this.modsMonitor.getModLocalFilePath(modHash);
    }

    private getServerInfoWithMods(mods: any[]) {
        var me = this;
        let readFile = Rx.Observable.fromCallback(fs.readFile);
        let returnValue =
                readFile(this.serverConfigFilePath, 'utf8')
                .map(function(result) {
                    let err = result[0];
                    let val = result[1];
                    if (err) {
                        throw new Error('Error reading server config file: ' + err);
                    }

                    try {
                        return JSON.parse(val.toString());
                    } catch (err) {
                        throw new Error('Error parsing server config file: ' + err);
                    }
                })
                .map(function(serverConfig) {
                    let serverInfo: ServerInfo = {
                        "address": me.serverPublicAddress,
                        "name": serverConfig.serverName,
                        "url": me.serverWebsiteUrl,
                        "registrationUrl": me.serverUserRegistrationUrl,
                        "email": me.contactEmail,
                        "description": me.serverDescription,
                        "infoUrl": me.serverBaseUrl + "info",
                        "statusUrl": me.serverBaseUrl + "status",
                        "mods": mods
                    };

                    return serverInfo;
                });
        return returnValue;
    }
}