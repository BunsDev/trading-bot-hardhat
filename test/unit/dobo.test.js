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
        let USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
        let FTM = "0xad29abb318791d579433d831ed122afeaf29dcfe";
        let FIL = "0x211ef1ea610460db2ec6094717b524e86490c37d";
        // let WLD = "0x4ea666c057e278e1f563e438cdb4cfef3048e517";

        WETH_ABI = [
            "function deposit() external payable",
            "function approve(address spender, uint256 amount) external returns (bool)",
            "function balanceOf(address account) external view returns (uint256)",
            "function allowance(address owner, address spender) external view returns (uint256)"
            ];

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
            const amountIn = ethers.parseUnits("1", 18); // 1 WETH
            const weth = new ethers.Contract(WETH, WETH_ABI, ethers.provider).connect(deployer);
            await weth.deposit({ value: BigInt(1e20.toString()) })
            await weth.approve(UNISWAP_ROUTER_ADDRESS, amountIn);
            const UNISWAP_ROUTER_ABI = [
            "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
            ];
            uniswapRouter = new ethers.Contract(UNISWAP_ROUTER_ADDRESS, UNISWAP_ROUTER_ABI, ethers.provider).connect(deployer);
            const path = [WETH, DAI];
            const amountOutMin = ethers.parseUnits("200", 18); // At least 200 DAI
            const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time
            await uniswapRouter.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            deployer.address,
            deadline
            );
            await weth.approve(UNISWAP_ROUTER_ADDRESS, amountIn);
            const path2 = [WETH, USDC];
            const amountOutMin2 = ethers.parseUnits("200", 6); // at least 200 USDC
            await uniswapRouter.swapExactTokensForTokens(
                amountIn,
                amountOutMin2,
                path2,
                deployer.address,
                deadline
                );
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
                const dai = new ethers.Contract(DAI, WETH_ABI, ethers.provider).connect(deployer);
                const amount = ethers.parseUnits("10", 18); // 10 DAI
                const balance = await dai.balanceOf(deployer.address);
                const tx = await dai.approve(DoboContract.target, balance);
                await expect(DoboContractOwner.placeOrder(DAI, AAVE, amount, 12595122896, 100 * 1e8, 5, block.timestamp + 31536000)).to.not.be.reverted;
            });
            it("should be able to buy the order for AAVE tokens", async function () { 
                const dai = new ethers.Contract(DAI, WETH_ABI, ethers.provider).connect(deployer);
                const amount = ethers.parseUnits("10", 18); // 10 DAI
                const balance = await dai.balanceOf(deployer.address);
                const tx = await dai.approve(DoboContract.target, balance);
                const price = await DoboContractOwner.getPriceInWei(AAVE, BigInt("1000000000000000000")); 
                const purchasePrice = Number(price[0]);
                await DoboContractOwner.placeOrder(DAI, AAVE, amount, purchasePrice, purchasePrice, 2, block.timestamp + 31536000)
                await DoboContractOwner.purchaseOrder(1)
                const balanceAfter = await dai.balanceOf(deployer.address);
                expect(Number(balanceAfter)).to.be.below(Number(balance));
            });
            it("should be able to sell the order for AAVE tokens", async function () {
                const dai = new ethers.Contract(DAI, WETH_ABI, ethers.provider).connect(deployer);
                const aave = new ethers.Contract(AAVE, WETH_ABI, ethers.provider).connect(deployer);
                const amount = ethers.parseUnits("10", 18); // 10 DAI
                const balance = await dai.balanceOf(deployer.address);
                const tx = await dai.approve(DoboContract.target, balance);
                const tx2 = await aave.approve(DoboContract.target, amount);
                //this function maybe removed in future
                let price = await DoboContractOwner.getPriceInWei(AAVE, BigInt("1000000000000000000")); 
                const purchasePrice = Number(price[0]);
                const sellPrice = Number(price[0]);
                await DoboContractOwner.placeOrder(DAI, AAVE, amount, sellPrice, purchasePrice, 35, block.timestamp + 31536000)
                await DoboContractOwner.purchaseOrder(1)
                const balanceAAVE = await aave.balanceOf(deployer.address);
                console.log("Balance AAVE: ", balanceAAVE.toString());
                const balanceAfterPurchase = await dai.balanceOf(deployer.address);
                await DoboContractOwner.sellOrder(1)
                const balanceAfterSell = await dai.balanceOf(deployer.address);
                console.log("Balance of dai", ((Number(balance) - Number(balanceAfterPurchase))/1e18).toString());
                console.log("Balance of Dai after sell: ", ((Number(balance) - Number(balanceAfterSell)) / 1e18).toString());
                //expect(Number(balanceAfterSell)).to.be.above(Number(balanceAfter));
            });
            //guess i gotta write some test it kind of been a while
            it("should beable to buy the order when the market price is less than the purchase price", async function () {
                //market ~100 purchase ~1000 should
                let marketPrice = await DoboContractOwner.getPriceInWei(AAVE, BigInt("1000000000000000000")); 
                const dai = new ethers.Contract(DAI, WETH_ABI, ethers.provider).connect(deployer);
                const amount = ethers.parseUnits("10", 18); // 10 DAI
                const balance = await dai.balanceOf(deployer.address);
                const tx = await dai.approve(DoboContract.target, balance);
                const purchasePrice = 1000 * 1e8;
                await DoboContractOwner.placeOrder(DAI, AAVE, amount, purchasePrice, purchasePrice, 2, block.timestamp + 31536000)
                await expect(DoboContractOwner.purchaseOrder(1)).to.not.be.reverted;
            });
            it("should revert when the purchase price is less than the market price", async function () { 
                //market ~100 purchase ~10 should not
                let marketPrice = await DoboContractOwner.getPriceInWei(AAVE, BigInt("1000000000000000000")); 
                const dai = new ethers.Contract(DAI, WETH_ABI, ethers.provider).connect(deployer);
                const amount = ethers.parseUnits("10", 18); // 10 DAI
                const balance = await dai.balanceOf(deployer.address);
                const tx = await dai.approve(DoboContract.target, balance);
                const purchasePrice = 10 * 1e8;
                await DoboContractOwner.placeOrder(DAI, AAVE, amount, purchasePrice, purchasePrice, 2, block.timestamp + 31536000)
                await expect(DoboContractOwner.purchaseOrder(1)).to.be.revertedWith("Price is too high");
            });
            it("should revert when the sell price is less than the market price", async function () {     
                //market ~100 sellPrice at ~10 should not
                let marketPrice = await DoboContractOwner.getPriceInWei(AAVE, BigInt("1000000000000000000")); 
                const dai = new ethers.Contract(DAI, WETH_ABI, ethers.provider).connect(deployer);
                const aave = new ethers.Contract(AAVE, WETH_ABI, ethers.provider).connect(deployer);
                const amount = ethers.parseUnits("10", 18); // 10 DAI
                const balance = await dai.balanceOf(deployer.address);
                const tx = await dai.approve(DoboContract.target, balance);
                const tx2 = await aave.approve(DoboContract.target, amount);
                const purchasePrice = 1000 * 1e8;
                const sellPrice = 10 * 1e8;
                await DoboContractOwner.placeOrder(DAI, AAVE, amount, sellPrice, purchasePrice, 50, block.timestamp + 31536000)
                await DoboContractOwner.purchaseOrder(1)
                await expect(DoboContractOwner.sellOrder(1)).to.be.revertedWith("Price is too low");
            });
            it("should not revert when the sell price greater than the market price", async function () { 
                //market ~100 sellPrice at ~1000 should
                let marketPrice = await DoboContractOwner.getPriceInWei(AAVE, BigInt("1000000000000000000")); 
                const dai = new ethers.Contract(DAI, WETH_ABI, ethers.provider).connect(deployer);
                const aave = new ethers.Contract(AAVE, WETH_ABI, ethers.provider).connect(deployer);
                const amount = ethers.parseUnits("10", 18); // 10 DAI
                const balance = await dai.balanceOf(deployer.address);
                const tx = await dai.approve(DoboContract.target, balance);
                const tx2 = await aave.approve(DoboContract.target, amount);
                const purchasePrice = 1000 * 1e8;
                const sellPrice = 1000 * 1e8;
                await DoboContractOwner.placeOrder(DAI, AAVE, amount, sellPrice, purchasePrice, 50, block.timestamp + 31536000)
                await DoboContractOwner.purchaseOrder(1)
                await expect(DoboContractOwner.sellOrder(1)).to.not.be.reverted;
            });
            //gotta figure out what is going on with the slippage when it comes to selling
            it("should be able to sell the order when the market price tanks", async function () {
                //market ~100 sellPrice at ~10 should not
                //market ~100 sellPrice at ~100 should be able
                //market ~100 sellPrice at ~1000 should be able
                const usdc = new ethers.Contract(USDC, WETH_ABI, ethers.provider).connect(deployer);
                const matic = new ethers.Contract(MATIC, WETH_ABI, ethers.provider).connect(deployer);
                const amount = ethers.parseUnits("10", 2); // .10 USDC
                const balance = await usdc.balanceOf(deployer.address);
                const tx = await usdc.approve(DoboContract.target, balance);
                //const tx2 = await matic.approve(DoboContract.target, amount);
                let price = await DoboContractOwner.getPriceInWei(MATIC, BigInt("1000000000000000000")); 
                console.log("Price of MATIC: ", price.toString());
                const purchasePrice = Number(price[0]);
                const sellPrice = Number(price[0]);
                //why 29% slippage?? on sell when it can purchase fine
                //its buying tokens with low slippage and only selling with high slippage
                await DoboContractOwner.placeOrder(USDC, MATIC, amount, sellPrice, purchasePrice, 1, block.timestamp + 31536000)
                await DoboContractOwner.purchaseOrder(1)
                const balanceMATIC = await matic.balanceOf(deployer.address);
                console.log("Balance MATIC: ", balanceMATIC.toString());
                const balanceAfterPurchase = await usdc.balanceOf(deployer.address);
                //could use amount recieved from purchase order
                const tx2 = await matic.approve(DoboContract.target, ethers.MaxUint256);
                await DoboContractOwner.sellOrder(1)
                const balanceAfterSell = await usdc.balanceOf(deployer.address);
                console.log("Balance of usdc before purchase", balance.toString());
                console.log("Balance of usdc after purchase", ((Number(balance) - Number(balanceAfterPurchase))/1e6).toString());
                console.log("Balance of usdc after sell: ", ((Number(balance) - Number(balanceAfterSell)) / 1e6).toString());
                //expect(Number(balanceAfterSell)).to.be.above(Number(balanceAfter));*/
            });
            
        });//37334224209969150
    }); //3528795437475780548878
    //125.10242896 //125.95122896
    //118.835486410000000000