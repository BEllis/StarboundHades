export class ModInfo {
    pakUrl: string
    pakSha256: string
}

export class ServerStatus {
    
}

/*
{
        "address": "127.0.0.1",
        "name": "Underbound Starbound 123",
        "url": "http://www.hades.rocks/",
        "registrationUrl": "http://www.hades.rocks/register",
        "email": "admin@hades.rocks",
        "description": "Hades Rules!",
        "statusUrl": "http://127.0.0.1/server-status.json",
        "mods": []
} */
export class ServerInfo {
    address: string;
    name: string;
    url: string;
    registrationUrl: string;
    email: string;
    description: string;
    infoUrl: string;
    statusUrl: string;
    mods: ModInfo[];
}