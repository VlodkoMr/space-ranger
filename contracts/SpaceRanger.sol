//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Utils.sol";

contract SpaceRanger is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable, Utils {
	using Counters for Counters.Counter;
	Counters.Counter private tokenIdCounter;

	uint constant SHIPS_LIMIT = 5000;
	string shipHashIPFS;
	mapping(address => uint) userScores; // total scores
	mapping(address => uint) userLastLevel; // last planet discovered by user
	mapping(address => Ship[]) userShips;

	struct Ship {
		uint id;
		uint8 health; // 25-100
		uint8 attack; // 10-50
		uint8 weapons; // 1-4
		uint8 level; // 1-3
		uint8 modification; // ship type
		bool onSale;
		uint salePrice;
	}

	constructor(string memory _shipHashIPFS) ERC721('SpaceRanger', 'SPR') {
		shipHashIPFS = _shipHashIPFS;
	}

	function safeMint(address _account) public {
		require(userShips[_account].length == 0, 'You already mint free Space Ship');

		// Check ships limitation
		uint256 _tokenId = tokenIdCounter.current();
		require(_tokenId <= SHIPS_LIMIT, 'Sorry, you can\'t get new SpaceShip. No more ships in our space station.');

		uint8 _shipType = uint8(randomNumber(4) + 1);
		string memory _uri = string(abi.encodePacked(shipHashIPFS, '/', StringsUpgradeable.toString(_shipType), '-1.png'));

		tokenIdCounter.increment();
		_safeMint(_account, _tokenId);
		_setTokenURI(_tokenId, _uri);

		Ship memory _newShip = Ship({
		id : _tokenId,
		health : 25,
		attack : 10,
		weapons : 1,
		level : 1,
		modification : _shipType,
		onSale : false,
		salePrice : 0
		});
		userShips[_account].push(_newShip);
	}

	// The following functions are overrides required by Solidity.

	function _beforeTokenTransfer(address from, address to, uint256 tokenId)
	internal
	override(ERC721, ERC721Enumerable)
	{
		super._beforeTokenTransfer(from, to, tokenId);
	}

	function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
		super._burn(tokenId);
	}

	function tokenURI(uint256 tokenId)
	public
	view
	override(ERC721, ERC721URIStorage)
	returns (string memory)
	{
		return super.tokenURI(tokenId);
	}

	function supportsInterface(bytes4 interfaceId)
	public
	view
	override(ERC721, ERC721Enumerable)
	returns (bool)
	{
		return super.supportsInterface(interfaceId);
	}
}

