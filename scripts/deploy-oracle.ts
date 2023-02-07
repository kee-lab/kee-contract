import { BigNumberish } from "ethers";

const { ethers, upgrades } = require("hardhat");
const { BigNumber } = require("ethers");
const { BN } = require("@openzeppelin/test-helpers");
const TronWeb = require('tronweb');
const fs = require('fs');

const fullNode = 'https://nile.trongrid.io';
const solidityNode = 'https://nile.trongrid.io';
const eventServer = 'https://nile.trongrid.io';
const privateKey = 'd6c12ee57f6a0bbaeb823a4c34e61fe2d2da0557a392392b979ab46c97c2cc5f';
const walletAddress = "TEeeCkMA3gXekaKRPYMhhEwUkve6YBCTVy";
const productReaTokenAddress = "TH5ydFhBnLV4ZHF2bgBVaTBfX8LY17kj9W";
const productUsdtTokenAddress = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const usdtTokenAddress = "TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj";
const storeREAFeeWallet = "TF2dVw7ohgm8mcgb9kGShRfAQEJhvyMq2f";
const claimWallet = "TYqFGVcr8He5f97UTa6EtM698FSMxPYFad";
const factoryAddress = "TU67fYjLkaC786g1bYwXwFSsnnjdxcw1wG";
const pairAddress = "41ad36bc41c1ab88f8f919ec943b79921a460a9768"
const routerAddress = "TTrGGe8TLMENHFLmxxbC9g1bm9Tn1s1wqH";

async function withDecimals(amount: number) {
    return new BN(amount).mul(new BN(10).pow(new BN(18))).toString();
}

function expandTo18Decimals(n: number) {
    return BigNumber.from(n).mul(BigNumber.from(10).pow(18));
}

async function main() {
    console.log("---- deploy oracle start");

    let signers = await ethers.getSigners();
    let wallet = signers[0];
    console.log("wallet.address is:", wallet.address);


    let input = fs.readFileSync('./res/test/SmartERC20.abi');
    // console.log("input is: " + input.toString());



    const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);
    let usdtInstance = await tronWeb.contract().at("TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj");
    console.log("instance: ", usdtInstance.address);
    usdtInstance.loadAbi(JSON.parse(input.toString()));
    let symbol = await usdtInstance.symbol().call({ _isConstant: true })
    console.log("symbol is:" + symbol);

    let REAInstance = await tronWeb.contract().at("THGr2QTj5yChq3kvpmMADogKvvY9XxkXNR");
    console.log("instance: ", REAInstance.address);
    REAInstance.loadAbi(JSON.parse(input.toString()));
    symbol = await REAInstance.symbol().call({ _isConstant: true })
    console.log("symbol is:" + symbol);




    // // start deploy factory contract
    // let factoryAbiFile = fs.readFileSync('./res/sunswap/factory/SunswapV2Factory.abi');
    // let factoryBinFile = fs.readFileSync('./res/sunswap/factory/SunswapV2Factory.bin');
    // let factoryAbi = factoryAbiFile.toString();
    // let factoryCode = factoryBinFile.toString();
    // // console.log("factoryCode is:", factoryCode);
    // async function deploy_factory_contract() {
    //     let contract_instance = await tronWeb.contract().new({
    //         abi: JSON.parse(factoryAbi),
    //         bytecode: factoryCode,
    //         feeLimit: 4_000_000_000,
    //         callValue: 0,
    //         userFeePercentage: 1,
    //         originEnergyLimit: 10_000_000,
    //         parameters: [walletAddress,] // 主意此处的钱包地址一定要是base58格式的。否者在调用合约函数的时候会报错。
    //     });
    //     console.log("contract_instance address is:", contract_instance.address);
    //     let result = await contract_instance.createPair(REAInstance.address, usdtInstance.address).send({
    //         feeLimit: 4_000_000_000,
    //         callValue: 0,
    //         shouldPollResponse: true
    //     });
    //     console.log("result is:", result);
    //     return contract_instance;
    // }
    // let factoryInstance = await deploy_factory_contract();// Execute the function
    
    // // deploy router contract
    // let routerAbiFile = fs.readFileSync('./res/sunswap/router/SunswapV2Router02.abi');
    // let routerBinFile = fs.readFileSync('./res/sunswap/router/SunswapV2Router02.bin');
    // let routerAbi = routerAbiFile.toString();
    // let routerCode = routerBinFile.toString();
    // // console.log("routerAbi is:", routerAbi);
    // async function deploy_router_contract() {
    //     let contract_instance = await tronWeb.contract().new({
    //         abi: JSON.parse(routerAbi),
    //         bytecode: routerCode,
    //         feeLimit: 8_000_000_000,
    //         callValue: 0,
    //         userFeePercentage: 1,
    //         originEnergyLimit: 10_000_000,
    //         parameters: [factoryInstance.address, REAInstance.address]
    //     });
    //     console.log("contract_instance address is:", contract_instance.address);
    //     return contract_instance;
    // }
    // let routerContract = await deploy_router_contract();// Execute the function
    // console.log("result is:", routerContract.address);


    // deploy the oracle contract

    // let oracleAbiFile = fs.readFileSync('./res/sunswap/oracle/ExampleOracleSimple.abi');
    // let oracleBinFile = fs.readFileSync('./res/sunswap/oracle/ExampleOracleSimple.bin');
    // let oracleAbi = oracleAbiFile.toString();
    // let oracleCode = oracleBinFile.toString();
    // console.log("routerAbi is:", oracleAbi);
    // async function deploy_oracle_contract() {
    //     let contract_instance = await tronWeb.contract().new({
    //         abi: JSON.parse(oracleAbi),
    //         bytecode: oracleCode,
    //         feeLimit: 8_000_000_000,
    //         callValue: 0,
    //         userFeePercentage: 1,
    //         originEnergyLimit: 10_000_000,
    //         parameters: []
    //     });

    //     // factoryV2.address, reaToken.address, usdt.address, reaUsdtPairAddress, token0Amount
    //     let tokenAUsdtPrice = expandTo18Decimals(5);
    //     let result = await contract_instance.initialize(factoryAddress, REAInstance.address, usdtInstance.address, pairAddress, tokenAUsdtPrice).send({
    //         feeLimit: 4_000_000_000,
    //         callValue: 0,
    //         shouldPollResponse: true
    //     });
    //     console.log("contract_instance address is:", contract_instance.address);
    //     return contract_instance;
    // }
    // let oracle_instance = await deploy_oracle_contract();// Execute the function
    // console.log("result is:", oracle_instance.address);

    let contract_instance = await tronWeb.contract().at("TTrGGe8TLMENHFLmxxbC9g1bm9Tn1s1wqH");
        let result = await contract_instance.addLiquidity("41501edb7544671f25a694217282cc028a2596aafe", "41ea51342dabbb928ae1e576bd39eff8aaf070a8c6", 10, 10, 0,0,"TRH9v7XrBfD6oJ4pcVTSHsyWJ72cVofXGS",4398522400).send({
            feeLimit: 8_000_000_000,
            callValue: 0,
            shouldPollResponse: true
        });

    console.log("---- deploy end");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
