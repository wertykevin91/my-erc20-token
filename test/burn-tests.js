const Token = artifacts.require('./Token.sol');

contract('Token check', function(accounts){
    it("Check basic functions", function(){
        // Burn

        var tokenContract;
        var startingTotalSupply;
        const burnAmount = 500 * Math.pow(10, 18);
        
        return Token.deployed().then((instance)=>{
            tokenContract = instance;
            return tokenContract.totalSupply();
        }).then((totalSupply)=>{
            startingTotalSupply = totalSupply.toNumber(); 
            // token does not need to be transferrable to be burnable
            return tokenContract.burnSent(burnAmount);
        }).then(()=>{
            return tokenContract.totalSupply();
        }).then((totalSupply)=>{
            assert.strictEqual(totalSupply.toNumber(), startingTotalSupply - burnAmount, "Invalid total supply after burning.")
        });
    });
});