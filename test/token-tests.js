const Token = artifacts.require('./Token.sol');
const TokenCrowdSale = artifacts.require('./TokenCrowdSale.sol');
const fs = require("fs");
const path = require("path");
const tokenConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../token-config.json'), 'utf-8'));
const BigNumber = require("bignumber.js");

contract('Token check', function(accounts){
    //coin info
    const name = tokenConfig.tokenName;
    const decimals = tokenConfig.tokenDecimals;
    const totalSupply = tokenConfig.tokenTotalSupply;
    const symbol = tokenConfig.tokenSymbol;

    it('Check Initialization', function(){
        var tokenContract;
        var crowdSaleContract;

        return Token.deployed().then(function(instance){
            tokenContract = instance;

            return TokenCrowdSale.deployed();            
        }).then(function(instance){
            crowdSaleContract = instance;

            return tokenContract.decimals.call();
        }).then(function(contractDecimals){
            assert.strictEqual(contractDecimals.toNumber(), decimals, "Incorrect decimals");
            return tokenContract.name.call();
        }).then(function(contractName){
            assert.strictEqual(contractName, name, "Incorrect name");
            return tokenContract.symbol.call();
        }).then(function(contractSymbol){
            assert.strictEqual(contractSymbol, symbol, "Incorrect symbol");
            return tokenContract.totalSupply.call();
        }).then(function(contractTotalSupply){
            assert.strictEqual(contractTotalSupply.toNumber(), (new BigNumber(totalSupply).times(BigNumber(10).pow(BigNumber(18)))).toNumber(), "Incorrect total supply");

            return tokenContract.distributionAddress.call();
        }).then(function(distributionAddress){
            assert.strictEqual(distributionAddress, crowdSaleContract.address, "Incorrect distribution address");
        });
    });
});