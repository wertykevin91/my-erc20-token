const tokenContract = artifacts.require('./Token.sol');
const safeMath = artifacts.require('./SafeMath.sol');
const crowdSalesContract = artifacts.require('./TokenCrowdSale.sol');
const tokenTimelockContract = artifacts.require('./TokenTimelock.sol');
const fs = require("fs");
const path = require("path");
const tokenConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../token-config.json'), 'utf-8'));

module.exports = function(deployer, network, accounts){
    //console.log(tokenConfig);
    var tokenInstance;

    const today = Math.round(Date.now() / 1000);
    const days30 = today + (30 * 24 * 60 * 60);
    const days365 = today + (365 * 24 * 60 * 60);
    
    const ethPriceUSD = tokenConfig.ethPriceUSD;
    const raiseAmount = tokenConfig.tokenRaiseAmountUSD;

    const raiseAmountEth = Math.round(raiseAmount / ethPriceUSD);

    deployer.deploy(safeMath);
    deployer.link(safeMath, tokenContract);

    deployer.deploy(tokenContract, 
        tokenConfig.tokenName, tokenConfig.tokenDecimals, tokenConfig.tokenSymbol, tokenConfig.tokenTotalSupply
    ).then(function(instance){
        tokenInstance = instance;
        return deployer.deploy(
            crowdSalesContract,
            tokenContract.address, 
            accounts[0], 
            raiseAmountEth, 
            today, days30);
    }).then(function(instance){
        crowdSalesInstance = instance;
        return tokenInstance.setDistributionAddress(crowdSalesContract.address, {"from": accounts[0]});
    }).then(function(){
        // deploy timelock
        return deployer.deploy(tokenTimelockContract, tokenContract.address, accounts[0], days365);
    });
}