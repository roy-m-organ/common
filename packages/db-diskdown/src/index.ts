// Copyright 2017-2018 @polkadot/db-diskdown authors & contributors
// This software may be modified and distributed under the terms
// of the ISC license. See the LICENSE file for details.

import { DiskStore, ProgressValue } from './types';

import { AbstractLevelDOWN } from 'abstract-leveldown';
import isUndefined from '@polkadot/util/is/undefined';
import logger from '@polkadot/util/logger';

import Combined from './store/Combined';

const KEY_LENGTH = 32;

const l = logger('disk/scatter');
const noop = () =>
  undefined;

class DiskDown extends AbstractLevelDOWN {
  _disk: DiskStore;

  constructor (location: string) {
    super(location);

    this._disk = new Combined(location);
  }

  compact (progress: (value: ProgressValue) => void): void {
    l.debug(() => ['compact']);

    this._disk.compact(progress);
  }

  _open (options: any, callback: Function) {
    l.debug(() => ['_open', options]);

    this._disk.open();

    process.nextTick(callback);
  }

  _close (callback: Function) {
    l.debug(() => ['_close']);

    this._disk.close();

    process.nextTick(callback);
  }

  _batch (array: Array<any>, options: any, callback: Function) {
    l.debug(() => ['_batch', array]);

    array.forEach(({ key, type, value }) => {
      switch (type) {
        case 'del':
          return this._del(key, {}, noop);

        case 'put':
          return this._put(key, value, {}, noop);

        default:
          // ignore
      }
    });

    process.nextTick(callback);
  }

  _del (key: Buffer, options: any, callback: Function) {
    l.debug(() => ['_del', key]);

    this._disk.delete(key);

    process.nextTick(callback);
  }

  _get (key: Buffer, options: any, callback: Function) {
    l.debug(() => ['_get', key.toString('hex')]);

    const value = this._disk.get(key);

    if (isUndefined(value)) {
      process.nextTick(callback, new Error('NotFound'));
      return;
    }

    process.nextTick(callback, null, value);
  }

  _put (key: Buffer, value: Buffer, options: any, callback: Function) {
    l.debug(() => ['_put', key.toString('hex'), value]);

    this._disk.set(key, value);

    process.nextTick(callback);
  }

  _serializeKey (key: Buffer): Buffer {
    if (key.length === KEY_LENGTH) {
      return key;
    } else if (key.length < KEY_LENGTH) {
      const paddedKey = Buffer.alloc(KEY_LENGTH);

      paddedKey.set(key, 0);

      return paddedKey;
    }

    throw new Error(`${key.toString()} too large, expected <= 32 bytes`);
  }
}

export default function (location: string) {
  return new DiskDown(location);
}