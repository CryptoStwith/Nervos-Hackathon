pragma solidity >=0.8.0;

contract SimpleAccumulator {
    uint256 storedData;

    constructor() payable {
        storedData = 123;
    }

    function add(uint256 x) public payable {
        storedData = storedData + x;
    }

    function get() public view returns (uint256) {
        return storedData;
    }
}
