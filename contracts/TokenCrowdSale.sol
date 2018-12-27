// solium-disable linebreak-style
pragma solidity ^0.5.0;

import "./Token.sol";
import "./SafeMath.sol";


contract OwnedByICOOwner {
    address public owner;

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    // allow transfer of ownership to another address in case shit hits the fan. 
    function transferOwnership(address newOwner) public onlyOwner {
        owner = newOwner;
    }
}

contract TokenCrowdSale is OwnedByICOOwner {
    // all values dealt with in wei, unless explicitly specified.
    // Note: Contract to be loaded with the allocated tokens prior to pre/public sales

    struct AllowedAddress {
        uint256 allowedAmount;      // amount allocated to contributor
        uint256 remainder;          // amount contributable left
        bool check;                 // a check flag
    }

    // ====     start and end dates     ==== //
    uint256 public startDate;               // Start date - to be determined
    uint256 public endDate;                 // End date - to be determined

    // ==== address of Token ==== //
    Token public token;

    // ==== funds will be transferred to this address ==== //
    address payable public coldStorage;

    // // ==== maximum contribution per address ==== //
    // uint public constant MAX_CONTRIBUTION = xx ether;

    // ==== mappings (e.g. balance, whitelist checks) ==== //
    mapping(address => uint256) public balanceOf;
    mapping (address => AllowedAddress) public whiteList;

    // ==== hardcap of ICO ==== //
    uint256 public hardCap;             // hardcap value in ether
    bool public isHalted;               // is the crowdsale halted
    uint256 public totalCollection;     // total collected by the crowdsale
    

    using SafeMath for uint256;

    constructor(address _Token, address _contributionColdStorage,
                                uint256 _hardCap,
                                uint256 _startDate, uint256 _endDate) public {
        token = Token(_Token);             // initialising reference to ERC20
        coldStorage = address(uint160(_contributionColdStorage));  // cold wallet meant for contribution holding
        startDate = _startDate;                  // ICO start date in UNIX time
        endDate = _endDate;                      // ICO end date in UNIX time
        owner = msg.sender;                      // Set contract ownership
        hardCap = _hardCap * 10 ** 18;           // hardcap in wei
    }

    event RevertLog(string message);

    function() external payable {
        uint256 a;       
        // crowdsale checks
        // accept only contributions > 0.1ETH
        require(msg.value >= 0.1 ether, "Insufficient Ether");
        // limit to gas price at 50 gwei.
        require(tx.gasprice <= 50000000000 wei, "Gas price too high");
        // requires crowdsale not closed
        require(isCrowdSaleOngoing(), "Crowdsale ended");
        //has to not be halted
        require(!isHalted, "Crowdsale halted");
        // Now check if individual is allowed to contribute
        require(whiteList[msg.sender].check, "Not in whitelist");
        // and if this address still has any remainder allocation
        require(whiteList[msg.sender].remainder > 0, "No more allocation");


        // set remainder amount to variable
        uint256 remainder = whiteList[msg.sender].remainder;
        // get amount sent
        uint256 payAmt = msg.value;

        if (payAmt <= remainder && payAmt.add(totalCollection) <= hardCap) {
            // deduct payAmt off remainder
            a = (remainder.sub(payAmt));
            // update remainder to whitelist
            whiteList[msg.sender].remainder = a;
            // update total collection from the received amount
            totalCollection = totalCollection.add(payAmt);
            // send tokens (payAmt * multiplier)
            token.distributeTokens(msg.sender, calculateBonuses(payAmt));
            // send ethers to cold storage
            coldStorage.transfer(payAmt);
        } else {
            // first check allocation
            if (payAmt > remainder) {
                // amount sent more than allocation (or remainder allocation)
                // give contributor what is left of the tokens allocated, send back extra ethers.
                // "a" variable denotes ethers to send back
                a = (payAmt.sub(remainder));
                payAmt = remainder;
            }

            // during last transaction - if allowed contribution more than tokens available
            if (payAmt.add(totalCollection) > hardCap) {
                // First reset payAmt to msg.value. This is needed if payAmt > remainder as it was altered.
                payAmt = msg.value;
                // refund amount = payAmt + totalCollection - hard cap.
                a = payAmt.add(totalCollection).sub(hardCap);
                // allocation = hardCap - totalCollection
                payAmt = hardCap.sub(totalCollection);  
            }

            // minus payAmt off remainder
            whiteList[msg.sender].remainder = whiteList[msg.sender].remainder.sub(payAmt);
            // add contribution amount to total collected
            totalCollection = totalCollection.add(payAmt);
            //send tokens
            token.distributeTokens(msg.sender, calculateBonuses(payAmt));
            // send ethers to cold storage
            coldStorage.transfer(payAmt);
            // return the rest of the ethers as denoted in "a"
            msg.sender.transfer(a);
        }
    }


    function addToWhiteList(address[] calldata _contributor, uint256[] calldata _amount) external onlyOwner {
        require(_contributor.length < 255);
        for (uint8 i = 0; i < _contributor.length; i++) {
            address tmpAddress = _contributor[i];
            uint256 tmpValue = _amount[i];

            whiteList[tmpAddress].allowedAmount = tmpValue;
            whiteList[tmpAddress].remainder = tmpValue;
            whiteList[tmpAddress].check = true;
        }
    }


    function removeFromWhiteList(address contributor) public onlyOwner {
        whiteList[contributor].check = false;
    }

    function calculateBonuses(uint256 amount) internal view returns (uint256 total) {
        // TODO: add your bonus structure here
        // this is for public sales
        // 0.50 $/Token, 90 $/ETH, 0.005555... ETH/Token
        uint256 x = amount * 10 ** 18;
        return x.div((5555555555555556));
    }

    /**
     * Halts token sales - Only callable by owner
     * Ideally never used.
     */
    function haltTokenSales(bool _status) public onlyOwner {
        isHalted = _status;
    }

    /**
     * Notifies ERC20 contract for tokens to be burnt
     */
    function burnTokens() public onlyOwner {
        token.burnSent(token.balanceOf(address(this)));
    }

    /**
     * Internal check to see if crowdsale is still ongoing.
     * Defaults to return false unless within crowdsale timeframe.
     */
    function isCrowdSaleOngoing() internal view returns (bool ongoing) {
        require(now >= startDate && now <= endDate);
        require(totalCollection < hardCap);
        return true;
    }

    /**
     * Withdraws token from smart contract.
     */
    function withdrawTokens(uint256 amount) public onlyOwner {
        token.distributeTokens(owner, amount);
    }

    /**
     * If someone sends some ERC20 tokens, we could withdraw and return them
     * Full credits to KyberNetwork.
     */
    function emergencyERC20Drain(ERC20 _token, uint256 amount) public onlyOwner {
        _token.transfer(owner, amount);
    }
}