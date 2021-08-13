pragma solidity >=0.8.0;

contract SimpleCalculator {
    uint256 storedData;

    constructor() payable {
        storedData = 123;
    }

    function add(uint256 x) public payable {
        storedData = storedData + x;
    }

    function sub(uint256 x) public payable {
        if (x > storedData) {
            revert('storedData less than x');
        }

        storedData = storedData - x;
    }

    function getResult() public view returns (uint256) {
        return storedData;
    }
}
