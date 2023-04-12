//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract ReaToken is ERC20Burnable {

    function isOwner() public view returns (bool) {

        return _msgSender() == _owner;

    }

    modifier onlyOwner() {

        require(isOwner(), "Ownable: caller is not the owner");

        _;

    }
    // mapping(address => bool) public isManager;
    // event SetManager(address manager, bool flag);
    address private _owner;

    constructor() ERC20("REA Token", "REA") {}
    
    // function initialize(string memory name, string memory symbol) public{
    //     address msgSender = _msgSender();
    //     _owner = msgSender;
    //     __ERC20_init(name, symbol);
    //     // setManager(_msgSender(),true);
    // }

    // function setManager(address manager, bool flag) public onlyOwner {
    //     isManager[manager] = flag;
    //     emit SetManager(manager, flag);
    // }
    

    // function getManager(address manager) public view returns (bool) {
    //     return isManager[manager];
    // }

    function mint(address _toAddress,uint256 _mintNum)public {
        _mint(_toAddress, _mintNum);
    }

    // function burn(uint256 _burnAmount) public onlyOwner {
    //     _burn(_msgSender(), _burnAmount);
    // }

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
