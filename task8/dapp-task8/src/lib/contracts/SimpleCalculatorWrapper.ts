import Web3 from 'web3';
import * as SimpleCalculatorJSON from '../../../build/contracts/SimpleCalculator.json';
import { SimpleCalculator } from '../../types/SimpleCalculator';

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};

export class SimpleCalculatorWrapper {
    web3: Web3;

    contract: SimpleCalculator;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(SimpleCalculatorJSON.abi as any) as any;
    }

    get isDeployed() {
        return Boolean(this.address);
    }

    async getStoredValue(fromAddress: string) {
        const data = await this.contract.methods.getResult().call({ from: fromAddress });

        return parseInt(data, 10);
    }

    async addValue(value: number, fromAddress: string) {
        const tx = await this.contract.methods.add(value).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress
        });

        return tx;
    }

    async subValue(value: number, fromAddress: string) {
        const tx = await this.contract.methods.sub(value).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress
        });

        return tx;
    }

    async deploy(fromAddress: string) {
        const contract = await (this.contract
            .deploy({
                data: SimpleCalculatorJSON.bytecode,
                arguments: []
            })
            .send({
                ...DEFAULT_SEND_OPTIONS,
                from: fromAddress,
                to: '0x0000000000000000000000000000000000000000'
            } as any) as any);

        // this.useDeployed(contract._address);
        console.log('contract', contract.transactionHash);

        this.useDeployed(contract.contractAddress);

        return contract.transactionHash;
    }

    useDeployed(contractAddress: string) {
        this.address = contractAddress;
        this.contract.options.address = contractAddress;
    }
}
