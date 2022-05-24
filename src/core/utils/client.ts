import { AptosClient, AptosAccount, Types } from 'aptos';

export const getCoinAddress = (resource: string): string | undefined => {
    const coinPart = /<.*>/g.exec(resource);
    if (coinPart) {
        const addressPart = /[0-9]x[a-z0-9A-Z]{1,}/g.exec(coinPart[0]);
        if (addressPart) {
            return addressPart[0];
        }
    }
    return undefined;
};

export const getCoinExactName = (resource: string | undefined): string | undefined => {
    if (resource) {
        const coinPart = /<.*>/g.exec(resource);
        if (coinPart) {
            return coinPart[0].replace('<', '').replace('>', '');
        }
    }
    return undefined;
};

export const executeTransactionWithPayload = async (
    client: AptosClient,
    accountFrom: AptosAccount,
    payload: Types.TransactionPayload,
): Promise<string> => {
    const txnRequest = await client.generateTransaction(
        accountFrom.address(),
        payload,
    );
    const signedTxn = await client.signTransaction(accountFrom, txnRequest);
    const res = await client.submitTransaction(signedTxn);
    return res.hash;
};

export const registerCoin = async (
    client: AptosClient,
    coinReceiver: AptosAccount,
    coinTypeAddress: string,
): Promise<string> => {
    const payload: {
        arguments: string[];
        function: string;
        type: string;
        type_arguments: any[];
    } = {
        arguments: [],
        function: '0x1::Coin::register',
        type: 'script_function_payload',
        type_arguments: [`${coinTypeAddress}`],
    };
    return executeTransactionWithPayload(client, coinReceiver, payload);
};

export async function transferToken(
    client: AptosClient,
    owner: AptosAccount,
    address: string,
    amount: number,
    exactTokenName: string,
): Promise<string> {
    const payload: {
        arguments: string[];
        function: string;
        type: string;
        type_arguments: any[];
    } = {
        arguments: [address, amount.toString()],
        function: '0x1::Coin::transfer',
        type: 'script_function_payload',
        type_arguments: [`${exactTokenName}`],
    };
    return executeTransactionWithPayload(client, owner, payload);
}
