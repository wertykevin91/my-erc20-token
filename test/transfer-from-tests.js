const Token = artifacts.require('./Token.sol');
const BigNumber = require('bignumber.js');

contract('Transfer from check', (accounts)=>{
    it("Check transfer froms", ()=>{
        var tokenContract;
        const amountToTransfer = new (new BigNumber(500)).times((new BigNumber(10).pow(new BigNumber(18))));
        const amountToAllow = new (new BigNumber(50)).times((new BigNumber(10).pow(new BigNumber(18))));
        
        return Token.deployed().then((instance)=>{
            tokenContract = instance;
            return tokenContract.enableTransfers();
        }).then(()=>{
            // here we gonna use acc 1, 2 and 3.
            // 1 host, 2 allowed, 3 receiver

            tokenContract.transfer(accounts[1], amountToTransfer.toString())
            .then(()=>{
                return tokenContract.balanceOf(accounts[1]);
            }).then((bb)=>{
                assert.strictEqual(bb.toString(), amountToTransfer.toString(), "Invalid amount transferred.");
                return tokenContract.approve(accounts[2], amountToAllow.toString(), {from: accounts[1]});
            }).then(()=>{
                return tokenContract.allowance(accounts[1], accounts[2]);
            }).then((bb)=>{
                assert.strictEqual(bb.toString(), amountToAllow.toString(), "Invalid amount allowed.");
                return tokenContract.transferFrom(accounts[1], accounts[3], amountToAllow.toString(), {from: accounts[2]});
            }).then(()=>{
                return tokenContract.balanceOf(accounts[3]);
            }).then((bb)=>{
                assert.strictEqual(bb.toString(), amountToAllow.toString(), "Invalid amount transferred from.");
                return tokenContract.balanceOf(accounts[1]);
            }).then((bb)=>{
                assert.strictEqual(bb.toString(), amountToTransfer.minus(amountToAllow).toString(), "Invalid amount remaining.");
                return tokenContract.allowance(accounts[1], accounts[2]);
            }).then((bb)=>{
                assert.strictEqual(bb.toString(), "0", "Invalid amount allowed.");
            });
        });                
    });
});