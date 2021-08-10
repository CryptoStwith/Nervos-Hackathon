import Web3 from 'web3';
import * as SimpleAccumulatorJSON from '../../../build/contracts/SimpleAccumulator.json';
import { SimpleAccumulator } from '../../types/SimpleAccumulator';

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};

export class SimpleAccumulatorWrapper {
    web3: Web3;

    contract: SimpleAccumulator;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(SimpleAccumulatorJSON.abi as any) as any;
    }

    get isDeployed() {
        return Boolean(this.address);
    }

    async getStoredValue(fromAddress: string) {
        const data = await this.contract.methods.get().call({ from: fromAddress });

        return parseInt(data, 10);
    }

    async addValue(value: number, fromAddress: string) {
        const tx = await this.contract.methods.add(value).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress
        });

        return tx;
    }

    async deploy(fromAddress: string) {
        const contract = await (this.contract
            .deploy({
                data: SimpleAccumulatorJSON.bytecode,
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
