//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../abstract/ShipHelper.sol";

contract SpaceRanger is ERC1155, Ownable, ShipHelper {
  uint public constant SHIPS_TYPE_SUPPLY = 1000;
  uint16[] public mintedShips = [0, 0, 0, 0, 0];
  uint public totalMintedShips = 0;

  mapping(address => uint) public userScores; // total scores
  mapping(address => uint) public userLevel; // last user level
  mapping(uint => Ship) public ships; // all spaceShips by id
  mapping(address => uint[]) public userShips; // list of user ships
  mapping(address => uint) public lastFlyTime; // timestamp of last fly - used for energy check

  enum ShipUpgradeType {
    Armor, // + health (+2x3)
    Engine, // + speed (+1x1)
    Energy, // + daily fly amount (+2x2)
    Weapon // + attack (+2x2)
  }

  struct Ship {
    uint id;
    uint8 health;
    uint8 attack;
    uint8 weapons;
    uint8 speed;
    uint8 level;
    uint8 currentEnergy;
    uint8 maxEnergy;
    uint8 shipType;
    bool onSale;
    uint salePrice;
    uint totalBattles;
    ShipUpgradeType[] upgrades;
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

    (uint8 _health, uint8 _attack, uint8 _speed,uint8 _weapons) = ShipHelper.getShipStats(_shipTypeId);

    Ship memory _newShip = Ship({
    id : _id,
    health : _health,
    attack : _attack,
    weapons : _weapons,
    speed : _speed,
    level : 1,
    currentEnergy : 10,
    maxEnergy : 10,
    shipType : _shipTypeId,
    onSale : false,
    salePrice : 0,
    totalBattles : 0,
    upgrades : new ShipUpgradeType[](0)
    });

    ships[_id] = _newShip;
    userShips[msg.sender].push(_id);
  }

  function getUserShips(address _owner) public view returns (Ship[] memory){
    Ship[] memory _result = new Ship[](userShips[_owner].length);
    for (uint _i = 0; _i < userShips[_owner].length; ++_i) {
      _result[_i] = ships[userShips[_owner][_i]];
    }
    return _result;
  }

  // Upgrade SpaceShip characteristics
  function upgradeShip(uint _id, ShipUpgradeType _upgradeType) public {
    Ship storage ship = ships[_id];

    require(ship.id == _id, "SpaceShip not found");
    require(ship.upgrades.length < 6, "Can't upgrade ship, spots limit reached");

    uint8 _countUpgrades = 0;
    for (uint _i = 0; _i < ship.upgrades.length; ++_i) {
      if (ship.upgrades[_i] == _upgradeType) {
        _countUpgrades++;
      }
    }

    if (_upgradeType == ShipUpgradeType.Armor) {
      require(_countUpgrades < 3, "Can't upgrade, armor spots limit reached");
      ship.health += 2;
    } else if (_upgradeType == ShipUpgradeType.Engine) {
      require(_countUpgrades == 0, "Can't upgrade, engine spots limit reached");
      ship.speed += 1;
    } else if (_upgradeType == ShipUpgradeType.Weapon) {
      require(_countUpgrades < 2, "Can't upgrade, weapon spots limit reached");
      ship.attack += 2;
    } else if (_upgradeType == ShipUpgradeType.Energy) {
      require(_countUpgrades < 2, "Can't upgrade, energy spots limit reached");
      ship.maxEnergy += 2;
    }

    ship.upgrades.push(_upgradeType);
  }

  function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
  internal
  override(ERC1155)
  {
    super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
  }

}

