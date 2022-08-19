// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

abstract contract Utils {
  function randomNumber(uint _max) internal view returns (uint) {
    return uint(keccak256(abi.encodePacked(uint(1), block.difficulty, block.timestamp, uint(1)))) % _max;
  }

  function getShipStats(uint _id) internal pure returns (uint8, uint8, uint8, uint8) {
    if (_id == 11) {
      return (25, 12, 5, 1);
    } else if (_id == 21) {
      return (26, 10, 6, 1);
    } else if (_id == 31) {
      return (21, 7, 4, 2);
    } else if (_id == 41) {
      return (26, 11, 5, 1);
    } else {
      return (23, 6, 4, 2);
    }
  }
}
