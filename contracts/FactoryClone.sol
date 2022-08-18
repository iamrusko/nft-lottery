// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./NFTLottery.sol";
import "hardhat/console.sol";

contract FactoryClone {
    address immutable tokenImplementation;

    constructor() {
        tokenImplementation = address(new NFTLottery());
    }

    function createToken(
        string memory nftName,
        string memory nftSymbol,
        uint256 ticketPrice,
        uint startSellingAtBlock,
        uint stopSellingAtBlock,
        address owner
    ) external returns (address) {
        address clone = Clones.clone(tokenImplementation);
        NFTLottery(clone).initialize(nftName, nftSymbol, ticketPrice, startSellingAtBlock, stopSellingAtBlock);
        NFTLottery(clone).transferOwnership(owner);
        return clone;
    }
}
