const path = require('path');
const fs = require('fs');
const solc = require('solc');

const contractPath = path.resolve(__dirname, 'contract', 'Wallet.sol');
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
    language: 'Solidity',
    sources: {
        'Wallet.sol': {
        content: source,
        },
    },
    settings: {
        outputSelection: {
        '*': {
            '*': ['*'],
        },
        },
    },
};

// console.log(JSON.parse(solc.compile(JSON.stringify(input))));
module.exports = JSON.parse(solc.compile(JSON.stringify(input))).contracts[
    'Wallet.sol'
].Wallet;
