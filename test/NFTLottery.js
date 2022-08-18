const {ethers, network} = require("hardhat");
const {expect} = require("chai");

async function deploy(name, ...params) {
    const Contract = await ethers.getContractFactory(name);
    return await Contract.deploy(...params).then(f => f.deployed());
}

describe('NFTLottery', function () {

    const name = "My NFT";
    const symbol = "MNFT";
    const URI = "ipfs://QmcwnwWTwjQi6Z4eCeG9gXXB3fDjK8tAvMnegFT3uKsm79";
    const startSellingAtBlock = 500;
    const stopSellingAtBlock = 2000;
    const nftPrice = ethers.utils.parseEther("1");
    let NftFactory;
    let nftInstance;
    let owner;
    let accounts;


    beforeEach(async () => {
        await hre.network.provider.send("hardhat_reset")
        NftFactory = await deploy("FactoryClone");
        accounts = await ethers.getSigners();
        owner = accounts[0].address;

        const proxyAddress = await NftFactory.createToken(name, symbol, nftPrice, startSellingAtBlock, stopSellingAtBlock, owner);
        const {events: events} = await proxyAddress.wait();
        const {address} = events.find(Boolean);
        nftInstance = await ethers.getContractAt("NFTLottery", address);
    });

    describe('Contract setup', function () {
        it('Should be not correctly deployed', async () => {
            await expect(NftFactory.createToken(name, symbol, nftPrice, 2500, stopSellingAtBlock, owner)).to.be.revertedWith("startSellingAtBlock can't be higher or equals then stopSellingAtBlock");
        });

        it('Should be correctly deployed', async function () {
            expect(nftInstance.address).to.be.properAddress;
            expect(await nftInstance.name()).to.equal(name);
            expect(await nftInstance.symbol()).to.equal(symbol);
            expect(await nftInstance.totalSupply()).to.equal(0);
            expect(await nftInstance.owner()).to.equal(owner);
        });

        it('Should be not able to buy early', async () => {
            await expect(nftInstance.connect(accounts[1]).buy(URI, {value: nftPrice})).to.be.revertedWith("Purchase is not available!");
        });

        it('Should be not able to buy with insufficient funds', async () => {
            await network.provider.send("hardhat_mine", ["0x1F4"]);
            await expect(nftInstance.connect(accounts[1]).buy(URI, {value: ethers.utils.parseEther("0.5")})).to.be.revertedWith("Insufficient funds to allow transfer");
        });

        it('Should be correctly buy', async () => {
            await network.provider.send("hardhat_mine", ["0x1F4"]);
            await nftInstance.connect(accounts[1]).buy(URI, {value: nftPrice});
            expect(await nftInstance.totalSupply()).to.equal(1);
        });

        it('Test correctly drawing first winner before the specified time is over', async () => {
            await network.provider.send("hardhat_mine", ["0x1F4"]);
            await nftInstance.connect(accounts[1]).buy(URI, {value: nftPrice});
            await nftInstance.connect(accounts[1]).buy(URI, {value: nftPrice});
            await nftInstance.connect(accounts[2]).buy(URI, {value: nftPrice});
            await nftInstance.connect(accounts[2]).buy(URI, {value: nftPrice});
            await nftInstance.connect(accounts[3]).buy(URI, {value: nftPrice});
            await nftInstance.connect(accounts[3]).buy(URI, {value: nftPrice});
            const winner = (await (await nftInstance.getWinner()).wait()).events[0]?.args?.winner;
            expect(await nftInstance.hasFirstWinner()).to.be.equal(true);
            expect(await nftInstance.hasSecondWinner()).to.be.equal(false);
            expect(winner).to.be.properAddress;
        });

        it('Test correctly drawing second winner after the specified time is over', async () => {
            await network.provider.send("hardhat_mine", ["0x1F4"]);
            await nftInstance.connect(accounts[1]).buy(URI, {value: nftPrice});
            await nftInstance.connect(accounts[1]).buy(URI, {value: nftPrice});
            await nftInstance.connect(accounts[2]).buy(URI, {value: nftPrice});
            await nftInstance.connect(accounts[2]).buy(URI, {value: nftPrice});
            await nftInstance.connect(accounts[3]).buy(URI, {value: nftPrice});
            await nftInstance.connect(accounts[3]).buy(URI, {value: nftPrice});
            await network.provider.send("hardhat_mine", ["0xA28"]);
            const winner = (await (await nftInstance.getWinner()).wait()).events[0]?.args?.winner;
            expect(await nftInstance.hasFirstWinner()).to.be.equal(false);
            expect(await nftInstance.hasSecondWinner()).to.be.equal(true);
            expect(winner).to.be.properAddress;
        });

        it('Test correctly drawing winners', async () => {
            await network.provider.send("hardhat_mine", ["0x1F4"]);
            await nftInstance.connect(accounts[1]).buy(URI, {value: nftPrice});
            await nftInstance.connect(accounts[1]).buy(URI, {value: nftPrice});
            await nftInstance.connect(accounts[2]).buy(URI, {value: nftPrice});
            await nftInstance.connect(accounts[2]).buy(URI, {value: nftPrice});
            await nftInstance.connect(accounts[3]).buy(URI, {value: nftPrice});
            await nftInstance.connect(accounts[3]).buy(URI, {value: nftPrice});
            const firstWinner = (await (await nftInstance.getWinner()).wait()).events[0]?.args?.winner;
            await network.provider.send("hardhat_mine", ["0xA28"]);
            const secondWinner = (await (await nftInstance.getWinner()).wait()).events[0]?.args?.winner;

            expect(await nftInstance.hasFirstWinner()).to.be.equal(true);
            expect(await nftInstance.hasSecondWinner()).to.be.equal(true);
            expect(firstWinner).to.be.properAddress;
            expect(secondWinner).to.be.properAddress;
        });
    });
});
