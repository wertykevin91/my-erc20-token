const Token = artifacts.require('./Token.sol');
const TokenTimelock = artifacts.require('./TokenTimelock.sol');

const fs = require("fs");
const path = require("path");
const tokenConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../token-config.json'), 'utf-8'));
const BigNumber = require('bignumber.js');

contract('Token Timelock tests', async(accounts, b, c) => {

    it('Test transfer to timelock', async()=> {
        let tokenContract = await Token.deployed();
        let timelockContract = await TokenTimelock.deployed();
        let timelockBalance = await tokenContract.balanceOf(timelockContract.address);

        const tokenToLock = 200 * Math.pow(10, 18);

        // Enable transfers

        await tokenContract.enableTransfers();

        // Prepare timelock contract

        await tokenContract.transfer(timelockContract.address, tokenToLock);
        let ntimelockBalance = await tokenContract.balanceOf(timelockContract.address);
        assert.strictEqual(ntimelockBalance.toNumber(), tokenToLock + timelockBalance.toNumber());
    });

    it('Test timelock contract', async()=> {
        let tokenContract = await Token.deployed();
        let timelockContract = await TokenTimelock.deployed();
        let timelockBalance = await tokenContract.balanceOf(timelockContract.address);

        const totalSupply = tokenConfig.tokenTotalSupply;
        const tokenToLock = 200 * Math.pow(10, 18);

        const today = Math.round(Date.now() / 1000);

        const minutes1 = today + (1 * 60);

        var hasError = false;

        await tokenContract.transfer(timelockContract.address, tokenToLock);
        try{
            await timelockContract.release();
        }catch(e){
            hasError = true;
        }
        assert.strictEqual(hasError, true, "No error even though not release time.");

        let ntimelockBalance = await tokenContract.balanceOf(timelockContract.address);
        assert.strictEqual(ntimelockBalance.toNumber(), tokenToLock + timelockBalance.toNumber());

        // only applicable for local testnet
        // RPC call to move timestamp forward
        
        if(web3.currentProvider.host.indexOf("localhost") !== -1 || web3.currentProvider.host.indexOf("127.0.0.1") !== -1){
            var rpcCall = await web3.currentProvider.send({
                jsonrpc: "2.0", 
                method: "evm_increaseTime", 
                params: [minutes1 + 1], id: 0
            });
            //console.log(rpcCall);
    
            hasError = false;
            try{
                await timelockContract.release();
            }catch(e){
                hasError = true;
            }
            assert.strictEqual(hasError, false, "Error even though release time.");
            
            ntimelockBalance = await tokenContract.balanceOf(timelockContract.address);
            assert.strictEqual(ntimelockBalance.toNumber(), 0, "Balance not invalid.");
    
            let ownerBalance = await tokenContract.balanceOf(accounts[0]);
            assert.strictEqual(ownerBalance.toNumber(), (new BigNumber(totalSupply).times(BigNumber(10).pow(BigNumber(18)))).toNumber(), "Owner balance invalid.");
        }
    });
});