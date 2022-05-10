// SPDX-License-Identifier: MIT

pragma solidity >=0.7.5;
pragma abicoder v2;

contract Wallet {
    // We record the address of the owners in an array
    address[] public ownersAddresses;
    // This mapping will help in making sure that only the owners can call certain functions
    mapping(address => bool) ownerOnlyMapping;
    // This records the number of approvers needed for approving a transfer
    uint256 public nbApprovers;
    // This is used to create a unique id for each transfer request
    uint256 public transferId;

    // A transfer includes several informations:
    //      an id to uniquely identify each transfer
    //      whether the transfer has been approved or not
    //      the number of owners who approved the transfer
    //      the amount (in wei) to be transfered
    //      the recipient of the transfer
    struct Transfer {
        uint256 id;
        bool approved;
        uint256 nbApprovals;
        uint256 amount;
        address payable recipient;
    }

    // All transfer will be saved in an array
    Transfer[] transfers;

    // This mapping will help us keep track of all approvals for each owners.
    // We want to make sure they can not approve the same transfer several times.
    mapping(address => mapping(uint256 => bool)) voteCheck;

    // We emit an event when a transfer request is created and when a transfer is approved
    event TransferApproved(uint256 _transferId);
    event TransferRequestCreated(
        uint256 _id,
        address _creator,
        address _recipient,
        uint256 _amount
    );

    // This modifier ensures that a function can only be run by the addresses in the owners list
    modifier ownerOnly() {
        require(
            ownerOnlyMapping[msg.sender] == true,
            "You have to be an owner to perform this operation"
        );
        _;
    }

    // This modifier makes sure that the transfer id provided is included in the list of transfer ids
    modifier correctRequestId(uint256 _id) {
        require(_id <= transferId, "Incorrect transfer id");
        _;
    }

    // The contract creator is able to input:
    //      the addresses of the owners and
    //      the numbers of approvals required for a transfer
    // For example, input 3 addresses and set the approval limit to 2.
    // It does also create the ownerOnlyMapping using the list of _ownersAddresses and set the transferId to 0.
    constructor(uint256 _nbApprovers, address[] memory _ownersAddresses) {
        nbApprovers = _nbApprovers;
        ownersAddresses = _ownersAddresses;
        for (uint256 i = 0; i < _ownersAddresses.length; i++) {
            ownerOnlyMapping[_ownersAddresses[i]] = true;
        }
        transferId = 0;
    }

    // Two inputs needed: amount of the transfer as well as the address of the recipient.
    // It can only be run by the owners.
    function transferRequest(address payable _recipient, uint256 _amount)
        public
        ownerOnly
    {
        // Adds the transfer requested to the transfers array
        transfers.push(Transfer(transferId, false, 0, _amount, _recipient));
        // Emit an event confirming that a transfer request was created
        emit TransferRequestCreated(
            transferId,
            msg.sender,
            _recipient,
            _amount
        );
        // Increment the id by 1 to make sure each transfer request has a unique id
        transferId += 1;
    }

    // One input needed: the id of the request.
    // Returns a Transfer struct.
    // It can only be run by the owners.
    // The request id provided must be correct.
    function approveRequest(uint256 _requestId)
        public
        ownerOnly
        correctRequestId(_requestId)
        returns (Transfer memory)
    {
        // Makes sure that the request has not been already approved.
        // We want to ensure that one transfer can not be processed several times.
        require(
            voteCheck[msg.sender][_requestId] == false,
            "Has already approved"
        );
        // We track that the msg.sender has approved the request with and id of _requestId
        voteCheck[msg.sender][_requestId] = true;
        // We update the nunber of approval for that specific transfer
        transfers[_requestId].nbApprovals += 1;
        // If the number of approval is equal or higher than the requested number of approvers
        if (transfers[_requestId].nbApprovals >= nbApprovers) {
            // We make sure we have enough funds
            require(
                transfers[_requestId].amount <= address(this).balance,
                "Not enough Balance"
            );
            // Then we update the approved status of the transfer first,
            transfers[_requestId].approved = true;
            // before transferring the amount to the recipient:
            // to avoid potential re-entrancy issue.
            transfers[_requestId].recipient.transfer(
                transfers[_requestId].amount
            );
            // Emit an event confirming that a transfer has been approved
            emit TransferApproved(_requestId);
        }
        return transfers[_requestId];
    }

    // Function which returns the balance on the contract
    function getWalletBalance() public view returns (uint256) {
        return address(this).balance;
    }

    // Function which returns all the transfer requested
    function getListOfTransfer() public view returns (Transfer[] memory) {
        return transfers;
    }

    // Function which returns the list of owners
    function getOwnersList() public view returns (address[] memory) {
        return ownersAddresses;
    }

    // Empty function to make sure that funds can be deposited in the contract/wallet
    function deposit() public payable {}
}
