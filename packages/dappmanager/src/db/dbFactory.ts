import * as validate from "../utils/validate";
import { logs } from "../logs";
import { JsonFileDb } from "../utils/fileDb";
import params from "../params";

/**
 * Stores critical data for this DAppNode, such as the DynDNS identity
 * This DB should be kept small in size (1-5 KB max) and never be deleted
 */
export const dbMain = dbFactory(params.DB_MAIN_PATH);
/**
 * Stores useful but not critical data, such as the record of last seen package
 * versions, used to regulate when to send notifications. This DB can be bigger,
 * and may be deleted by the user if necessary
 */
export const dbCache = dbFactory(params.DB_CACHE_PATH);

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
export function dbFactory(dbPath: string) {
  // Define dbPath and make sure it exists (mkdir -p)
  validate.path(dbPath);
  logs.info(`New DB instance at ${dbPath}`);

  // Initialize db
  // DB returns are of unkown type. External methods below are typed
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const jsonFileDb = new JsonFileDb<Record<string, any>>(dbPath, {});

  function clearDb(): void {
    jsonFileDb.write({});
  }

  /**
   * Factory methods
   */

  /* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
  function staticKey<T>(key: string, defaultValue: T) {
    return {
      get: (): T => jsonFileDb.read()[key] ?? defaultValue,
      set: (newValue: T): void => {
        const all = jsonFileDb.read();
        all[key] = newValue;
        jsonFileDb.write(all);
      }
    };
  }

  /**
   * @param keyGetter Must return a unique string key
   * @param validate Must return a boolean (valid or not) given an item
   */
  /* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
  function indexedByKey<V, K>({
    rootKey,
    getKey,
    validate
  }: {
    rootKey: string;
    getKey: (keyArg: K) => string;
    validate?: (keyArg: K, value?: V) => boolean;
  }) {
    const getRoot = (): { [key: string]: V } =>
      jsonFileDb.read()[rootKey] || {};

    return {
      getAll: getRoot,

      get: (keyArg: K): V | undefined => {
        const value = getRoot()[getKey(keyArg)];
        if (validate && !validate(keyArg, value)) return undefined;
        return value;
      },

      set: (keyArg: K, newValue: V): void => {
        const all = jsonFileDb.read();
        const root = all[rootKey] || {};
        root[getKey(keyArg)] = newValue;
        all[rootKey] = root;
        jsonFileDb.write(all);
      },

      remove: (keyArg: K): void => {
        const all = jsonFileDb.read();
        const root = all[rootKey] || {};
        delete root[getKey(keyArg)];
        all[rootKey] = root;
        jsonFileDb.write(all);
      }
    };
  }

  // DB returns are of unkown type. External methods below are typed
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  // function getEntireDb(): any {
  //   return Object.freeze(JSON.parse(JSON.stringify(db.getState())));
  // }

  return {
    staticKey,
    indexedByKey,
    clearDb
  };
}
