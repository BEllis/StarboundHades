import { StringDecoder } from "string_decoder"
import * as toBuffer from "typedarray-to-buffer";

export class SbonReader {

    offset: number;
    view: any;

    constructor(viewOrBuffer) {
        if (viewOrBuffer instanceof ArrayBuffer) {
            viewOrBuffer = new DataView(viewOrBuffer);
        } else if (!(viewOrBuffer instanceof DataView)) {
            viewOrBuffer = new DataView(viewOrBuffer.buffer);
        }

        this.offset = 0;
        this.view = viewOrBuffer;
    }

readBoolean() {
  // XXX: Might want to assert that this is only ever 0x00 or 0x01.
  return !!this.readUint8();
};

readBytes(count:number): Uint8Array {
  var start = this.view.byteOffset + this.offset;
  this.seek(count, true);
  return new Uint8Array(this.view.buffer.slice(start, start + count));
};

readByteString(length) {
    let byteData: Uint8Array = this.readBytes(length);
    return new StringDecoder('utf8').write(toBuffer(byteData));
};

readDocument() {
  var name = this.readString();

  // This seems to always be 0x01.
  var unknown = this.readUint8();

  // TODO: Not sure if this is signed or not.
  var version = this.readInt32();

  var doc = this.readDynamic();
  doc.__name__ = name;
  doc.__version__ = version;

  return doc;
};

readDocumentList() {
  var length = this.readUintVar();

  var list = [];
  for (var i = 0; i < length; i++) {
    list.push(this.readDocument());
  }
  return list;
};

readDynamic() {
  var type = this.readUint8();
  switch (type) {
    case 1:
      return null;
    case 2:
      return this.readFloat64();
    case 3:
      return this.readBoolean();
    case 4:
      return this.readIntVar();
    case 5:
      return this.readString();
    case 6:
      return this.readList();
    case 7:
      return this.readMap();
  }

  throw new Error('Unknown dynamic type ' + type);
};

/**
 * Reads the specified number of bytes and returns them as a string that ends
 * at the first null.
 */
readFixedString(length) {
  var string = this.readByteString(length);
  var nullIndex = string.indexOf('\x00');
  if (nullIndex != -1) {
    return string.substr(0, nullIndex);
  }
  return string;
};

readFloat32() {
  return this.seek(4, true).view.getFloat32(this.offset - 4);
};

readFloat64() {
  return this.seek(8, true).view.getFloat64(this.offset - 8);
};

readInt8() {
  return this.seek(1, true).view.getInt8(this.offset - 1);
};

readInt16() {
  return this.seek(2, true).view.getInt16(this.offset - 2);
};

readInt32() {
  return this.seek(4, true).view.getInt32(this.offset - 4);
};

readIntVar() {
  var value = this.readUintVar();

  // Least significant bit represents the sign.
  if (value & 1) {
    return -(value >> 1);
  } else {
    return value >> 1;
  }
};

readList() {
  var length = this.readUintVar();

  var list = [];
  for (var i = 0; i < length; i++) {
    list.push(this.readDynamic());
  }
  return list;
};

readMap() {
  var length = this.readUintVar();

  var map = Object.create(null);
  for (var i = 0; i < length; i++) {
    var key = this.readString();
    map[key] = this.readDynamic();
  }
  return map;
};

readString() {
  var length = this.readUintVar();
  return this.readByteString(length);
};

readStringDigestMap() {
  // Special structure of string/digest pairs, used by the assets database.
  var length = this.readUintVar();

  var map = Object.create(null), digest, path;
  for (var i = 0; i < length; i++) {
    path = this.readString();
    // Single space character.
    this.seek(1, true);
    digest = this.readBytes(32);
    map[path] = digest;
  }
  return map;
};

readStringList() {
  // Optimized structure that doesn't have a type byte for every item.
  var length = this.readUintVar();

  var list = [];
  for (var i = 0; i < length; i++) {
    list.push(this.readString());
  }
  return list;
};

readUint8() {
  var value = this.view.getUint8(this.offset);
  this.seek(1, true);
  return value;
};

readUint16() {
  return this.seek(2, true).view.getUint16(this.offset - 2);
};

readUint32() {
  return this.seek(4, true).view.getUint32(this.offset - 4);
};

readUintVar() {
  var value = 0;
  while (true) {
    var byte = this.readUint8();
    if ((byte & 128) == 0) {
      return value << 7 | byte;
    }

    value = value << 7 | (byte & 127);
  }
};

seek(offset, opt_relative) {
  var length = this.view.byteCount;
  if (opt_relative) {
    offset = this.offset + offset;
  } else {
    if (offset < 0) {
      offset = length + offset;
    }
  }

  if (offset < 0 || offset >= length) {
    throw new Error('Out of bounds');
  }

  this.offset = offset;
  return this;
};

}
