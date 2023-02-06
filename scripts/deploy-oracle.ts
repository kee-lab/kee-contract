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




    // start deploy Rea token
    let factoryAbiFile = fs.readFileSync('./res/sunswap/factory/SunswapV2Factory.abi');
    let factoryBinFile = fs.readFileSync('./res/sunswap/factory/SunswapV2Factory.bin');
    let factoryAbi = factoryAbiFile.toString();
    let factoryCode = factoryBinFile.toString();
    // console.log("factoryCode is:", factoryCode);
    // async function deploy_factory_contract() {
    //     let contract_instance = await tronWeb.contract().new({
    //         abi: JSON.parse(factoryAbi),
    //         bytecode: factoryCode,
    //         feeLimit: 4_000_000_000,
    //         callValue: 0,
    //         userFeePercentage: 1,
    //         originEnergyLimit: 10_000_000,
    //         parameters:[walletAddress,]
    //     });
    //     console.log("contract_instance address is:",contract_instance.address);
    //     return contract_instance;
    // }
    // let contract_instance = await deploy_factory_contract();// Execute the function
    // async function attach_ticker_contract() {
    //     let contract_instance = await tronWeb.contract().at("TU67fYjLkaC786g1bYwXwFSsnnjdxcw1wG");
    //     let result = await contract_instance.createPair(REAInstance.address, usdtInstance.address).send({
    //         feeLimit: 4_000_000_000,
    //         callValue: 0,
    //         shouldPollResponse:true
    //     });
    //     console.log("result is:", result);
    // }
    
    // await attach_ticker_contract();


    let routerAbiFile = fs.readFileSync('./res/sunswap/router/SunswapV2Router02.abi');
    let routerBinFile = fs.readFileSync('./res/sunswap/router/SunswapV2Router02.bin');
    let routerAbi = routerAbiFile.toString();
    let routerCode = routerBinFile.toString();
    // console.log("routerAbi is:", routerAbi);
    // async function deploy_router_contract() {
    //     let contract_instance = await tronWeb.contract().new({
    //         abi: JSON.parse(routerAbi),
    //         bytecode: routerCode,
    //         feeLimit: 8_000_000_000,
    //         callValue: 0,
    //         userFeePercentage: 1,
    //         originEnergyLimit: 10_000_000,
    //         parameters:["TU67fYjLkaC786g1bYwXwFSsnnjdxcw1wG",REAInstance.address]
    //     });
    //     console.log("contract_instance address is:",contract_instance.address);
    //     return contract_instance;
    // }
    // let contract_instance = await deploy_router_contract();// Execute the function
    async function attach_router_contract() {
        let contract_instance = await tronWeb.contract().at("41c42214b69367d3100d0d1f811265a3b5ba93a5aa");
        // let result = await contract_instance.createPair(REAInstance.address, usdtInstance.address).send({
        //     feeLimit: 4_000_000_000,
        //     callValue: 0,
        //     shouldPollResponse:true
        // });
        console.log("result is:", contract_instance.address);
        return contract_instance;
    }
    let routerContract = await attach_router_contract();
    console.log("result is:", routerContract.address);
    console.log("---- deploy end");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
