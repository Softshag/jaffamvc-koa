
'use strict';

export default class DispatchError extends Error {
  constructor (message) {
      super(message);
      this.message = message;
  }
}
