// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFTLottery is Initializable, ERC721Upgradeable, OwnableUpgradeable, ERC721EnumerableUpgradeable, ERC721URIStorageUpgradeable {
    using Counters for Counters.Counter;
    event Winner(address winner);

    Counters.Counter private _tokenIdCounter;
    uint256 private MAX_SUPPLY;
    uint256 private ticketPrice;
    uint private startSellingAtBlock;
    uint private stopSellingAtBlock;
    uint256 private nonce;
    bool public hasFirstWinner;
    bool public hasSecondWinner;

    function initialize(
        string memory _nftName,
        string memory _nftSymbol,
        uint256 _ticketPrice,
        uint _startSellingAtBlock,
        uint _stopSellingAtBlock
    ) external initializer {
        require(_startSellingAtBlock < _stopSellingAtBlock, "startSellingAtBlock can't be higher or equals then stopSellingAtBlock");
        __ERC721_init(_nftName, _nftSymbol);
        __Ownable_init();

        ticketPrice = _ticketPrice;
        startSellingAtBlock = _startSellingAtBlock;
        stopSellingAtBlock = _stopSellingAtBlock;
        hasFirstWinner = false;
        hasSecondWinner = false;
        nonce = 0;
        MAX_SUPPLY = 5000;
    }

    function safeMint(address to, string memory uri) public {
        uint256 tokenId = _tokenIdCounter.current();
        require(tokenId <= MAX_SUPPLY, "Sorry, all NFTs have been minted!");
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
    internal
    override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId) internal override(ERC721Upgradeable, ERC721URIStorageUpgradeable) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
    public
    view
    override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
    returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function buy(string memory uri) public payable {
        require(block.number >= startSellingAtBlock && block.number <= stopSellingAtBlock, "Purchase is not available!");
        require(msg.value == ticketPrice, "Insufficient funds to allow transfer");
        safeMint(msg.sender, uri);
    }

    function randomGenerator() internal returns (uint) {
        uint randomnumber = uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, nonce))) % totalSupply();
        nonce++;
        return randomnumber;
    }

    function getWinner() public onlyOwner {
        require(!hasFirstWinner || !hasSecondWinner, "Winners were drawn. The lottery is not available.");

        address winner = ownerOf(randomGenerator());
        if (!hasFirstWinner && block.number >= startSellingAtBlock && block.number <= stopSellingAtBlock) {
            transferAward(payable(winner));
            emit Winner(winner);
            hasFirstWinner = true;
        }

        if (!hasSecondWinner && block.number >= stopSellingAtBlock) {
            transferAward(payable(winner));
            emit Winner(winner);
            hasSecondWinner = true;
        }
    }

    function transferAward(address payable _to) public payable onlyOwner {
        (bool success,) = _to.call{value : (address(this).balance / 2)}("");
        require(success, "Call failed");
    }
}
