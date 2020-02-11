/**
 * @description
 * TODO: Add desc
 */
export interface Keyring {
  /**
   * @description
   * In this method, you must return any JSON-serializable JavaScript object
   * that you like. It will be encoded to a string, encrypted with
   * the user's password, and stored to disk.
   * This is the same object you will receive in the deserialize() method,
   * so it should capture all the information you need to restore
   * the Keyring's state.
   */
  serialize(): Promise<any>;

  /**
   * @description
   * As discussed above, the deserialize() method will be passed
   * the JavaScript object that you returned whenthe serialize() method
   * was called.
   */
  deserialize(): Promise<any>;

  addAccounts(): Promise<any>;
}
