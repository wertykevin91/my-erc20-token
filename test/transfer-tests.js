const Token = artifacts.require('./Token.sol');
const BigNumber = require('bignumber.js');

contract('Token check', (accounts)=>{

    it("Check transfers", ()=>{
        var tokenContract;
        const amountToTransfer = new BigNumber(500 * Math.pow(10, 18));
        
        return Token.deployed().then((instance)=>{
            tokenContract = instance;
            return tokenContract.enableTransfers();
        }).then(()=>{
            var initialBalance;

            tokenContract.balanceOf(accounts[0]).then((bb)=>{
                initialBalance = bb;
                return tokenContract.transfer(accounts[1], amountToTransfer.toString())
            }).then(()=>{
                return tokenContract.balanceOf(accounts[1]);
            }).then((bb)=>{
                assert.strictEqual(bb.toString(), amountToTransfer.toString(), "Invalid amount transferred.");
                return tokenContract.balanceOf(accounts[0]);
            }).then((bb)=>{
                assert.strictEqual(bb.toString(), initialBalance.minus(amountToTransfer).toString(), "Invalid amount remaining.");
            })
        });                
    });
});