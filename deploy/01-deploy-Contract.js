const { network } = require("hardhat")
const { developmentChains, VERIFICATION_BLOCK_CONFIRMATIONS } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS

    log("----------------------------------------------------")

    approvedDexRouters = [ 
        "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", //uniswapV2Router ETH
        "0xEfF92A263d31888d860bD50809A8D171709b7b1c", //PancakeSwapV2Router ETH
        "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2", //SushiSwapRouter ETH?
    ]
    approved2DexTokens = [
        "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9", //AAVE
        "0x8b76f78eae80ff1d950c6316c2acc47fed05c39c", //APE
        "0xcb3b34626c28ec62808861bed59e49d0202a2108", //ARB
        "0x3637d7f6041d73917017e5d3e2259473215ecf6f", //AVAX
        "0x464921e7fede7fe40d3a974a9b6dbd72dcb4ec0c", //BNB
        "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", //WETH
        "0x0c4349c880c50d0789dcccd7263f1bbf65006996", //LINK
        "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0", //MATIC
        "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2", //MKR
        "0xde9b56f3bb816f37b4f1b5081058465ed57826a3", //SOL
        "0x6B175474E89094C44Da98b954EedeAC495271d0F", //DAI
        "0xb05d618d2142158e200f463810f1b7eb26a3f225", //USDT
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", //USDC
        "0xad29abb318791d579433d831ed122afeaf29dcfe", //FTM
        "0x211ef1ea610460db2ec6094717b524e86490c37d", //FIL
        //"0x4ea666c057e278e1f563e438cdb4cfef3048e517", //WLD
    ]
    approvedPriceFeedContracts= [
        "0x547a514d5e3769680Ce22B2361c10Ea13619e8a9", //AAVE/USD
        "0xD10aBbC76679a20055E167BB80A24ac851b37056", //APE/USD
        "0x31697852a68433DbCc2Ff612c516d69E3D9bd08F", //ARB/USD
        "0xFF3EEb22B5E3dE6e705b44749C2559d704923FD7", //AVAX/USD
        "0x14e613AC84a31f709eadbdF89C6CC390fDc9540A", //BNB/USD
        "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", //ETH/USD
        "0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c", //LINK/USD
        "0x7bAC85A8a13A4BcD8abb3eB7d6b4d632c5a57676", //MATIC/USD,
        "0xec1D1B3b0443256cc3860e24a46F108e699484Aa", //MKR/USD,
        "0x4ffC43a60e009B551865A93d232E33Fce9f01507", //SOL/USD,
        "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9", //DAI/USD,
        "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D", //USDT/USD,
        "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6", //USDC/USD,
        "0x2DE7E4a9488488e0058B95854CC2f7955B35dC9b", //FTM/ETH
        "0x0606Be69451B1C9861Ac6b3626b99093b713E801", //FIL/ETH
    ]
    let decimals = new Array(approved2DexTokens.length).fill(8);  
    const arguments = [
        approvedDexRouters,
        approved2DexTokens,
        approvedPriceFeedContracts,
        decimals  
    ]
    const contractName = await deploy("Dobo", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: waitBlockConfirmations,
    })

    // Verify the deployment
    if (
        !developmentChains.includes(network.name) &&
        process.env.VERIFY &&
        (process.env.POLYGONSCAN_API_KEY || process.env.ETHERSCAN_API_KEY)
    ) {
        log("Verifying...")
        await verify(contractName.address, arguments)
    }
    log("----------------------------------------------------")
}

module.exports.tags = ["all", "nftarticles"]
