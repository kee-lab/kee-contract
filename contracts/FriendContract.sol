//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./TickerContract.sol";

contract FriendContract is OwnableUpgradeable {
    uint public DIV_NUM = 10000;

    uint public user_percent = 500;
    uint public platform_percent =500;
    address public plateform_address;

    //用户一定数量的eth购买另外一个朋友的share.需要eth的数量根据该用户所持的share数量决定.
    //price = k*k/10000 , k 为用户拥有的好友数.(用户拥有的share令牌的数量f)

    //用户拥有的好友数量
    mapping(address=>uint256) userFriendAmount;

    //记录用户的所有的好友.记录哪些用户买了当前用户的shares.
    //seller => buyer => bool
    mapping(address=>mapping(address=>bool)) userFriends;

    //记录用户拥有的shares.记录当前用户购买了哪些用户的shares.
    //buyer => seller => Share
    mapping(address=>mapping(address=>bool)) userShares;

    struct Share{
        address friend;
        address buyer;
    }

    event BuyUserEvent(
        address buyer,
        address seller,
        uint256 price
    );

    //用户好友的share.
    function buyShare(address seller) public payable{
        uint buy = msg.value;
        //计算当前用户的share的价格
        uint256 k = userFriendAmount[seller];
        uint price = k*k/DIV_NUM;
        require(buy >= price,"not enough token");
        // 拥有该好友的share的数量增加一个。
        userFriendAmount[seller] = userFriendAmount[seller] + 1;
        address buyer = msg.sender;
        userFriends[seller][buyer] = true;
        userShares[buyer][seller] = true;

        //emit a event.
        emit BuyUserEvent(buyer,seller,price);

        // 分配5%的金额给seller,5%的费用给平台.
        uint user_share = price*user_percent/10000;
        uint platform_share = price*platform_percent/10000;
        seller.transfer(user_share);
        //如果合约未初始化，是否可以进行转账。
        plateform_address.transfer(plateform_share);
    }

    // TODO 用户卖出当前share
    function sellShare(address yourFriend)public{
        address buyer = msg.sender;
        //确保用户有这个用户的share
        require(userShares[buyer][seller],"no shares");
        uint k = userFriendAmount[yourFriend]-1;
        uint price = k*k/DIV_NUM;
        uint total_share = user_percent + platform_percent;
        uint total_fee = price * total_share / 10000;
        uint sell_price = price - total_fee;
        buyer
    }

    //查询用户的price
    function buyPrice(address seller)view public returns(uint256){
        uint256 k = userFriendAmount[seller];
        uint price = k*k/DIV_NUM;
        return price;
    }


    function initialize(address _plateform_address) public initializer {
        isManager[msg.sender] = true;
        plateform_address = _plateform_address;
    }

    mapping(address => bool) public isManager;
    //onlyManager
    modifier onlyManager() {
        require(isManager[msg.sender], "Not manager");
        _;
    }

    function setDivNum(uint _divNum) public onlyManager {
        DIV_NUM = _divNum;
    }

    // uint public user_pencent = 5;
    // uint public platform_percent =5;

    function setUserPercent(uint _userPercent) public onlyManager {
        user_percent = _userPercent;
    }

    function setPlatformPercent(uint _platformPercent) public onlyManager {
        plateform_percent = _platformPercent;
    }
}
