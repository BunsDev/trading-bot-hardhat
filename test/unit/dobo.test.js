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

        let block;

        beforeEach(async () => {
            accounts = await ethers.getSigners() // could also do with getNamedAccounts
            deployer = accounts[0]
              let bigIntValue = BigInt("10000000000000000000000000000000000000000000000000000000");
                let hexString = "0x" + bigIntValue.toString(16).padStart(64, '0');
            await hre.network.provider.request({
                method: "hardhat_setBalance",
                params: [
                    deployer.address,
                    hexString
                ],
            });
            const UNISWAP_ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
            const WETH_ABI = [
            // Some details about the WETH contract
            "function deposit() external payable",
            "function approve(address spender, uint256 amount) external returns (bool)"
            ];
            const amountIn = ethers.parseUnits("1", 18); // 1 WETH
            const weth = new ethers.Contract(WETH, WETH_ABI, ethers.provider).connect(deployer);
            await weth.deposit({ value: BigInt(1e18.toString()) })
            const tx2 = await weth.approve(UNISWAP_ROUTER_ADDRESS, amountIn);
            const receipt2 = await tx2.wait();
            const UNISWAP_ROUTER_ABI = [
            "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
            ];
            const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
            // Connect to the Uniswap Router contract
            uniswapRouter = new ethers.Contract(UNISWAP_ROUTER_ADDRESS, UNISWAP_ROUTER_ABI, ethers.provider).connect(deployer);
            // Define the path of the swap
            const path = [WETH, DAI_ADDRESS];
            // Define the amount of WETH you want to swap
            // Define the minimum amount of DAI you want to receive
            const amountOutMin = ethers.parseUnits("200", 18); // At least 200 DAI
            // Define the deadline of the swap
            const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time
            // Execute the swap
            const tx = await uniswapRouter.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            deployer.address,
            deadline
            );

            // Wait for the transaction to be mined
            const receipt = await tx.wait();
            await deployments.fixture(["all"])
            DoboContract = await ethers.getContract("Dobo")
            DoboContractOwner = DoboContract.connect(deployer)
            //DoboContractOwner = getPriceFeedDataContract.connect(deployer)

            block = await ethers.provider.getBlock('latest');
        })
    
        describe("checking price calculations", function () {
            it("should return the price of AAVE in USD", async function () {
                let price = await DoboContractOwner.getPriceInWei(AAVE, BigInt("1000000000000000000")); 
                console.log("AAVE Caculated Price: ", price.toString());
                console.log("AAVE Caculated Price: ", 1 * Number(price[1]) /(10 ** 8));
                expect(Number(price[1])).to.be.above(0);
            });
        });
        describe("checking purchase and sell functionlity", function () {
            it("should be able to place an order for AAVE tokens", async function () {
                const DAI_ABI = [
                    "function approve(address spender, uint256 amount) external returns (bool)",
                    "function balanceOf(address account) external view returns (uint256)",
                    "function allowance(address owner, address spender) external view returns (uint256)"
                ];
                const dai = new ethers.Contract(DAI, DAI_ABI, ethers.provider).connect(deployer);
                const amount = ethers.parseUnits("10", 18); // 10 DAI
                const balance = await dai.balanceOf(deployer.address);
                console.log("Balance: ", balance.toString());
                const tx = await dai.approve(DoboContract.target, balance);
                await tx.wait();
                const allowance = await dai.allowance(deployer.address, DoboContract.target);
        
                //console.log("Order: ", order);
                //expect it to not revert
                await expect(DoboContractOwner.placeOrder(DAI, AAVE, 1, 12595122896, 100 * 1e8, 5, block.timestamp + 31536000)).to.not.be.reverted;
            });
        });
    }); 3528795437475780548878
    //125.10242896 //125.95122896
    //118.835486410000000000