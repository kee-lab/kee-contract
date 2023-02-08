//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interfaces/IERC20.sol";
import "./TickerContract.sol";
import "hardhat/console.sol";

contract MinerContract is OwnableUpgradeable {
    IERC20 public reaToken; // is REA token to buy the ticker
    IERC20 public usdtToken;
    TickerContract public tickerContract;
    mapping(address => bool) public isManager;
    address public blackholeAddress;    // blackhole address
    uint256 public blackHolePercent;    // blackhole percent
    address public ecologyAddress;
    uint256 public ecologyPercent;
    address public teamRewardAddress;
    uint256 public teamRewardPercent;
    uint public base=100;   //  base 
    //store the fee token
    address public claimAccountAddress;
    //store the usdt token
    address public storeUsdtAddress;
    // the profit product account
    address public profitProductAccount;
    mapping(address => mapping(uint256 => Miner)) public userMinerMap;

    // mapping(address => mapping(uint256 => uint)) public userClaimProfileMap;    //user=>miner=>profit amount

    mapping(uint=>uint) public levelFeeMapping; // level to fee mapping

    //onlyManager
    modifier onlyManager() {
        require(isManager[msg.sender], "Not manager");
        _;
    }

    function initialize(
        address _reaToken,
        address _usdtToken,
        address _blackholeAddress,
        uint256 _blackHolePercent,
        address _ecologyAddress,
        uint256 _ecologyPercent,
        address _teamRewardAddress,
        uint256 _teamRewardPercent,
        address _claimAccountAddress,
        address _tickerContractAddress,
        address _storeUsdtAddress,
        address _profitProductAccount
    ) public initializer {
        reaToken = IERC20(_reaToken);
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
        tickerContract = TickerContract(_tickerContractAddress);
        storeUsdtAddress = _storeUsdtAddress;
        profitProductAccount = _profitProductAccount;
    }


    function claimProfit(address userAddress,uint tickerIndex,uint claimAmount,uint claimFeeAmount)public onlyManager{
        
        Miner storage miner = userMinerMap[userAddress][tickerIndex];
        // check the ticker is exist
        require(miner.user == userAddress, "the user is not the buyer");
        // check the left money to less than the profitAmount
        uint claimRewardAmount = miner.claimRewardAmount;
        uint profitAmount = miner.profitAmount; // 挖矿奖励金额。即为质押金额*矿机的倍数
        claimRewardAmount += claimAmount;
        miner.claimRewardAmount = claimRewardAmount;
        require(claimRewardAmount<=profitAmount,"claim amount too high");

        //receive the fee
        uint minerLevel = miner.level;
        // uint drawFee = levelFeeMapping[minerLevel]*(10**reaToken.decimals());

        console.log("contract drawFee is:",claimFeeAmount);

        reaToken.transferFrom(userAddress, claimAccountAddress, claimFeeAmount);

        if (claimRewardAmount == profitAmount){
            // this miner exit
            miner.isExit = true;
        }
        // TODO:增加矿机的转账金额并提现给用户。发送提现事件
        
        IERC20 profileToken = IERC20(miner.profitToken);
        // transfer profit to user
        profileToken.transferFrom(profitProductAccount,userAddress, claimAmount);
        
        // emit the ClaimPorfit event
        emit ClaimProfit(userAddress,tickerIndex,minerLevel,miner.multiple,claimAmount,claimFeeAmount,miner.profitToken);
    }

    event ClaimProfit(
        address user,
        uint256 minerIndex,
        uint256 level,
        uint256 multiple,
        uint256 claimAmount,
        uint256 feeAmount,
        address profitToken
    );

    

    struct Miner {
        address user;
        uint256 tickerIndex;
        uint256 level;
        uint256 multiple; // the reward multiple
        uint256 profitAmount; //total reward value
        uint256 payAmount; // pay REA amount
        uint256 usdtAmount; // pay usdt amount
        address profitToken; // profit token
        uint claimRewardAmount; // claim reward amount
        bool isExit;             //is exit
    }

    //pledge the miner
    function pledgeMiner(
        address buyer,
        uint256 tickerIndex,
        uint256 payAmount,
        uint256 usdtAmount,
        uint256 profitAmount
    ) public onlyManager {
        //query user have the ticker
        TickerContract.Ticker memory ticker = tickerContract.getUserTick(
            buyer,
            tickerIndex
        );
        // check the ticker is exist
        require(ticker.buyer == buyer, "the user is not the buyer");
        require(ticker.isUsed == false, "ticker is used");
        //notice tickerContract.useTicker method can be called by manager,so must set this contract is the manager of the tickerContract
        tickerContract.useTicker(buyer, tickerIndex);
        //receive user money
        if (payAmount > 0) {
            reaToken.transferFrom(buyer, address(this), payAmount);
            reaToken.transfer(blackholeAddress, payAmount*blackHolePercent/base);
            reaToken.transfer(ecologyAddress, payAmount*ecologyPercent/base);
            reaToken.transfer(teamRewardAddress, payAmount*teamRewardPercent/base);

        }
        if (usdtAmount > 0) {
            usdtToken.transferFrom(buyer, storeUsdtAddress, usdtAmount);
        }

        // generate the minter
        Miner memory miner = Miner({
            user: buyer,
            tickerIndex: tickerIndex,
            level: ticker.minerLevel,
            multiple: ticker.multiple,
            profitAmount: profitAmount,
            payAmount: payAmount,
            usdtAmount: usdtAmount,
            profitToken:ticker.profitToken,
            claimRewardAmount:0,
            isExit : false
        });

        userMinerMap[buyer][tickerIndex] = miner;

        // emit a pledge event
        emit PledgeMiner(buyer,tickerIndex,ticker.minerLevel,ticker.multiple,profitAmount,payAmount,usdtAmount,ticker.profitToken);
    }


    event PledgeMiner(
        address user,
        uint256 tickerIndex,
        uint256 level,
        uint256 multiple,
        uint256 profitAmount,
        uint256 payAmount,
        uint256 usdtAmount,
        address profitToken
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

    function setStoreUsdtAddress(address _storeUsdtAddress) public onlyManager {
        storeUsdtAddress = _storeUsdtAddress;
    }

    function setProfitProductAccount(address _profitProductAccount) public onlyManager {
        profitProductAccount = _profitProductAccount;
    }

    function setTickerContract(address _tickerContract) public onlyManager {
        tickerContract = TickerContract(_tickerContract);
    }
}
