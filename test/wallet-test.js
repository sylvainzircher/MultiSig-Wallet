const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const { abi, evm } = require('../compile');

let wallet;
let accounts;
const argumentNbOfApprovers = 2;
let ownersAddress = [];

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    ownersAddress = [accounts[0], accounts[1], accounts[2]]
    
    wallet = await new web3.eth.Contract(abi)
    .deploy({ data: evm.bytecode.object, arguments: [argumentNbOfApprovers, ownersAddress] })
    .send({ from: accounts[0], gas: '3000000' });
    
    await wallet.methods.transferRequest(accounts[3], web3.utils.toWei('1', 'ether')).send({
        from: accounts[1],
        gas: '3000000',
    });
});
describe('Wallet Contract', () => {
    it('deploys a contract', () => {
        assert.ok(wallet.options.address);
    });
    it('has the right amount of approvers', async () => {
        const approvers = await wallet.methods.nbApprovers().call({
            from: accounts[0],
        });
        assert.equal(argumentNbOfApprovers, approvers);
    });
    it('has the right number of owners', async () => {
        const owners = await wallet.methods.getOwnersList().call({
            from: accounts[0],
        });
        assert.equal(ownersAddress.length, owners.length);   
    });
});
describe('Transfer Request', () => {
    it('makes sure that a non owner can not create a request', async () => {
        try {
            await wallet.methods.transferRequest(accounts[3], web3.utils.toWei('10', 'wei')).send({
                from: accounts[3],
                gas: '3000000',
            });
            assert(false);
        } catch(err) {
            assert(err);
        }
    });
    it('makes sure that an owner can create a request', async () => {
        try {
            await wallet.methods.transferRequest(accounts[3], web3.utils.toWei('10', 'wei')).send({
                from: accounts[1],
                gas: '3000000',
            });
            assert(true);
        } catch(err) {
            assert(false);
        }
    });
    it('makes sure that the request is added to the transfer request array', async () => {
        let transfers = await wallet.methods.getListOfTransfer().call({
            from: accounts[0],
        });
        assert(transfers.length > 0);
    });
});
describe('Approve Function', () => {
    it('does allow a non owner to approve a request', async() => {
        try {
            await wallet.methods.approveRequest(0).send({
                from: accounts[7],
                gas: '3000000',
            });
            assert(false)
        } catch(err) {
            assert(err);
        }
    });
    it('does allow an owner to approve a request', async() => {
        try {
            await wallet.methods.approveRequest(0).send({
                from: accounts[0],
                gas: '3000000',
            });
            assert(true)
        } catch(err) {
            assert(false);
        }
    });
    it('does not allow for an incorrect request id to be input', async() => {
        try {
            await wallet.methods.approveRequest(10).send({
                from: accounts[0],
                gas: '3000000',
            });
            assert(false)
        } catch(err) {
            assert(err);
        }
    });
    it('does not allow for an owner to approve several time the same request', async() => {
        await wallet.methods.approveRequest(0).send({
            from: accounts[0],
            gas: '3000000',
        });
        try {
            await wallet.methods.approveRequest(0).send({
                from: accounts[0],
                gas: '3000000',
            });
            assert(false)
        } catch(err) {
            assert(err);
        }
    }); 
    it('does not allow for a request to be fulfilled once approved if there is not enough funds', async() => {
        await wallet.methods.deposit().send({
            from: accounts[5],
            value: web3.utils.toWei('0.5', 'ether'),
        });
        await wallet.methods.approveRequest(0).send({
            from: accounts[0],
            gas: '3000000',
        });
        try {
            await wallet.methods.approveRequest(0).send({
                from: accounts[1],
                gas: '3000000',
            });
            assert(false);
        } catch(err) {
            assert(err);
        }
    });      
    it('allows for a request to be approved if enough owners approve & enough funds are available', async() => {
        await wallet.methods.deposit().send({
            from: accounts[5],
            value: web3.utils.toWei('1', 'ether'),
        });        
        await wallet.methods.approveRequest(0).send({
            from: accounts[0],
            gas: '3000000',
        });
        await wallet.methods.approveRequest(0).send({
            from: accounts[1],
            gas: '3000000',
        });
        let transfer = await wallet.methods.getListOfTransfer().call({
            from: accounts[0],
        });
        assert(transfer[0].approved);
    });        
});