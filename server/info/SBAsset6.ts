import { SbonReader } from "./sbonreader";
import * as fs from "fs";
import { StringDecoder } from "string_decoder"
import { Int64BE } from "int64-buffer";
import * as toArrayBuffer from "buffer-to-arraybuffer"

export class SBAsset6 {

    filePath: string;
    metadata: any;
    fileCount: number;

    constructor(filePath: string) {
        this.filePath = filePath;
        this.readHeader();
   }

    private readHeader() {
        let buffer = fs.readFileSync(this.filePath);
        let watermark = buffer.slice(0, 8).toString();
        if (watermark != 'SBAsset6') {
            throw new Error('Unsupported pak file.');
        }

        let offset = new Int64BE(buffer.slice(8, 16)).toNumber();
        var indexMarker = buffer.slice(offset, offset + 5).toString();
        if (indexMarker != 'INDEX') {
            throw new Error('Unable to locate INDEX');
        }

        var reader = new SbonReader(toArrayBuffer(buffer));
        reader.seek(offset + 5, false);
        this.metadata = reader.readMap();
        this.fileCount = reader.readIntVar();
    }

    public getMetadata(): any {
        return this.metadata;
    }
}






