const BigNumber = require("bignumber.js");
const Token = artifacts.require('./Token.sol');

contract('Token check', function(accounts){
    it("Check basic functions", function(){
        // Burn

        var tokenContract;
        var startingTotalSupply;
        const burnAmount =  (new BigNumber(500)).times((new BigNumber(10).pow(new BigNumber(18))));
        
        return Token.deployed().then((instance)=>{
            tokenContract = instance;
            return tokenContract.totalSupply.call();
        }).then((totalSupply)=>{
            startingTotalSupply = (new BigNumber(totalSupply)); 
            // token does not need to be transferrable to be burnable
            return tokenContract.burnSent(web3.utils.toBN(burnAmount));
        }).then(()=>{
            return tokenContract.totalSupply.call();
        }).then((totalSupply)=>{
            assert.strictEqual((new BigNumber(totalSupply)).toNumber(), startingTotalSupply.minus(burnAmount).toNumber(), "Invalid total supply after burning.")
        });
    });
});