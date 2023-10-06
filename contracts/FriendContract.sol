//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./TickerContract.sol";

contract FriendContract is OwnableUpgradeable {
    uint public DIV_NUM = 10000;

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
        userFriendAmount[seller] = userFriendAmount[seller] + 1;
        address buyer = msg.sender;
        userFriends[seller][buyer] = true;
        userShares[buyer][seller] = true;

        //emit a event.
        emit BuyUserEvent(buyer,seller,price);

        // TODO 分配5%的金额给seller,5%的费用给平台.
    }

    // TODO 用户卖出当前share
    function sellShare(address yourFriend)public{
        
    }

    //查询用户的price
    function buyPrice(address seller)view public returns(uint256){
        uint256 k = userFriendAmount[seller];
        uint price = k*k/DIV_NUM;
        return price;
    }


    function initialize() public initializer {
        isManager[msg.sender] = true;
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

}
