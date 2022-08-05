// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

abstract contract Utils {
	function randomNumber(uint _max) internal view returns (uint) {
		return uint(keccak256(abi.encodePacked(0, block.difficulty, block.timestamp, uint(1)))) % _max;
	}
}