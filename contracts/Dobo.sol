//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./GetPriceFeedData.sol";

//place the order
//check the order -- automatically fill the order
//execute the order
//modify and cancel the order

contract Dobo is Ownable {

    //address botAddress;
    IUniswapV2Router02[] public V2DexRouters;
    //IERC20[] public Aprroved2DexTokens;
    //address[] public ApprovedPriceFeedContracts;
    mapping(address => bool) public ApprovedDexTokens; //this might be a better way to do this
    mapping(address => bool) public ApprovedPriceFeedContracts; //this might be a better way to do this
    mapping(address => address) public TokenToPriceFeed;

    event OrderPlaced(address indexed user, uint256 amount, uint256 price);
    event OrderExecuted(address indexed user, uint256 amount, uint256 price);


    struct Order {
        address OriginTokenAddress; //stable
        address TargetTokenAddress; //investment    
        uint256 amount; //amount of stable token
        uint256 PurchasePrice; //price of TargetToken in stable token -- expected amount
        uint256 SellPrice; //price of TargetToken in stable token
        uint256 slippage; //slippage of the order
        uint256 expirationDate; //expiration date of the order if the price never hits the purchase price -- how to clean?
        bool active; //active or inactive -- is this the proper place for this?
    }
    /*
    decentralized order book
    each user has multiple orders
    orders are executed based on sell and buy price and execute an array of orders
    users can look up their orders, modify them, and cancel them
     */
    mapping(uint256 => uint256[]) private sellPriceToOrderID; //maybe to order ID
    mapping(uint256 => uint256[]) private purchasePriceToOrderID; //maybe to order ID
    mapping(uint256 => Order) private IDToOrder;
    mapping(address => uint256[]) private UserToIDs; //count be be .length? 
    mapping(address => uint256[]) private UserToActiveOrderlist; //how does active and diactive orders work?

    constructor(address[] _ApprovedDexRouters, address[] _Approved2DexTokens, address[] _ApprovedPriceFeedContracts) {
        V2DexRouters = _ApprovedDexRouters;
        //Aprroved2DexTokens = _Approved2DexTokens; //there might be a better way to do this using the uniswap contracts -- unless using chainlink for price data?
        //ApprovedPriceFeedContracts = _ApprovedPriceFeedContracts;
        for (uint i = 0; i < _Approved2DexTokens.length; i++) {
            ApprovedDexTokens[_Approved2DexTokens[i]] = true;
        }
        for (uint i = 0; i < _ApprovedPriceFeedContracts.length; i++) {
            ApprovedPriceFeedContracts[_ApprovedPriceFeedContracts[i]] = true;
        }
    }

    function placeOrder(address _tokenAddress, uint256 _amount, uint256 _sellPrice, uint256 _purchasePrice, uint256 _expirationDate) external {
        require(_amount > 0 || _purchasePrice > 0 || _sellPrice > 0, "Amount & Price must be greater than zero");
        require(_expirationDate > block.timestamp, "Expiration date must be in the future");
        require(IERC20(_tokenAddress).balanceOf(msg.sender) >= _amount, "Insufficient balance");
        //pre-approved -- what about when it goes to spend?
        require(IERC20(_tokenAddress).allowance(msg.sender, address(this)) >= _amount, "Insufficient allowance"); //preferably approved and/or stake in LP prior to execution
        //is the token a valid trading pair within the uniswap contract? check to see if Dai to tokenAddress is a valid swap



        require(_tokenAddress != address(0), "Token address cannot be the zero address");
        Order memory newOrder = Order(_tokenAddress, _amount, _purchasePrice, _sellPrice, _expirationDate);
        uint256 orderId = uint256(keccak256(abi.encodePacked(msg.sender, _amount, _purchasePrice, _sellPrice, _expirationDate)));
        
        UserToIDToOrder[msg.sender][_sellPrice] = newOrder;

        purchasePriceToOrder[_purchasePrice].push(newOrder);
        sellPriceToOrder[_sellPrice].push(newOrder);


        emit OrderPlaced(msg.sender, _amount, _purchasePrice);
    }

    function purchaseOrder(uint256 _orderID) external {
        require(IDToOrder[_orderID].active == true, "Order is not active"); //double check tracking optimization and data structure
        require(IDToOrder[_orderID].expirationDate > block.timestamp, "Order has expired");
        //require(IERC20(IDToOrder[_orderID].OriginTokenAddress).balanceOf(msg.sender) >= IDToOrder[_orderID].amount, "Insufficient balance");
        //require(IERC20(IDToOrder[_orderID].OriginTokenAddress).allowance(msg.sender, address(this)) >= IDToOrder[_orderID].amount, "Insufficient allowance");
        require(GetPriceFeedData.getPrice(IDToOrder[_orderID].TargetTokenAddress) <= IDToOrder[_orderID].PurchasePrice, "Price is too high");

        require(IERC20(IDToOrder[_orderID].OriginTokenAddress).transferFrom(msg.sender, address(this), IDToOrder[_orderID].amount)), "Transfer failed";
        IDToOrder[_orderID].active = false;

        bool swapSuccessful = false;
        for (uint i = 0; i < V2DexRouters.length && !swapSuccessful; i++) {
            IUniswapV2Router02 uniswapRouter = IUniswapV2Router02(V2DexRouters[i]);
            address[] memory path = getPathForTokenToToken(IDToOrder[_orderID].OriginTokenAddress, IDToOrder[_orderID].TargetTokenAddress);

            try uniswapRouter.getAmountsOut(IDToOrder[_orderID].amount, path) returns (uint256[] memory amountsOut) {
                uint256 expectedAmountOut = amountsOut[amountsOut.length - 1] * (100 - IDToOrder[_orderID].slippage) / 100;
                //added amount * purchasePrice -- is this correct? price maybe a decimal
                if (IDToOrder[_orderID].amount * IDToOrder[_orderID].PurchasePrice >= expectedAmountOut) {
                    try uniswapRouter.swapExactTokensForTokens(
                        IDToOrder[_orderID].amount,
                        expectedAmountOut, // It's safer to use the calculated expected amount out as the minimum amount out parameter
                        path,
                        msg.sender,
                        block.timestamp + 1200
                    ) {
                        swapSuccessful = true; // Swap succeeded
                    } catch {
                        // Swap failed, continue to the next DEX           
                    }
                }
            } catch {
                // Getting amounts out failed, continue to the next DEX
            }
    }

    if (!swapSuccessful) {
        revert("All DEX swaps failed");
        // Optionally, handle the case where all swaps fail (e.g., refunding the user).
    }
}

    //Thinking in terms of automation -- possibly using chainlink, possibly offchain, thinking scalablity.
    function executeOrders() external {
        require(msg.sender == owner, "Only owner can execute orders");

        uint256 tokenBalance = IERC20(TOKEN_ADDRESS).balanceOf(address(this));
        uint256 ethBalance = address(this).balance;

        if (tokenBalance >= MINIMUM_TOKEN_AMOUNT && ethBalance > 0) {
            uint256 tokenAmount = tokenBalance / 2;
            uint256 ethAmount = ethBalance / 2;

            uniswapRouter.addLiquidityETH{value: ethAmount}(
                TOKEN_ADDRESS,
                tokenAmount,
                tokenAmount,
                ethAmount,
                address(this),
                block.timestamp
            );

            uniswapRouter.swapExactETHForTokens{value: ethAmount}(
                0,
                getPathForETHtoToken(),
                address(this),
                block.timestamp
            );

            emit OrderExecuted(msg.sender, tokenAmount, ethAmount);
        }
    }

    //if chainlink is used for automation it is going to check the price then execute the order

    function getPathForTokenToToken(address _token1, address _token2) private view returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = _token1;
        path[1] = _token2;
        return path;
    }


}
