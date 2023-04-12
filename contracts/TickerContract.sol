//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract TickerContract is OwnableUpgradeable {

        // Add the library methods
    using EnumerableMap for EnumerableMap.AddressToUintMap;

    uint256 public transThreshold = 50000;
    uint256 public storeProfit = 0;

    // Declare a set state variable
    EnumerableMap.AddressToUintMap distributionMap;

    function distributionMapSize() public view returns(uint256){
        return distributionMap.length();
    }

    function getDisributeAddresses() public view returns(address[] memory,uint256[] memory){
        address[] memory addresses = new address[](distributionMap.length());
        uint256[] memory percents = new uint256[](distributionMap.length());
        for(uint256 i = 0; i <distributionMap.length(); i++){
            (address dis,uint256 per)=distributionMap.at(i);
            addresses[i] = dis;
            percents[i] = per;
        }
        return (addresses,percents);
    }

    function setDistributionMap(address[] memory distributionAddresses,uint256[] memory distributionPercent) public onlyManager {
        uint256 addressLength = distributionAddresses.length;
        uint256 percentLength = distributionPercent.length;
        require(addressLength==percentLength,"address not eq percent");
        uint256 distributeLength = distributionMap.length();
        for(uint256 j=0;j<distributeLength;j++) {
            (address deliveryAddress,uint256 _percent)=distributionMap.at(0);
            distributionMap.remove(deliveryAddress);
        }
        for(uint256 i = 0; i < addressLength; i++){
            distributionMap.set(distributionAddresses[i],distributionPercent[i]);
        }
    }


    uint public base=10000;   //  base 

    ERC20Burnable public payToken; // is REA token to buy the ticker
    mapping(address => bool) public isManager;

    mapping(address => mapping(uint256 => Ticker)) public userTickMap;
    // three mutiple reward account instead of this contract address for security.
    // please prepare reward token in this account and approve max amount to this contract.
    address public tickerRewardAccount;

    // //store the fee token
    // address public claimAccountAddress;

    uint public rewardMul = 5; //reward mutiple

    // uint public tickerIndex  = 0;

    //onlyManager
    modifier onlyManager() {
        require(isManager[msg.sender], "Not manager");
        _;
    }

    function initialize(address _payToken,address _tickerRewardAccount,address[] memory claimFeeAddresses,uint256[] memory calimFeePercent) public initializer {

        uint256 claiAddressLength = claimFeeAddresses.length;
        uint256 claimPercentLength = calimFeePercent.length;
        require(claiAddressLength==claimPercentLength,"address not eq percent");
        for(uint256 i = 0; i < claiAddressLength; i++){
            distributionMap.set(claimFeeAddresses[i],calimFeePercent[i]);
        }


        payToken = ERC20Burnable(_payToken);
        tickerRewardAccount=_tickerRewardAccount;
        // claimAccountAddress = _claimAccountAddress;
        __Ownable_init();

        isManager[msg.sender] = true;
    }

    struct Ticker {
        address buyer;
        uint256 minerLevel;
        uint256 payAmount;
        bool isUsed;
        uint256 multiple;
        address profitToken;
    }

    event TickerBuy(address indexed buyer, uint256 minerLevel, uint256 payAmount,uint multiple,uint index,address profitToken);
    event DestoryTicker(address indexed buyer, uint256 index);
    event RewardTicker(address indexed buyer,uint payAmount,uint256 rewardAmount);

    //user buy ticker by manager
    function buyTicker(
        address buyer,
        uint tickerIndex,
        uint256 minerLevel,
        uint256 tickerPayAmount,
        uint256 multiple,
        address profitToken
    ) public onlyManager {
        // tickerIndex += 1;
        //receive user money
        Ticker memory userTicker = userTickMap[buyer][tickerIndex];
        require(userTicker.payAmount==0,"ticker exists");
        require(tickerPayAmount>0,"fee too low!");
        payToken.transferFrom(buyer, address(this), tickerPayAmount);
        storeProfit += tickerPayAmount;
        // if receive user money big than threshold. send the pay token to distribute address and set the storeProfit is zero. 
        if (storeProfit>transThreshold*(10**payToken.decimals())){
            for(uint256 i = 0; i < distributionMap.length(); i++){
                (address distributeAddress,uint256 percent) = distributionMap.at(i);
                if(distributeAddress==address(0x4100000000000000000000000000000000000001)){
                    payToken.burn(storeProfit*percent/base);
                }else{
                    payToken.transfer(distributeAddress, storeProfit*percent/base);
                }
            }
            storeProfit = 0;
        }

        Ticker memory ticker = Ticker(buyer,minerLevel, tickerPayAmount,false,multiple,profitToken);
        userTickMap[buyer][tickerIndex]=ticker;
        emit TickerBuy(buyer,minerLevel, tickerPayAmount,multiple,tickerIndex,profitToken);
    }

    function emergencyDistribute() public onlyManager {
        for(uint256 i = 0; i < distributionMap.length(); i++){
            (address distributeAddress,uint256 percent) = distributionMap.at(i);
            if(distributeAddress==address(0x4100000000000000000000000000000000000001)){
                payToken.burn(storeProfit*percent/base);
            }else{
                payToken.transfer(distributeAddress, storeProfit*percent/base);
            }
        }
        storeProfit = 0;
    }

    // this method only called by manager。 If anyone calle this method is very dangerous
    function rewardTicker(
        address buyer,
        uint256 payAmount
    ) public onlyManager {
        uint rewardAmount = payAmount*rewardMul;
        require(payToken.balanceOf(tickerRewardAccount)>=rewardAmount,"not enough reward");
        //receive user money
        payToken.transferFrom(tickerRewardAccount,buyer, rewardAmount);
        emit RewardTicker(buyer,payAmount,rewardAmount);
    }

    //destroy the ticker to buy the miner
    function useTicker(address user,uint index)public onlyManager{
        Ticker storage ticker = userTickMap[user][index];
        ticker.isUsed = true;
        emit DestoryTicker(user,index);
    }

    function getUserTick(address user,uint index) public view returns(Ticker memory) {
        return userTickMap[user][index];
    }

    function setManager(address _manager, bool _flag) public onlyOwner {
        isManager[_manager] = _flag;
    }


    function setRewardMultiple(uint _rewardMul) public onlyManager {
        rewardMul = _rewardMul;
    }

    function setTickerRewardAccount(address _tickerRewardAccount) public onlyManager {
        tickerRewardAccount = _tickerRewardAccount;
    }

    function setThreshold(uint256 _transThreshold) public onlyManager {
        transThreshold = _transThreshold;
    }

    
}
