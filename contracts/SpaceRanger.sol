//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Utils.sol";

contract SpaceRanger is ERC1155, Ownable, Utils {
  uint public constant SHIPS_TYPE_SUPPLY = 1000;
  uint16[] public mintedShips = [0, 0, 0, 0, 0];
  uint public totalMintedShips = 0;

  mapping(address => uint) public userScores; // total scores
  mapping(address => uint) public userLevel; // last user level
  mapping(address => Ship[]) public userShips;

  struct Ship {
    uint id;
    uint8 health;
    uint8 attack;
    uint8 weapons;
    uint8 speed;
    uint8 level;
    uint8 shipType;
    bool onSale;
    uint salePrice;
  }

  constructor() ERC1155("https://bafybeibxyhdne4x3uqblljkl2aetxvldtpb4lctstjqe22yr77gnrnlaia.ipfs.nftstorage.link/{id}.json") {}

  function uri(uint _tokenId) override public pure returns (string memory){
    return string(
      abi.encodePacked(
        "https://ipfs.io/ipfs/bafybeibxyhdne4x3uqblljkl2aetxvldtpb4lctstjqe22yr77gnrnlaia/",
        Strings.toString(_tokenId),
        ".json"
      )
    );
  }

  function setURI(string memory _uri) public onlyOwner {
    _setURI(_uri);
  }

  function mint(uint8 _shipTypeId) public {
    require(_shipTypeId < mintedShips.length, "SpaceShip doesn't exists");
    require(_shipTypeId > 0, "Wrong SpaceShip ID");
    require(userShips[msg.sender].length == 0, "You already have SpaceShip");

    uint8 _shipTypeIndex = _shipTypeId - 1;
    require(mintedShips[_shipTypeIndex] < SHIPS_TYPE_SUPPLY, "No more ships of this modification in our station.");

    uint _id = ++totalMintedShips;
    _mint(msg.sender, _id, 1, "");
    mintedShips[_shipTypeIndex] += 1;

    (uint8 _health, uint8 _attack, uint8 _speed,uint8 _weapons) = Utils.getShipStats(_shipTypeId);

    Ship memory _newShip = Ship({
    id : _id,
    health : _health,
    attack : _attack,
    weapons : _weapons,
    speed : _speed,
    level : 1,
    shipType : _shipTypeId,
    onSale : false,
    salePrice : 0
    });
    userShips[msg.sender].push(_newShip);
  }

  function getUserShips(address _owner) public view returns (Ship[] memory){
    Ship[] memory _result = new Ship[](userShips[_owner].length);
    for (uint _i = 0; _i < userShips[_owner].length; ++_i) {
      _result[_i] = userShips[_owner][_i];
    }
    return _result;
  }

  function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
  internal
  override(ERC1155)
  {
    super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
  }

}

