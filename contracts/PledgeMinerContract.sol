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
    address public blackholeAddress;    // blackhole address
    uint256 public blackHolePercent;    // blackhole percent
    address public ecologyAddress;
    uint256 public ecologyPercent;
    address public teamRewardAddress;
    uint256 public teamRewardPercent;
    uint public base=100;   //  base 
    //store the fee token
    address public claimAccountAddress;
    mapping(address => mapping(uint256 => Miner)) public userMinerMap;

    // mapping(address => mapping(uint256 => uint)) public userClaimProfileMap;    //user=>miner=>profile amount

    mapping(uint=>uint) public levelFeeMapping; // level to fee mapping

    //onlyManager
    modifier onlyManager() {
        require(isManager[msg.sender], "Not manager");
        _;
    }

    function initialize(
        address _payToken,
        address _usdtToken,
        address _blackholeAddress,
        uint256 _blackHolePercent,
        address _ecologyAddress,
        uint256 _ecologyPercent,
        address _teamRewardAddress,
        uint256 _teamRewardPercent,
        address _claimAccountAddress
    ) public initializer {
        payToken = IERC20(_payToken);
        usdtToken = IERC20(_usdtToken);
        blackholeAddress = _blackholeAddress;
        blackHolePercent = _blackHolePercent;
        ecologyAddress = _ecologyAddress;
        ecologyPercent = _ecologyPercent;
        teamRewardAddress = _teamRewardAddress;
        teamRewardPercent = _teamRewardPercent;
        __Ownable_init();
        isManager[msg.sender] = true;
        levelFeeMapping[1] = 2; 
        levelFeeMapping[2] = 4;
        levelFeeMapping[3] = 6; 
        levelFeeMapping[4] = 10; 
        levelFeeMapping[5] = 20; 
        claimAccountAddress = _claimAccountAddress;
    }


    function claimProfit(address userAddress,uint _minerIndex,uint profitAmount)public onlyManager{
        
        
        Miner storage miner = userMinerMap[userAddress][_minerIndex];
        // check the ticker is exist
        require(miner.user == userAddress, "the user is not the buyer");
        //TODO check the left money to less than the profitAmount
        uint claimRewardAmount = miner.claimRewardAmount;
        uint rewardAmount = miner.valueAmount*miner.multiple;
        require(claimRewardAmount+profitAmount<=rewardAmount,"claim amount too high!");
        if (claimRewardAmount+profitAmount<=rewardAmount){
            //TODO: 退出该矿机。
        }
        // TODO:增加矿机的转账金额并提现给用户。发送提现事件
        

        //receive the fee
        uint minerLevel = miner.level;
        uint drawFee = levelFeeMapping[minerLevel]*payToken.decimals();
        payToken.transferFrom(userAddress, claimAccountAddress, drawFee);
        // transfer profile to user
    }

    

    struct Miner {
        address user;
        uint256 tickerIndex;
        uint256 level;
        uint256 multiple; // the reward multiple
        uint256 valueAmount; //total usdt value
        uint256 payAmount; // pay REA amount
        uint256 usdtAmount; // pay usdt amount
        address rewardToken; // reward token
        uint claimRewardAmount; // claim reward amount
    }

    //pledge the miner
    function pledgeMiner(
        address buyer,
        uint256 tickerIndex,
        uint256 payAmount,
        uint256 usdtAmount,
        uint256 valueAmount
    ) public onlyManager {
        //query user have the ticker
        TickerContract.Ticker memory ticker = tickerContract.getUserTick(
            buyer,
            tickerIndex
        );
        // check the ticker is exist
        require(ticker.buyer == buyer, "the user is not the buyer");
        require(ticker.isUsed == true, "ticker is used");
        //notice tickerContract.useTicker method can be called by manager,so must set this contract is the manager of the tickerContract
        tickerContract.useTicker(buyer, tickerIndex);
        //receive user money
        if (payAmount > 0) {
            payToken.transferFrom(buyer, address(this), payAmount);
            payToken.transfer(blackholeAddress, payAmount*blackHolePercent/base);
            payToken.transfer(ecologyAddress, payAmount*ecologyPercent/base);
            payToken.transfer(teamRewardAddress, payAmount*teamRewardPercent/base);

        }
        if (usdtAmount > 0) {
            usdtToken.transferFrom(buyer, address(this), usdtAmount);
        }

        // generate the minter
        Miner memory miner = Miner({
            user: buyer,
            tickerIndex: tickerIndex,
            level: ticker.minerLevel,
            multiple: ticker.multiple,
            valueAmount: valueAmount,
            payAmount: payAmount,
            usdtAmount: usdtAmount,
            rewardToken: ticker.rewardTokenAddress,
            claimRewardAmount:0
        });

        minerIndex += 1;
        userMinerMap[buyer][minerIndex] = miner;

        // emit a pledge event
    }

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

    function setManager(address _manager, bool _flag) public onlyOwner {
        isManager[_manager] = _flag;
    }

    function setBloackHoleAddress(address _blackholeAddress)
        public
        onlyManager
    {
        blackholeAddress = _blackholeAddress;
    }

    function setEcologyAddress(address _ecologyAddress) public onlyManager {
        ecologyAddress = _ecologyAddress;
    }

    function setTeamRewardAddress(address _teamRewardAddress)
        public
        onlyManager
    {
        teamRewardAddress = _teamRewardAddress;
    }

    function setBlackHolePercent(uint256 _blackHolePercent) public onlyManager {
        blackHolePercent = _blackHolePercent;
    }

    function setEcologyPercent(uint256 _ecologyPercent) public onlyManager {
        ecologyPercent = _ecologyPercent;
    }

    function setLevelFee(uint level,uint fee) public onlyManager {
        levelFeeMapping[level]=fee;
    }

    function setTeamRewardPercent(uint256 _teamRewardPercent)
        public
        onlyManager
    {
        teamRewardPercent = _teamRewardPercent;
    }

    function setClaimAccountAddress(address _claimAccountAddress) public onlyManager {
        claimAccountAddress = _claimAccountAddress;
    }
}
