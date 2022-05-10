# MultiSig-Wallet
Creation of a multi-signature wallet as part of a project for the Ethereum Smart Contract 101 course @ Moralis Academy

Code for a Multisig Wallet Smart Contract. A multisig wallet is a wallet where multiple “signatures” or approvals are needed for an outgoing transfer to take place. The wallet is configured in such a way that it requires several of its owners (set when the contract is deployed) to sign any transfer before it is valid. Anyone can deposit funds into this wallet but as soon as we want to spend funds, it requires several approvals.

The requirements of the smart contract wallet:

– Anyone should be able to deposit ether into the smart contract

– The contract creator should be able to input (1): the addresses of the owners and (2):  the numbers of approvals required for a transfer, in the constructor. For example, input 3 addresses and set the approval limit to 2. 

– Anyone of the owners should be able to create a transfer request. The creator of the transfer request will specify what amount and to what address the transfer will be made.

– Owners should be able to approve transfer requests.

– When a transfer request has the required approvals, the transfer should be sent. 
