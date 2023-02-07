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
    console.log("---- deploy start");

    let signers = await ethers.getSigners();
    let wallet = signers[0];
    console.log("wallet:", wallet.address);


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
    let tickerAbiFile = fs.readFileSync('./res/TickerContract.abi');
    let tickerBinFile = fs.readFileSync('./res/TickerContract.bin');
    let tickerAbi = tickerAbiFile.toString();
    let tickerCode = tickerBinFile.toString();
    console.log("tickerAbi is:", tickerAbi);
    async function deploy_ticker_contract() {
        let contract_instance = await tronWeb.contract().new({
            abi: JSON.parse(tickerAbi),
            bytecode: tickerCode,
            feeLimit: 1_00_000_000,
            callValue: 0,
            userFeePercentage: 1,
            originEnergyLimit: 10_000_000,
            parameters:[]
        });
        console.log("contract_instance address is:",contract_instance.address);
        let result = await contract_instance.initialize(REAInstance.address, storeREAFeeWallet, claimWallet,).send({
            feeLimit: 1_000_000,
            callValue: 0
        });
        console.log("result is:", result);
    }
    async function attach_ticker_contract() {
        let contract_instance = await tronWeb.contract().at("TLQviAB2VkYzpuuZVo7yvXNtEggtCHnLmt");
        let result = await contract_instance.payToken().call();
        console.log("result is:", result);
    }
    await attach_ticker_contract();// Execute the function

    console.log("---- deploy end");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
