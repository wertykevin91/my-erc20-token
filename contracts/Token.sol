// solium-disable linebreak-style
pragma solidity ^0.5.0;

import "./SafeMath.sol";

contract ERC20 {
    function totalSupply() public view returns (uint256);
    function balanceOf(address) public view returns (uint256);
    function transfer(address, uint256) public returns (bool);
    function transferFrom(address, address, uint256) public returns (bool);
    function approve(address, uint256) public returns (bool);
    function allowance(address, address) public view returns (uint256);

    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
}


contract Owned {
    address public owner;

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    // allow transfer of ownership to another address in case shit hits the fan. 
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0));
        owner = newOwner;
    }
}

contract StandardToken is ERC20 {
    using SafeMath for uint256;

    mapping (address => uint256) internal balances;
    mapping (address => mapping (address => uint256)) internal allowed;

    
    function transfer(address _to, uint256 _value) public returns (bool) {
        require(_to != address(0));
        require(_value <= balances[msg.sender]);
        
        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        require(_to != address(0));
        require(_value <= balances[_from]);
        require(_value <= allowed[_from][msg.sender]);

        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
        emit Transfer(_from, _to, _value);
        return true;
    }

    function balanceOf(address _owner) public view returns (uint256 balance) {
        return balances[_owner];
    }
    
    function approve(address _spender, uint256 _value) public returns (bool success) {
        // Added to prevent potential race attack.
        // forces caller of this function to ensure address allowance is already 0
        // ref: https://github.com/ethereum/EIPs/issues/738
        require((_value == 0) || (allowed[msg.sender][_spender] == 0));
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) public view returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }
    
    /**
    * approve should be called when allowed[_spender] == 0. To increment
    * allowed value is better to use this function to avoid 2 calls (and wait until
    * the first transaction is mined)
    * From MonolithDAO Token.sol
    */
    function increaseApproval(address _spender, uint _addedValue) public returns (bool) {
        allowed[msg.sender][_spender] = allowed[msg.sender][_spender].add(_addedValue);
        emit Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
        return true;
    }

    function decreaseApproval(address _spender, uint _subtractedValue) public returns (bool) {
        uint oldValue = allowed[msg.sender][_spender];
        if (_subtractedValue > oldValue) {
            allowed[msg.sender][_spender] = 0;
        } else {
            allowed[msg.sender][_spender] = oldValue.sub(_subtractedValue);
        }
        emit Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
        return true;
    }
}

//token contract
contract Token is Owned, StandardToken {
    
    event Burn(address indexed burner, uint256 value);
    
    /* Public variables of the token */
    string public name;                   
    uint8 public decimals;                
    string public symbol;                 
    uint256 public totalSupply_;
    address public distributionAddress;
    bool public isTransferable = false;
    

    constructor(string memory _name, uint8 _decimals, string memory _symbol, uint256 _totalSupply) public {
        name = _name;                          
        decimals = _decimals; 
        symbol = _symbol;
        totalSupply_ = _totalSupply * 10 ** uint256(decimals); 
        owner = msg.sender;

        //transfer all to handler address
        balances[msg.sender] = totalSupply_;
        emit Transfer(address(0), msg.sender, totalSupply_);
    }

    function transfer(address _to, uint256 _value) public returns (bool) {
        require(isTransferable);
        return super.transfer(_to, _value);
    } 

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        require(isTransferable);
        return super.transferFrom(_from, _to, _value);
    } 

    /**
     * Get totalSupply of tokens - Minus any from address 0 if that was used as a burnt method
     * Suggested way is still to use the burnSent function
     */    
    function totalSupply() public view returns (uint256) {
        return totalSupply_;
    }

    /**
     * unlocks tokens, only allowed once
     */
    function enableTransfers() public onlyOwner {
        isTransferable = true;
    }
    
    /**
     * Callable by anyone
     * Accepts an input of the number of tokens to be burnt held by the sender.
     */
    function burnSent(uint256 _value) public {
        require(_value > 0);
        require(_value <= balances[msg.sender]);

        address burner = msg.sender;
        balances[burner] = balances[burner].sub(_value);
        totalSupply_ = totalSupply_.sub(_value);
        emit Burn(burner, _value);
    }

    
    /**
    * Allow distribution helper to help with distributeToken function
    * Here we should update the distributionAddress with the crowdsale contract address upon deployment
    * Allows for added flexibility in terms of scheduling, token allocation, etc.
    */
    function setDistributionAddress(address _setAddress) public onlyOwner {
        distributionAddress = _setAddress;
    }

    /**
     * Called by owner to transfer tokens - Managing manual distribution.
     * Also allow distribution contract to call for this function
     */
    function distributeTokens(address _to, uint256 _value) public {
        require(distributionAddress == msg.sender || owner == msg.sender);
        super.transfer(_to, _value);
    }
}
