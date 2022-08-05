//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SpaceGame is Ownable {

  uint shipsTypes = 0;
  mapping(address => uint256) scores;
  mapping(address => SpaceShip[]) scores;

  struct SpaceShip{

  }

  //  event Transfer(address indexed _from, address indexed _to, uint256 _value);

  constructor() {
  }

  function transfer(address to, uint256 amount) external {

  }
}
