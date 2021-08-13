/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';

import { SimpleCalculatorWrapper } from '../lib/contracts/SimpleCalculatorWrapper';

import { AddressTranslator } from 'nervos-godwoken-integration';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';

import * as CompiledContractArtifact from '../../build/contracts/ERC20.json';

import { CONFIG } from '../config';

async function createWeb3() {
    // Modern dapp browsers...
    if ((window as any).ethereum) {
        // const web3 = new Web3((window as any).ethereum);
        const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
        const providerConfig = {
            rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
            ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
            web3Url: godwokenRpcUrl
        };
        const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
        const web3 = new Web3(provider);

        try {
            // Request account access if needed
            await (window as any).ethereum.enable();
        } catch (error) {
            // User denied account access...
        }

        return web3;
    }

    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
}

export function App() {
    const [web3, setWeb3] = useState<Web3>(null);
    const [contract, setContract] = useState<SimpleCalculatorWrapper>();
    const [contractTxHash, setContractTxHash] = useState<string>();
    const [accounts, setAccounts] = useState<string[]>();
    const [pjAddress, setPJAddress] = useState<string>();
    const [depositAddress, setDepositAddress] = useState<string>();
    const [balance, setBalance] = useState<bigint>();
    const [sudtBalance, setSUDTBalance] = useState<bigint>();
    const [existingContractIdInputValue, setExistingContractIdInputValue] = useState<string>();
    const [storedValue, setStoredValue] = useState<number | undefined>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);
    const [addStoredNumberInputValue, setAddStoredNumberInputValue] = useState<
        number | undefined
    >();
    const [subStoredNumberInputValue, setSubStoredNumberInputValue] = useState<
        number | undefined
    >();

    useEffect(() => {
        if (transactionInProgress && !toastId.current) {
            toastId.current = toast.info(
                'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
                {
                    position: 'top-right',
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    closeButton: false
                }
            );
        } else if (!transactionInProgress && toastId.current) {
            toast.dismiss(toastId.current);
            toastId.current = null;
        }
    }, [transactionInProgress, toastId.current]);

    const account = accounts?.[0];

    async function deployContract() {
        const _contract = new SimpleCalculatorWrapper(web3);

        try {
            setTransactionInProgress(true);

            const deployTxHash = await _contract.deploy(account);
            setContractTxHash(deployTxHash);

            setExistingContractAddress(_contract.address);
            toast(
                'Successfully deployed a smart-contract. You can now proceed to get or set the value in a smart contract.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast('There was an error sending your transaction. Please check developer console.');
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function getStoredValue() {
        const value = await contract.getStoredValue(account);
        toast('Successfully read latest stored value.', { type: 'success' });

        setStoredValue(value);
    }

    async function setExistingContractAddress(contractAddress: string) {
        const _contract = new SimpleCalculatorWrapper(web3);
        _contract.useDeployed(contractAddress.trim());

        setContract(_contract);
        setStoredValue(undefined);
    }

    async function addValue() {
        try {
            setTransactionInProgress(true);
            await contract.addValue(addStoredNumberInputValue, account);
            toast(
                'Successfully add latest stored value. You can refresh the read value now manually.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast('There was an error sending your transaction. Please check developer console.');
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function subValue() {
        try {
            setTransactionInProgress(true);
            await contract.subValue(subStoredNumberInputValue, account);
            toast(
                'Successfully sub latest stored value. You can refresh the read value now manually.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast('There was an error sending your transaction. Please check developer console.');
        } finally {
            setTransactionInProgress(false);
        }
    }

    useEffect(() => {
        if (web3) {
            return;
        }

        (async () => {
            const _web3 = await createWeb3();
            setWeb3(_web3);

            const _accounts = [(window as any).ethereum.selectedAddress];
            setAccounts(_accounts);
            console.log({ _accounts });

            const addressTranslator = new AddressTranslator();
            const polyjuiceAddress = addressTranslator.ethAddressToGodwokenShortAddress(
                _accounts[0]
            );
            setPJAddress(polyjuiceAddress);
            console.log('polyjuiceAddress', polyjuiceAddress);

            const _depositAddress = await addressTranslator.getLayer2DepositAddress(
                _web3,
                _accounts[0]
            );
            console.log(`Layer 2 Deposit Address on Layer 1: \n${_depositAddress.addressString}`);
            setDepositAddress(_depositAddress.addressString);

            const queryBalance = async () => {
                if (_accounts && _accounts[0]) {
                    const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
                    setBalance(_l2Balance);
                }

                const _contract = new _web3.eth.Contract(
                    CompiledContractArtifact.abi as AbiItem[],
                    '0x98d8EcD3C6FA5a071E3059556F86A79659352BC1'
                );
                const _sudtBalance = await _contract.methods.balanceOf(polyjuiceAddress).call({
                    from: _accounts[0]
                });
                console.log('_sudtBalance', _sudtBalance);
                setSUDTBalance(_sudtBalance);
                setTimeout(queryBalance, 10000);
            };

            queryBalance();
        })();
    });

    const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

    return (
        <div>
            Your ETH address: <b>{accounts?.[0]}</b>
            <br />
            PolyJuice address: <b>{pjAddress}</b>
            <br />
            <br />
            Deposit Address: <b>{depositAddress}</b>
            <br />
            You can go to{' '}
            <a
                href="https://force-bridge-test.ckbapp.dev/bridge/Ethereum/Nervos?xchain-asset=0x0000000000000000000000000000000000000000
"
            >
                Force Brige
            </a>{' '}
            , and transfer ETH to this address in Layer2.
            <br />
            <br />
            Balance: <b>{balance ? (balance / 10n ** 8n).toString() : <LoadingIndicator />} ETH</b>
            <br />
            <br />
            SUDT Balance: <b>{sudtBalance ? sudtBalance.toString() : <LoadingIndicator />} SUDT</b>
            <br />
            <br />
            Deployed contract address: <b>{contract?.address || '-'}</b> <br />
            <br />
            Deployed contract tx hash: <b>{contractTxHash || '-'}</b> <br />
            <br />
            <hr />
            <p>
                The button below will deploy a SimpleCalculator smart contract where you can add or
                sub number to the stored value . By default the initial stored value is equal to 123
                (you can change that in the Solidity smart contract). After the contract is deployed
                you can either read stored value from smart contract or add value to the stored
                value. You can do that using the interface below.
            </p>
            <button onClick={deployContract} disabled={!balance}>
                Deploy contract
            </button>
            &nbsp;or&nbsp;
            <input
                placeholder="Existing contract id"
                onChange={e => setExistingContractIdInputValue(e.target.value)}
            />
            <button
                disabled={!existingContractIdInputValue || !balance}
                onClick={() => setExistingContractAddress(existingContractIdInputValue)}
            >
                Use existing contract
            </button>
            <br />
            <br />
            <button onClick={getStoredValue} disabled={!contract}>
                Get stored value
            </button>
            {storedValue ? <>&nbsp;&nbsp;Stored value: {storedValue.toString()}</> : null}
            <br />
            <br />
            <input
                type="number"
                onChange={e => setAddStoredNumberInputValue(parseInt(e.target.value, 10))}
            />
            <button onClick={addValue} disabled={!contract}>
                Add to stored value
            </button>
            <br />
            <br />
            <input
                type="number"
                onChange={e => setSubStoredNumberInputValue(parseInt(e.target.value, 10))}
            />
            <button onClick={subValue} disabled={!contract}>
                Sub to stored value
            </button>
            <br />
            <br />
            <br />
            <hr />
            <ToastContainer />
        </div>
    );
}
