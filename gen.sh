solc --bin --abi --include-path node_modules/ --base-path . -o res ./contracts/TickerContract.sol


solc --bin --abi --include-path node_modules/ --base-path . -o res/sunswap/factory ./contracts/sunswap/SunswapV2Factory.sol

solc --bin --abi --include-path node_modules/ --base-path . -o res/sunswap/router ./contracts/sunswap/SunswapV2Router02.sol

solc --bin --abi --include-path node_modules/ --base-path . -o res/sunswap/oracle ./contracts/examples/ExampleOracleSimple.sol