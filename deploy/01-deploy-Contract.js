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
    const arguments = [
        //args
    ]
    const contractName = await deploy("ContractName", {
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
