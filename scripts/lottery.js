// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers, network } = require("hardhat");

async function main() {
    const signers = await ethers.getSigners();
    const balance0 = await ethers.provider.getBalance(signers[0].address);
    const balance1 = await ethers.provider.getBalance(signers[1].address);

    const FactoryClone = await ethers.getContractFactory("FactoryClone");

    const factory = await FactoryClone.deploy();
    await factory.deployed();
    console.log("Factory contract is deployed to:", factory.address);


    const proxyAddress = await (await factory.createToken("NFTLottery", "NFTL", ethers.utils.parseEther("1"), 500, 1000, signers[0].address));
    const { events: events } = await proxyAddress.wait();
    const { address } = events.find(Boolean);

    const lottery = await ethers.getContractAt("NFTLottery", address);

    console.log("Lottery contract is deployed to:", lottery.address);

    await network.provider.send("hardhat_mine", ["0x1F4"]);

    await lottery.connect(signers[1]).buy("ipfs://QmcwnwWTwjQi6Z4eCeG9gXXB3fDjK8tAvMnegFT3uKsm79", {value: ethers.utils.parseEther("1")});
    await lottery.connect(signers[1]).buy("ipfs://QmcwnwWTwjQi6Z4eCeG9gXXB3fDjK8tAvMnegFT3uKsm79", {value: ethers.utils.parseEther("1")});
    await lottery.connect(signers[2]).buy("ipfs://QmcwnwWTwjQi6Z4eCeG9gXXB3fDjK8tAvMnegFT3uKsm79", {value: ethers.utils.parseEther("1")});
    await lottery.connect(signers[2]).buy("ipfs://QmcwnwWTwjQi6Z4eCeG9gXXB3fDjK8tAvMnegFT3uKsm79", {value: ethers.utils.parseEther("1")});
    await lottery.connect(signers[3]).buy("ipfs://QmcwnwWTwjQi6Z4eCeG9gXXB3fDjK8tAvMnegFT3uKsm79", {value: ethers.utils.parseEther("1")});
    await lottery.connect(signers[3]).buy("ipfs://QmcwnwWTwjQi6Z4eCeG9gXXB3fDjK8tAvMnegFT3uKsm79", {value: ethers.utils.parseEther("1")});
    await lottery.connect(signers[4]).buy("ipfs://QmcwnwWTwjQi6Z4eCeG9gXXB3fDjK8tAvMnegFT3uKsm79", {value: ethers.utils.parseEther("1")});
    await lottery.connect(signers[4]).buy("ipfs://QmcwnwWTwjQi6Z4eCeG9gXXB3fDjK8tAvMnegFT3uKsm79", {value: ethers.utils.parseEther("1")});
    await lottery.connect(signers[5]).buy("ipfs://QmcwnwWTwjQi6Z4eCeG9gXXB3fDjK8tAvMnegFT3uKsm79", {value: ethers.utils.parseEther("1")});
    await lottery.connect(signers[5]).buy("ipfs://QmcwnwWTwjQi6Z4eCeG9gXXB3fDjK8tAvMnegFT3uKsm79", {value: ethers.utils.parseEther("1")});


    const firstWinner = (await (await lottery.getWinner()).wait()).events[0]?.args?.winner;
    console.log("First winner: ", firstWinner);

    await network.provider.send("hardhat_mine", ["0x3EA"]);

    const secondWinner = (await (await lottery.getWinner()).wait()).events[0]?.args?.winner;
    console.log("Second winner: ", secondWinner);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
