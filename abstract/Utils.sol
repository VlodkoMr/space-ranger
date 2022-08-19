// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

abstract contract Utils {
  function randomNumber(uint _max) internal view returns (uint) {
    return uint(keccak256(abi.encodePacked(uint(1), block.difficulty, block.timestamp, uint(1)))) % _max;
  }
}
