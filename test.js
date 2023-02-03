const fs = require("fs");
const solc = require('solc')
let Web3 = require('web3');
let web3;

if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    // set the provider you want from Web3.providers
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

//编译合约
//改用solc编译，需要先 npm install -g solc,如果无效，则采用：npm i -S solc
const input = fs.readFileSync('calc.sol');
console.log(input.toString());
const output = solc.compile({ sources: input.toString() }, 1);
var bytecode;
var abi;
console.log(output.contracts);
for (var contractName in output.contracts) {
    // code and ABI that are needed by web3
    bytecode = output.contracts[contractName].bytecode
    abi = JSON.parse(output.contracts[contractName].interface)
    console.log(contractName + ': ' + output.contracts[contractName].bytecode)
    console.log(contractName + '; json.parse:' + JSON.parse(output.contracts[contractName].interface))
    console.log('json.stringify:' + JSON.stringify(abi, undefined, 2));
    //可以把abi打印出来，看看智能合约的编译和本来的是不是相同
}

//获取合约实例
// const contract = new web3.eth.Contract(abi)

// //部署合约
// contract.deploy({
//     data: bytecode
// }).send({
//     from: '0x769666f17159b6b73f59b22ee6e5a0b67f163274',//这个地址就是我们刚刚在ganache-cli里生成的第一个节点的地址
//     gas: 4712388,
//     gasPrice: '10000000000000',
// })
//     .then((instance) => {
//         console.log(`Address: ${instance.options.address}`);
//     });