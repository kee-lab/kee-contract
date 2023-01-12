//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interfaces/IERC20.sol";
// import "./libraries/RandomNumber.sol";

contract TickerContract is OwnableUpgradeable {
    IERC20 public payToken; // is REA token to buy the ticker
    mapping(address => bool) public isManager;

    mapping(address => mapping(uint256 => Ticker)) public buyTickMap;

    uint sellIndex = 0;

    //onlyManager
    modifier onlyManager() {
        require(isManager[msg.sender], "Not manager");
        _;
    }

    function initialize(address _payToken) public initializer {
        payToken = IERC20(_payToken);
        __Ownable_init();

        isManager[msg.sender] = true;
    }

    struct Ticker {
        address buyer;
        uint256 minerLevel;
        uint256 payAmount;
        bool isUsed;
    }

    event TickerBuy(address indexed buyer, uint256 minerLevel, uint256 payAmount);


    //user buy ticker by manager
    function buyTicker(
        address buyer,
        uint256 minerLevel,
        uint256 payAmount
    ) public onlyManager {
        sellIndex += 1;
        //receive user money
        payToken.transferFrom(buyer, address(this), payAmount);
        Ticker memory ticker = Ticker(buyer,minerLevel, payAmount,false);
        buyTickMap[buyer][sellIndex]=ticker;
        emit TickerBuy(buyer,minerLevel, payAmount);
    }

    //destroy the ticker to buy the miner
    function useTicker(address user,uint index)public onlyManager{
        Ticker storage ticker = buyTickMap[user][index];
        ticker.isUsed = true;
    }

    function setManager(address _manager, bool _flag) public onlyOwner {
        isManager[_manager] = _flag;
    }
}
