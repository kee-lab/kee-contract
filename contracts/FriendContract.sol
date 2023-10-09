//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "hardhat/console.sol";

contract FriendContract is OwnableUpgradeable {
    uint public DIV_NUM = 10000;

    uint ethDecimal = 1e18;

    uint public user_percent = 500;
    uint public platform_percent =500;
    address payable public plateform_address;

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

    event BuyShareEvent(
        address buyer,
        address yourFriend,
        uint256 price
    );

    event SellShareEvent(
        address buyer,
        address yourFriend,
        uint256 price
    );

    //用户好友的share.
    function buyShare(address payable yourFriend) public payable{
        uint buy = msg.value;
        // 拥有该好友的share的数量增加一个。
        userFriendAmount[yourFriend] = userFriendAmount[yourFriend] + 1;
        //计算当前用户的share的价格
        uint256 k = userFriendAmount[yourFriend];
        uint price = ethDecimal*k*k/DIV_NUM;
        require(buy >= price,"not enough token");
        address buyer = msg.sender;
        userFriends[yourFriend][buyer] = true;
        userShares[buyer][yourFriend] = true;

        //emit a event.
        emit BuyShareEvent(buyer,yourFriend,price);

        // 分配5%的金额给seller,5%的费用给平台.
        uint user_share = price*user_percent/10000;
        uint platform_share = price*platform_percent/10000;
        yourFriend.transfer(user_share);
        //如果合约未初始化，是否可以进行转账。
        console.log(plateform_address);
        require(plateform_address!=address(0),"trans 0 addr");
        plateform_address.transfer(platform_share);
    }

    // 用户卖出当前share
    function sellShare(address yourFriend)public{
        address payable  buyer = payable(msg.sender);
        //确保用户有这个用户的share
        require(userShares[buyer][yourFriend],"no shares");
        userShares[buyer][yourFriend] = false;
        userFriends[yourFriend][buyer] = false;
        uint k = userFriendAmount[yourFriend];
        userFriendAmount[yourFriend] = userFriendAmount[yourFriend]-1;
        uint price = ethDecimal*k*k/DIV_NUM;
        uint total_share = user_percent + platform_percent;
        //卖出share所得的金额需要扣除手续费.注意,如果中途修改了比例,则手续费可能多扣.导致最后的退出者资金不足.
        uint total_fee = price * total_share / 10000;
        uint sell_price = price - total_fee;
        buyer.transfer(sell_price);
        emit SellShareEvent(buyer, yourFriend, sell_price);
    }

    //查询用户的price
    function sharePrice(address friend)view public returns(uint256){
        uint256 k = userFriendAmount[friend]+1;
        uint price = ethDecimal*k*k/DIV_NUM;
        return price;
    }


    function initialize(address payable _plateform_address) public initializer {
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
        platform_percent = _platformPercent;
    }
}
