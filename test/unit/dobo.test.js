const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Dobo Unit Tests", function () {
        /*Token ADDRESSES ON ETH-MAINNET FORK*/
        //could be exported for multiple chains wihtin constants.js
        let AAVE = "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9";
        let APE = "0x8b76f78eae80ff1d950c6316c2acc47fed05c39c";
        let ARB = "0xcb3b34626c28ec62808861bed59e49d0202a2108";
        let AVAX = "0x3637d7f6041d73917017e5d3e2259473215ecf6f";
        let BNB = "0x464921e7fede7fe40d3a974a9b6dbd72dcb4ec0c";
        let WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
        let LINK = "0x0c4349c880c50d0789dcccd7263f1bbf65006996";
        let MATIC = "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0";
        let MKR = "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2";
        let SOL = "0xde9b56f3bb816f37b4f1b5081058465ed57826a3";
        let DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
        let USDT = "0xb05d618d2142158e200f463810f1b7eb26a3f225";
        let USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
        let FTM = "0xad29abb318791d579433d831ed122afeaf29dcfe";
        let FIL = "0x211ef1ea610460db2ec6094717b524e86490c37d";
        // let WLD = "0x4ea666c057e278e1f563e438cdb4cfef3048e517";

        beforeEach(async () => {
            accounts = await ethers.getSigners() // could also do with getNamedAccounts
            deployer = accounts[0]
            await deployments.fixture(["all"])
            DoboContract = await ethers.getContract("Dobo")
            DoboContractOwner = DoboContract.connect(deployer)
            //DoboContractOwner = getPriceFeedDataContract.connect(deployer)
        })
    
        describe("checking price functions", function () {
            it("should return the price of AAVE in wei", async function () {
                let price = await DoboContractOwner.getPriceInWei(AAVE, 1);
                console.log("AAVE Price: ", price.toString());
                expect(Number(price)).to.be.above(0);
            });
            it("should return the price of APE in wei", async function () {
                let price = await DoboContractOwner.getPriceInWei(APE, 1);
                console.log("APE Price: ", price.toString());
                expect(Number(price)).to.be.above(0);
            });
            it("should return the price of ARB in wei", async function () {
                let price = await DoboContractOwner.getPriceInWei(ARB, 1);
                console.log("ARB Price: ", price.toString());
                expect(Number(price)).to.be.above(0);
            });
            it("should return the price of AVAX in wei", async function () {
                let price = await DoboContractOwner.getPriceInWei(AVAX, 1);
                console.log("AVAX Price: ", price.toString());
                expect(Number(price)).to.be.above(0);
            });
            it("should return the price of BNB in wei", async function () {
                let price = await DoboContractOwner.getPriceInWei(BNB, 1);
                console.log("BNB Price: ", price.toString());
                expect(Number(price)).to.be.above(0);
            });
            it("should return the price of WETH in wei", async function () {
                let price = await DoboContractOwner.getPriceInWei(WETH, 1);
                console.log("WETH Price: ", price.toString());
                expect(Number(price)).to.be.above(0);
            });
            it("should return the price of LINK in wei", async function () {
                let price = await DoboContractOwner.getPriceInWei(LINK, 1);
                console.log("LINK Price: ", price.toString());
                expect(Number(price)).to.be.above(0);
            });
            it("should return the price of MATIC in wei", async function () {
                let price = await DoboContractOwner.getPriceInWei(MATIC, 1);
                console.log("MATIC Price: ", price.toString());
                expect(Number(price)).to.be.above(0);
            });
            it("should return the price of MKR in wei", async function () {
                let price = await DoboContractOwner.getPriceInWei(MKR, 1);
                console.log("MKR Price: ", price.toString());
                expect(Number(price)).to.be.above(0);
            });
            it("should return the price of SOL in wei", async function () {
                let price = await DoboContractOwner.getPriceInWei(SOL, 1);
                console.log("SOL Price: ", price.toString());
                expect(Number(price)).to.be.above(0);
            });
            it("should return the price of DAI in wei", async function () {
                let price = await DoboContractOwner.getPriceInWei(DAI, 1);
                console.log("DAI Price: ", price.toString());
                expect(Number(price)).to.be.above(0);
            });
            it("should return the price of USDT in wei", async function () {
                let price = await DoboContractOwner.getPriceInWei(USDT, 1);
                console.log("USDT Price: ", price.toString());
                expect(Number(price)).to.be.above(0);
            });
            it("should return the price of USDC in wei", async function () {
                let price = await DoboContractOwner.getPriceInWei(USDC, 1);
                console.log("USDC Price: ", price.toString());
                expect(Number(price)).to.be.above(0);
            });
            it("should return the price of FTM in wei", async function () {
                let price = await DoboContractOwner.getPriceInWei(FTM, 1);
                console.log("FTM Price: ", price.toString());
                expect(Number(price)).to.be.above(0);
            });
            it("should return the price of FIL in wei", async function () {
                let price = await DoboContractOwner.getPriceInWei(FIL, 1);
                console.log("FIL Price: ", price.toString());
                expect(Number(price)).to.be.above(0);
            });
        });
})
    