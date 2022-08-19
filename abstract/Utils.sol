// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

abstract contract Utils {
  function randomNumber(uint _max) internal view returns (uint) {
    return uint(keccak256(abi.encodePacked(uint(1), block.difficulty, block.timestamp, uint(1)))) % _max;
  }

  function indexOf(uint[] memory self, uint value) internal pure returns (uint, bool) {
    uint length = self.length;
    for (uint i = 0; i < length; ++i) if (self[i] == value) return (i, true);
    return (0, false);
  }

  function concatStrings(string memory a, string memory b) internal pure returns (string memory) {
    return string(abi.encodePacked(a, b));
  }

  function stringToUint(string memory numString) public pure returns (uint) {
    uint val = 0;
    bytes   memory stringBytes = bytes(numString);
    for (uint i = 0; i < stringBytes.length; i++) {
      uint exp = stringBytes.length - i;
      bytes1 iVal = stringBytes[i];
      uint8 uVal = uint8(iVal);
      uint jVal = uVal - uint(0x30);
      val += (uint(jVal) * (10 ** (exp - 1)));
    }
    return val;
  }
}
