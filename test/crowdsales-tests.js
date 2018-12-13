const Token = artifacts.require('./Token.sol');
const TokenCrowdSale = artifacts.require('./TokenCrowdSale.sol');

contract("TokenCrowdSale Tests", async(accounts) => {
    it('Check distribution address balance', async() => {
        let tokenContract = await Token.deployed();
        let crowdsaleContract = await TokenCrowdSale.deployed();
        
        // TODO: depends on how much you want to send
        let crowdsaleContractTokenInitial = 100000000 * Math.pow(10, 18);

        let distributionAddress = await tokenContract.distributionAddress.call();
        assert.strictEqual(distributionAddress, crowdsaleContract.address, "Invalid contract address");

        //console.log(tokenContract);
        await tokenContract.distributeTokens(crowdsaleContract.address, crowdsaleContractTokenInitial);
        
        // verify contract has tokens

        let crowdsaleContractBalance = await tokenContract.balanceOf.call(crowdsaleContract.address);
        //console.log(crowdsaleContractBalance.toNumber());
        assert.strictEqual(crowdsaleContractTokenInitial, crowdsaleContractBalance.toNumber(), "Invalid contract balance");
    });
    
    // buy tokens from contract

    it("Check whitelisting & purchase", async() =>{
        let tokenContract = await Token.deployed();
        let crowdsaleContract = await TokenCrowdSale.deployed();

        let whitelistError = false;

        try{
            await web3.eth.sendTransaction({
                "from": accounts[5], 
                "to": crowdsaleContract.address, 
                "value" : Math.pow(10, 18), 
                "gasPrice": 50000000000
            });

            // verify contract actually gave me some tokens

            let buyerBalance = await tokenContract.balanceOf.call(accounts[5]);
            assert.strictEqual(buyerBalance.toNumber() / Math.pow(10,18), 0, "Invalid buyer balance: has tokens");
        }catch(e){
            //console.log(e);
            whitelistError = e != null;
        }
        assert.strictEqual(whitelistError, true, "Non-whitelisted user not bounced.");

        // add account into whitelist
        await crowdsaleContract.addToWhiteList([accounts[5]], [Math.pow(10,18)]);

        // reset variable
        whitelistError = false;

        try{
            await web3.eth.sendTransaction({
                "from": accounts[5], 
                "to": crowdsaleContract.address, 
                "value" : Math.pow(10, 18), 
                "gasPrice": 50000000000,
                "gas": 6721975
            });

            // verify contract actually gave me some tokens

            // TODO: you need to calculate the token distribution amount per ether. Error is there because.. some of the decimals are too small. Reduce the error number to increase precision
            var error = 0.1
            var tokens = 180;

            let buyerBalance = await tokenContract.balanceOf.call(accounts[5]);
            assert.isAtLeast(buyerBalance.toNumber() / Math.pow(10, 18), tokens - error, "Invalid buyer balance: too little tokens");
            assert.isAtMost(buyerBalance.toNumber() / Math.pow(10, 18), tokens + error, "Invalid buyer balance: too much tokens");
        }catch(e){
            console.log(e);
            whitelistError = e != null;
        }
        assert.strictEqual(whitelistError, false, "Whitelisted user is bounced for some reason.");
    });
});

