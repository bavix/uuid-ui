(function () {
    'use strict';

    const uuidAlf = /[^a-z0-9]/g;
    const chunk = /.{1,2}/g;
    function _getUuid(input) {
      const uuidStr = input.toLowerCase().replaceAll(uuidAlf, '');
      if (uuidStr.length !== 32) {
        return null;
      }
      return uuidStr;
    }
    function uuidToBytes(input) {
      const uuidStr = _getUuid(input);
      if (uuidStr === null) {
        return null;
      }
      return uuidStr.match(chunk).map(b => parseInt(b, 16));
    }

    function uuidToInts(input) {
      const v = uuidToBytes(input).map(i => BigInt(i));
      if (v === null) {
        return null;
      }
      const high = BigInt(v[0] | v[1] << BigInt(8) | v[2] << BigInt(16) | v[3] << BigInt(24) | v[4] << BigInt(32) | v[5] << BigInt(40) | v[6] << BigInt(48) | v[7] << BigInt(56));
      const low = BigInt(v[8] | v[9] << BigInt(8) | v[10] << BigInt(16) | v[11] << BigInt(24) | v[12] << BigInt(32) | v[13] << BigInt(40) | v[14] << BigInt(48) | v[15] << BigInt(56));
      return {
        high: BigInt.asIntN(64, high) + "",
        low: BigInt.asIntN(64, low) + ""
      };
    }

    console.log('hello world', uuidToInts('3c2e8515-6fe0-42fd-8393-1e040826f5ea'));

})();
//# sourceMappingURL=index.js.map
