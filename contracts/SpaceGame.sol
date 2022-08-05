//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

contract SpaceGame {
  string public name = "My Hardhat Token";
  string public symbol = "MHT";
  uint256 public totalSupply = 1000000;
  address public owner;

  mapping(address => uint256) balances;

//  event Transfer(address indexed _from, address indexed _to, uint256 _value);

  constructor() {
//    balances[msg.sender] = totalSupply;
    owner = msg.sender;
  }

  function transfer(address to, uint256 amount) external {

  }
}
