//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

/**
 * @title GetPriceFeedData
 * @author Matt Jaf
 * @dev Provides a set of functions to operate with Chainlink's Price Feed contracts.
 * Contract addresses can be found at https://docs.chain.link/data-feeds/price-feeds/addresses
 * Conversion values can be viewed here: https://data.chain.link/
 *
 */
library GetPriceFeedDataV8 {
    /**
     * @dev Method for externally calling the price feed contract and extracting the answer casted to unit256.
     * @notice Delivers the current price conversion data with gas optimizations.
     *
     */
    function getPrice(address _contractAddress) internal view returns (uint256 price) {
        unchecked {
            assembly {
                ///@dev store function selector
                mstore(0x00, 0xfeaf968c)
                ///@dev allocates 64 bytes overwriting slot 0
                let success := staticcall(gas(), _contractAddress, 28, 32, 0, 64) //<-- loading output to mem
                if iszero(success) {
                    revert(0, 0)
                }
                ///@dev returns slot 1
                price := mload(32)
            }
        }
    }

    /**
     * @dev Method for retrieving the current conversion value of the token to the `_decimalPlace`.
     * @param _tokenAmount is the amount of tokens to convert to the comparitive value.
     * @param _contractAddress is the address of the chainlink price feed contract.
     * @param _decimalPlace is the amount of decimal postions less than `1` returned in `tokenAmountInComparitiveValue`.
     *
     * Requirements:
     * - checkedAmount can not exceed the max value of uint256
     *
     *@return tokenAmountInComparitiveValue DISCLAIMER: it does not round up, instead it will truncate the value based on decimals
     * @notice truncation -- this will return `0` if the value is less than `1` and `_decimalPlace` is set improperly
     *
     */
    function tokenToValue(
        uint256 _tokenAmount,
        address _contractAddress,
        uint8 _decimalPlace
    ) internal view returns (uint256 tokenAmountInComparitiveValue) {
        uint256 price = getPrice(_contractAddress) * 1e10;
        ///@notice overFlow protection -- EVM will error if the calcuated result is greater then unit256
        uint256 checkedAmount = price * (10**_decimalPlace) * _tokenAmount;
        unchecked {
            tokenAmountInComparitiveValue = checkedAmount / 1e18;
        }
    }

    /**
     * @dev Method for retrieving the price conversion amount in WEI equal to the provided token amount.
     * @param _comparitiveAmount is the comparitive value amount to get converted in to WEI.
     * @param _contractAddress is the address of the chainlink price feed contract.
     * @param _decimalPlace is the decimal place of the pricefeed data less that `1`.
     *
     * @notice Suggest this to be calculated to the 8th(+) decimal place incase a token has value less than `10^-8`.
     *
     * Requirements:
     * - checkedAmount can not exceed the max value of uint256
     * - can not divide by zero
     *
     *@return valueInWei DISCLAIMER: the return result might be a fraction of a wei off due to truncation
     * @notice truncation -- user may have to implement `+ 1` wei to the returned result on the inheriting contract
     *
     */
    function valueToWei(
        uint256 _comparitiveAmount,
        address _contractAddress,
        uint8 _decimalPlace
    ) internal view returns (uint256 valueInWei) {
        ///@notice overFlow protection -- EVM will error if the calcuated result is greater then `type(unit256).max`
        uint256 checkedAmount = _comparitiveAmount * 1e18 * (10**_decimalPlace);
        unchecked {
            uint256 price = getPrice(_contractAddress) * 1e10;
            ///@notice division by zero -- EVM will error in unchecked for divion by zero if `getPrice` returns `0`
            valueInWei = checkedAmount / ((price * (10**_decimalPlace)) / 1e18);
        }
    }
}