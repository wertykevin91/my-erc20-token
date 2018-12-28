const Token = artifacts.require('./Token.sol');
const BigNumber = require('bignumber.js');

contract('Transfer check', (accounts)=>{

    it("Check transfers", ()=>{
        var tokenContract;
        const amountToTransfer = (new BigNumber(500)).times((new BigNumber(10).pow(new BigNumber(18))));
        
        return Token.deployed()
        .then((instance)=>{
            tokenContract = instance;
            return tokenContract.enableTransfers();
        }).then(()=>{
            var initialBalance;
            
            tokenContract.balanceOf(accounts[0]).then((bb)=>{
                initialBalance = new BigNumber(bb);
                return tokenContract.transfer(accounts[1], web3.utils.toBN(amountToTransfer));
            }).then(()=>{
                return tokenContract.balanceOf(accounts[1]);
            }).then((bb)=>{
                assert.strictEqual((new BigNumber(bb)).toString(), amountToTransfer.toString(), "Invalid amount transferred.");
                return tokenContract.balanceOf(accounts[0]);
            }).then((bb)=>{
                assert.strictEqual((new BigNumber(bb)).toString(), initialBalance.minus(amountToTransfer).toString(), "Invalid amount remaining.");
            })
        });                
    });
});