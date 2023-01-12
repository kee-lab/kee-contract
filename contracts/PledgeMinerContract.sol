//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interfaces/IERC20.sol";
import "./TickerContract.sol";

contract PledgeMinerContract is OwnableUpgradeable {
    IERC20 public payToken; // is REA token to buy the ticker
    IERC20 public usdtToken;
    TickerContract public tickerContract;
    mapping(address => bool) public isManager;
    uint256 minerIndex = 0;

    event PledgeMiner(
        address user,
        uint256 tickerIndex,
        uint256 level,
        uint256 multiple,
        uint256 valueAmount,
        uint256 payAmount,
        uint256 usdtAmount,
        address rewardToken
    );

    //onlyManager
    modifier onlyManager() {
        require(isManager[msg.sender], "Not manager");
        _;
    }

    function initialize(address _payToken, address _usdtToken)
        public
        initializer
    {
        payToken = IERC20(_payToken);
        usdtToken = IERC20(_usdtToken);
        __Ownable_init();
        isManager[msg.sender] = true;
    }

    mapping(address => mapping(uint256 => Miner)) public userMinerMap;

    struct Miner {
        address user;
        uint256 tickerIndex;
        uint256 level;
        uint256 multiple; // the reward multiple
        uint256 valueAmount; //total usdt value
        uint256 payAmount; // pay REA amount
        uint256 usdtAmount; // pay usdt amount
        address rewardToken; // reward token
    }

    //pledge the miner
    function pledgeMiner(
        address buyer,
        uint256 tickerIndex,
        uint256 payAmount,
        uint256 usdtAmount,
        uint256 multiple,
        uint256 valueAmount,
        address rewardToken
    ) public onlyManager {
        //query user have the ticker
        TickerContract.Ticker memory ticker = tickerContract.getUserTick(
            buyer,
            tickerIndex
        );
        //
        require(ticker.buyer == buyer, "the user is not the buyer");
        require(ticker.isUsed == true, "ticker is used");
        //notice tickerContract.useTicker method can be called by manager,so must set this contract is the manager of the tickerContract
        tickerContract.useTicker(buyer, tickerIndex);
        //receive user money
        if (payAmount > 0) {
            payToken.transferFrom(buyer, address(this), payAmount);
        }
        if (usdtAmount > 0) {
            usdtToken.transferFrom(buyer, address(this), usdtAmount);
        }
        // generate the minter
        Miner memory miner = Miner({
            user: buyer,
            tickerIndex: tickerIndex,
            level: ticker.minerLevel,
            multiple: multiple,
            valueAmount: valueAmount,
            payAmount: payAmount,
            usdtAmount: usdtAmount,
            rewardToken: rewardToken
        });
        minerIndex += 1;
        userMinerMap[buyer][minerIndex] = miner;

        // emit a pledge event
    }

    function setManager(address _manager, bool _flag) public onlyOwner {
        isManager[_manager] = _flag;
    }
}
