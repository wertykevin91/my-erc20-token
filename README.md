# my-erc20-token

## Description
A standard token template.
Edit token-config.json to set all the parameters.
Unfortunately, you will need to customize the crowdsale contract slightly based on your bonus structure/pricing structure in TokenCrowdSale.sol
By extension, you will need to edit the tests that pertains to the crowdsale contract.

## Requirement
You will need truffle & a eth rpc provider. My suggestion for eth rpc would be ganache to run an instance locally.
```
npm i --global truffle
```

[Ganache](https://truffleframework.com/ganache)
[Truffle](https://truffleframework.com/docs)

## IMPORTANT NOTICE
TokenCrowdSale.sol tokens disbursed varies based on your structure.
Crowdsale test follows.

These sections are marked TODO.