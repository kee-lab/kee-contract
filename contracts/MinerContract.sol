//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./TickerContract.sol";

contract MinerContract is OwnableUpgradeable {


    uint public transThreshold = 200000;
    uint256 public storeClaimFeeProfit = 0;
    uint256 public storePledageProfit = 0;
    

        // Add the library methods
    using EnumerableMap for EnumerableMap.AddressToUintMap;

    // Declare a set state variable
    EnumerableMap.AddressToUintMap claimFeeDisMap;

    function claimFeeMapSize() public view returns(uint256){
        return claimFeeDisMap.length();
    }

    function getClaimFeeMap() public view returns(address[] memory,uint256[] memory){
        address[] memory addresses = new address[](claimFeeDisMap.length());
        uint256[] memory percents = new uint256[](claimFeeDisMap.length());
        for(uint256 i = 0; i <claimFeeDisMap.length(); i++){
            (address dis,uint256 per)=claimFeeDisMap.at(i);
            addresses[i] = dis;
            percents[i] = per;
        }
        return (addresses,percents);
    }

    function setClaimFeeMap(address[] memory distributionAddresses,uint256[] memory distributionPercent) public onlyManager {
        uint256 addressLength = distributionAddresses.length;
        uint256 percentLength = distributionPercent.length;
        require(addressLength==percentLength,"address not eq percent");
        uint256 distributeLength = claimFeeDisMap.length();
        for(uint256 j=0;j<distributeLength;j++) {
            (address deliveryAddress,uint256 _percent)=claimFeeDisMap.at(0);
            claimFeeDisMap.remove(deliveryAddress);
        }
        for(uint256 i = 0; i < addressLength; i++){
            claimFeeDisMap.set(distributionAddresses[i],distributionPercent[i]);
        }
    }

    // add depoist fee map 
    // Declare a set state variable
    EnumerableMap.AddressToUintMap depositFeeDisMap;

    function depositFeeDisMapSize() public view returns(uint256){
        return depositFeeDisMap.length();
    }

    function getDepositFeeMap() public view returns(address[] memory,uint256[] memory){
        address[] memory addresses = new address[](depositFeeDisMap.length());
        uint256[] memory percents = new uint256[](depositFeeDisMap.length());
        for(uint256 i = 0; i <depositFeeDisMap.length(); i++){
            (address dis,uint256 per)=depositFeeDisMap.at(i);
            addresses[i] = dis;
            percents[i] = per;
        }
        return (addresses,percents);
    }

    function setDepositFeeMap(address[] memory distributionAddresses,uint256[] memory distributionPercent) public onlyManager {
        uint256 addressLength = distributionAddresses.length;
        uint256 percentLength = distributionPercent.length;
        require(addressLength==percentLength,"address not eq percent");
        uint256 distributeLength = depositFeeDisMap.length();
        for(uint256 j=0;j<distributeLength;j++) {
            (address deliveryAddress,uint256 _percent)=depositFeeDisMap.at(0);
            depositFeeDisMap.remove(deliveryAddress);
        }
        for(uint256 i = 0; i < addressLength; i++){
            depositFeeDisMap.set(distributionAddresses[i],distributionPercent[i]);
        }
    }
    // ----- end adddepoistfeemap
    function setIsSendProfit(bool _isSendProfit) public onlyManager {
        isSendProfit = _isSendProfit;
    }

    ERC20Burnable public reaToken; // is REA token to buy the ticker
    IERC20 public usdtToken;
    TickerContract public tickerContract;
    mapping(address => bool) public isManager;
    uint public base=10000;   //  base 
    //store the usdt token
    address public storeUsdtAddress;
    // the profit product account
    address public profitProductAccount;
    mapping(address => mapping(uint256 => Miner)) public userMinerMap;

    bool public isSendProfit = true;

    //onlyManager
    modifier onlyManager() {
        require(isManager[msg.sender], "Not manager");
        _;
    }

    function initialize(
        address _reaToken,
        address _usdtToken,
        address[] memory depositFeeAddresses,
        uint256[] memory depositFeePercent,
        address[] memory claimFeeAddresses,
        uint256[] memory calimFeePercent,
        address _tickerContractAddress,
        address _storeUsdtAddress,
        address _profitProductAccount,
        bool _isSendProfit
    ) public initializer {
        isSendProfit = _isSendProfit;
        reaToken = ERC20Burnable(_reaToken);
        usdtToken = IERC20(_usdtToken);

        uint256 depositAddressLength = depositFeeAddresses.length;
        uint256 depositPercentLength = depositFeePercent.length;
        require(depositAddressLength==depositPercentLength,"address not eq percent");
        for(uint256 i = 0; i < depositAddressLength; i++){
            depositFeeDisMap.set(depositFeeAddresses[i],depositFeePercent[i]);
        }

        uint256 claiAddressLength = claimFeeAddresses.length;
        uint256 claimPercentLength = calimFeePercent.length;
        require(claiAddressLength==claimPercentLength,"address not eq percent");
        for(uint256 i = 0; i < claiAddressLength; i++){
            claimFeeDisMap.set(claimFeeAddresses[i],calimFeePercent[i]);
        }

        __Ownable_init();
        isManager[msg.sender] = true;
        tickerContract = TickerContract(_tickerContractAddress);
        storeUsdtAddress = _storeUsdtAddress;
        profitProductAccount = _profitProductAccount;
    }


    function emergencyClaimFeeDistribute() public onlyManager {
        for(uint256 i = 0; i < claimFeeDisMap.length(); i++){
            (address distributeAddress,uint256 percent) = claimFeeDisMap.at(i);
            if(distributeAddress==address(0x4100000000000000000000000000000000000001)){
                reaToken.burn(storeClaimFeeProfit*percent/base);
            }else{
                reaToken.transfer(distributeAddress, storeClaimFeeProfit*percent/base);
            }
        }
        storeClaimFeeProfit = 0;
    }

    function claimProfit(address userAddress,uint tickerIndex,uint claimAmount,uint claimFeeAmount)public onlyManager{
        
        Miner storage miner = userMinerMap[userAddress][tickerIndex];
        // check the ticker is exist
        require(miner.user == userAddress, "the user is not the buyer");
        // check the left money to less than the profitAmount
        uint claimRewardAmount = miner.claimRewardAmount;
        uint profitAmount = miner.profitAmount; // Mining reward amount. It is the multiple of the pledged amount * mining machine
        claimRewardAmount += claimAmount;
        miner.claimRewardAmount = claimRewardAmount;
        // not limit the profitAmount

        //receive the fee
        uint minerLevel = miner.level;
        require(claimFeeAmount>0,"fee too low!");
        reaToken.transferFrom(userAddress, address(this), claimFeeAmount);
        storeClaimFeeProfit += claimFeeAmount;
        if (storeClaimFeeProfit>transThreshold*(10**reaToken.decimals())){
            for(uint256 i = 0; i < claimFeeDisMap.length(); i++){
                (address distributeAddress,uint256 percent) = claimFeeDisMap.at(i);
                if(distributeAddress==address(0x4100000000000000000000000000000000000001)){
                    reaToken.burn(storeClaimFeeProfit*percent/base);
                }else{
                    reaToken.transfer(distributeAddress, storeClaimFeeProfit*percent/base);
                }
                
            }
            storeClaimFeeProfit = 0;
        }

        if (claimRewardAmount >= profitAmount){
            // this miner exit
            miner.isExit = true;
        }
        // Increase the transfer amount of the mining machine and withdraw it to the user. Send withdrawal event
        IERC20 profileToken = IERC20(miner.profitToken);
        if(isSendProfit){
            // transfer profit to user
            profileToken.transferFrom(profitProductAccount,userAddress, claimAmount);
        }
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

    function emergencyPledgeDistribute() public onlyManager {
        for(uint256 i = 0; i < depositFeeDisMap.length(); i++){
            (address distributeAddress,uint256 percent) = depositFeeDisMap.at(i);
            if(distributeAddress==address(0x4100000000000000000000000000000000000001)){
                reaToken.burn(storePledageProfit*percent/base);
            }else{
                reaToken.transfer(distributeAddress, storePledageProfit*percent/base);
            }
            
        }
        storePledageProfit = 0;
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
        require(payAmount>0,"fee too low!");
        reaToken.transferFrom(buyer, address(this), payAmount);
        storePledageProfit += payAmount;
        if (storePledageProfit>transThreshold*(10**reaToken.decimals())){
            for(uint256 i = 0; i < depositFeeDisMap.length(); i++){
                (address distributeAddress,uint256 percent) = depositFeeDisMap.at(i);
                if(distributeAddress==address(0x4100000000000000000000000000000000000001)){
                    reaToken.burn(storePledageProfit*percent/base);
                }else{
                    reaToken.transfer(distributeAddress, storePledageProfit*percent/base);
                }
            }
            storePledageProfit = 0;
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

    function setStoreUsdtAddress(address _storeUsdtAddress) public onlyManager {
        storeUsdtAddress = _storeUsdtAddress;
    }

    function setProfitProductAccount(address _profitProductAccount) public onlyManager {
        profitProductAccount = _profitProductAccount;
    }

    function setTickerContract(address _tickerContract) public onlyManager {
        tickerContract = TickerContract(_tickerContract);
    }

    function setThreshold(uint _transThreshold) public onlyManager {
        transThreshold = _transThreshold;
    }
}
