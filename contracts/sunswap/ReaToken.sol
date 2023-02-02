//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract ReaToken is ERC20Upgradeable, OwnableUpgradeable {
    mapping(address => bool) public isManager;
    event SetManager(address manager, bool flag);
    function initialize(string memory name, string memory symbol) public initializer {
        __Ownable_init();
        __ERC20_init(name, symbol);
        setManager(_msgSender(),true);
    }

    function setManager(address manager, bool flag) public onlyOwner {
        isManager[manager] = flag;
        emit SetManager(manager, flag);
    }
    

    function getManager(address manager) public view returns (bool) {
        return isManager[manager];
    }

    function mint(address _toAddress,uint256 _mintNum) public onlyOwner {
        _mint(_toAddress, _mintNum);
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    // function setLabsAddress(address _labsAddress) public onlyOwner {
    //     _setLabsAddress(_labsAddress);
    // }

    // function setLiquidityAddress(address _liquidityAddress) public onlyOwner {
    //     _setLiquidityAddress(_liquidityAddress);
    // }

    // function setTokenDecimals(uint256 _tokenDecimals) public onlyOwner {
    //     _setTokenDecimals(_tokenDecimals);
    // }

    // function setFromWhiteListAddress(address account,bool value) public onlyOwner {
    //     _setFromWhiteListAddress(account,value);
    // }

    // function setToWhiteListAddress(address account,bool value) public onlyOwner {
    //     _setToWhiteListAddress(account,value);
    // }

}
