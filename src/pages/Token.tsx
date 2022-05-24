// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0

import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputRightAddon,
  Link,
  List,
  ListIcon,
  ListItem,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger as OrigPopoverTrigger,
  Spacer,
  Text,
  useColorMode,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import ChakraLink from 'core/components/ChakraLink';
import { useParams } from 'react-router-dom';
import { SubmitHandler, useForm } from 'react-hook-form';
import React, { useEffect, useState } from 'react';
import {
  // AptosAccount,
  AptosClient, HexString, Types,
} from 'aptos';
import { AccountResource } from 'aptos/src/api/data-contracts';
import { IoIosSend } from 'react-icons/io';
import numeral from 'numeral';
import useWalletState from 'core/hooks/useWalletState';
import withSimulatedExtensionContainer from 'core/components/WithSimulatedExtensionContainer';
import { seconaryAddressFontColor } from 'core/components/WalletHeader';
import WalletLayout from 'core/layouts/WalletLayout';
import {
  NODE_URL,
  secondaryErrorMessageColor,
  // STATIC_GAS_AMOUNT,
} from '../core/constants';
import { getCoinAddress } from '../core/utils/client';

/**
 * TODO: Will be fixed in upcoming Chakra-UI 2.0.0
 * @see https://github.com/chakra-ui/chakra-ui/issues/5896
 */
export const PopoverTrigger: React.FC<{ children: React.ReactNode }> = OrigPopoverTrigger;

interface GetAccountResourcesProps {
  address?: string;
  nodeUrl?: string;
}

export const getAccountResources = async ({
  nodeUrl = NODE_URL,
  address,
}: GetAccountResourcesProps) => {
  const client = new AptosClient(nodeUrl);
  if (address) {
    const accountResources = await client.getAccountResources(
      address,
    );
    return accountResources;
  }
  return undefined;
};

export type Inputs = Record<string, any>;

// interface SubmitTransactionProps {
//   amount: string;
//   fromAddress: AptosAccount;
//   nodeUrl?: string;
//   toAddress: string;
// }

/** asset model */
interface Asset {
  address?: HexString,
  balance?: number,
  name?: string,
  symbol?: string
}

const TransferResult = Object.freeze({
  AmountOverLimit: 'Amount is over limit',
  AmountWithGasOverLimit: 'Amount with gas is over limit',
  IncorrectPayload: 'Incorrect transaction payload',
  Success: 'Transaction executed successfully',
  UndefinedAccount: 'Account does not exist',
} as const);

// const submitTransaction = async ({
//   toAddress,
//   fromAddress,
//   amount,
//   nodeUrl = NODE_URL,
// }: SubmitTransactionProps) => {
//   const client = new AptosClient(nodeUrl);
//   const payload: Types.TransactionPayload = {
//     arguments: [toAddress, `${amount}`],
//     function: '0x1::Coin::transfer',
//     type: 'script_function_payload',
//     type_arguments: ['0x1::TestCoin::TestCoin'],
//   };
//   const txnRequest = await client.generateTransaction(fromAddress.address(), payload);
//   const signedTxn = await client.signTransaction(fromAddress, txnRequest);
//   const transactionRes = await client.submitTransaction(signedTxn);
//   await client.waitForTransaction(transactionRes.hash);
// };

const getAccountBalanceFromAccountResources = (
  accountResources: Types.AccountResource[] | undefined,
): Number => {
  if (accountResources) {
    const accountResource = (accountResources) ? accountResources?.find((r) => r.type === '0x1::Coin::CoinStore<0x1::TestCoin::TestCoin>') : undefined;
    const tokenBalance = (accountResource)
      ? (accountResource.data as { coin: { value: string } }).coin.value
      : undefined;
    return Number(tokenBalance);
  }
  return -1;
};

function Token() {
  const { colorMode } = useColorMode();
  const { aptosAccount } = useWalletState();
  const { id } = useParams();
  const {
    formState: { errors }, handleSubmit, register, setError, watch,
  } = useForm();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [
    accountResources,
    setAccountResources,
  ] = useState<AccountResource[] | undefined>(undefined);
  const [refreshState, setRefreshState] = useState(true);
  const [isTransferLoading, setIsTransferLoading] = useState(false);
  const [lastBalance, setLastBalance] = useState<number>(-1);
  const [lastTransferAmount, setLastTransferAmount] = useState<number>(-1);
  const [listActivity, setListActivity] = useState<any>();
  const [asset, setAsset] = useState<Asset>();
  const [
    lastTransactionStatus,
    setLastTransactionStatus,
  ] = useState<string>(TransferResult.Success);
  const toast = useToast();

  const address = aptosAccount?.address().hex();
  const accountResource = (accountResources)
    ? accountResources?.find((r) => r.type === `0x1::Coin::CoinStore<${id}>`)
    : undefined;
  const tokenBalance = (accountResource)
    ? (accountResource.data as { coin: { value: string } }).coin.value
    : undefined;
  const tokenBalanceString = numeral(tokenBalance).format('0,0.0000');
  const toAddress: string | undefined | null = watch('toAddress');
  const transferAmount: string | undefined | null = watch('transferAmount');

  const onSubmit: SubmitHandler<Inputs> = async (data, event) => {
    event?.preventDefault();
    if (toAddress && aptosAccount && transferAmount) {
      setIsTransferLoading(true);
      setLastBalance(Number(tokenBalance));
      setLastTransferAmount(Number(transferAmount));
      try {
        // TODO: @khanh submit tranfer

        // if (Number(transferAmount) >= Number(tokenBalance) - STATIC_GAS_AMOUNT) {
        //   setLastTransactionStatus(TransferResult.AmountWithGasOverLimit);
        //   throw new Error(TransferResult.AmountOverLimit);
        // }
        // const accountResponse = await getAccountResources({
        //   address: toAddress,
        //   nodeUrl: NODE_URL,
        // });
        // if (!accountResponse) {
        //   setLastTransactionStatus(TransferResult.UndefinedAccount);
        //   throw new Error(TransferResult.UndefinedAccount);
        // }
        // await submitTransaction({
        //   amount: transferAmount,
        //   fromAddress: aptosAccount,
        //   toAddress,
        // });
        setLastTransactionStatus(TransferResult.Success);
        setRefreshState(!refreshState);
        onClose();
      } catch (e) {
        const err = (e as Error).message;
        if (err !== TransferResult.IncorrectPayload && err !== TransferResult.Success) {
          setIsTransferLoading(false);
        }
        setLastTransactionStatus(err);
        setError('toAddress', { message: err, type: 'custom' });
        setRefreshState(!refreshState);
      }
    }
  };

  const onChangeAmount = async (event: any) => {
    event?.preventDefault();
    console.log(transferAmount);
    console.log(event);
    // TODO: get gas and set gas @khanh
  };

  const loadAsset = async (resources: AccountResource[]) => {
    const client = new AptosClient(NODE_URL);
    let assetTemp: Asset = {};
    if (resources) {
      for (let index = 0; index < resources.length; index += 1) {
        const resource = resources[index];
        // Check resourse type vs resource type input
        if (resource.type.includes('0x1::Coin::CoinStore') && !resource.type.includes(id || '')) {
          const coinAddress = getCoinAddress(resource.type);
          if (coinAddress) {
            // eslint-disable-next-line no-await-in-loop
            const r = await client.getAccountResources(coinAddress);
            if (r) {
              const coinInfo = r.find((e) => e.type.includes('0x1::Coin::CoinInfo'))?.data as { decimal: string, name: string, symbol: string };
              if (coinInfo) {
                assetTemp = {
                  address: new HexString(coinAddress),
                  balance: parseFloat((resource.data as { coin: { value: string } }).coin.value),
                  name: coinInfo.name,
                  symbol: coinInfo.symbol,
                };
              }
            }
          }
        }
      }
    }
    return assetTemp;
  };

  const handleActivity = () => {
    // TODO: Call list activity -> set to listActivity of token @khanh
    setListActivity([]);
    console.log('activity');
  };

  useEffect(() => {
    getAccountResources({ address })?.then((data) => {
      if (
        isTransferLoading
        && (lastTransactionStatus === TransferResult.Success
          || lastTransactionStatus === TransferResult.IncorrectPayload)
      ) {
        const newTokenBalance = getAccountBalanceFromAccountResources(data);
        toast({
          description: `${lastTransactionStatus}. Amount transferred: ${lastTransferAmount}, gas consumed: ${lastBalance - lastTransferAmount - Number(newTokenBalance)}`,
          duration: 7000,
          isClosable: true,
          status: (lastTransactionStatus === TransferResult.Success) ? 'success' : 'error',
          title: (lastTransactionStatus === TransferResult.Success) ? 'Transaction succeeded' : 'Transaction failed',
        });
      }
      setIsTransferLoading(false);
      const tempAccountResources = data;
      setAccountResources(tempAccountResources);
    });
  }, [refreshState]);

  useEffect(() => {
    if (aptosAccount) {
      // TODO: Call get resoure token
      getAccountResources({ address: aptosAccount.address().toString() }).then((resources) => {
        setAccountResources(resources);
        if (resources) {
          loadAsset(resources).then(setAsset);
        }
      });
    }
  }, []);

  useEffect(() => {
    handleActivity();
  }, []);

  return (
    <WalletLayout>
      <VStack width="100%" paddingTop={8}>
        <ChakraLink to="/wallet">Back to Wallet</ChakraLink>
        <Text fontSize="sm" color={seconaryAddressFontColor[colorMode]}>
          Assets
          {' '}
          {!!asset && !!asset.name && asset.name}
          {' '}
          balance
        </Text>
        <Heading>{tokenBalanceString}</Heading>
        <HStack spacing={4}>
          <Popover
            isOpen={isOpen}
            onOpen={onOpen}
            onClose={onClose}
          >
            <PopoverTrigger>
              <Button
                isLoading={isTransferLoading}
                isDisabled={isTransferLoading}
                leftIcon={<IoIosSend />}
              >
                Send
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverArrow />
              <PopoverBody>
                <form onSubmit={handleSubmit(onSubmit)} onChange={onChangeAmount}>
                  <VStack spacing={4}>
                    <InputGroup>
                      <Input
                        variant="filled"
                        placeholder="To address"
                        required
                        maxLength={70}
                        minLength={60}
                        {...register('toAddress')}
                      />
                    </InputGroup>
                    <InputGroup>
                      <Input
                        type="number"
                        variant="filled"
                        placeholder="Transfer amount"
                        min={0}
                        required
                        {...register('transferAmount')}
                      />
                      <InputRightAddon>
                        tokens
                      </InputRightAddon>
                    </InputGroup>
                    <InputGroup gap={3}>
                      <Input
                        type="number"
                        variant="filled"
                        placeholder="0"
                        min={0}
                        disabled
                        {...register('gasLimit')}
                      />
                      <Input
                        type="number"
                        variant="filled"
                        placeholder="0"
                        min={0}
                        disabled
                        {...register('gasPrice')}
                      />
                    </InputGroup>
                    <Flex overflowY="auto" maxH="100px">
                      <Text
                        fontSize="xs"
                        color={secondaryErrorMessageColor[colorMode]}
                        wordBreak="break-word"
                      >
                        {(errors?.toAddress?.message)}
                      </Text>
                    </Flex>
                    <Button isDisabled={isTransferLoading} type="submit">
                      Submit
                    </Button>
                  </VStack>
                </form>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </HStack>

      </VStack>

      <List spacing={3} marginTop={10}>
        {!!listActivity && listActivity.length > 0 ? listActivity.map((item: any) => {
          return (
            <ListItem key={item.name}>
              <ChakraLink to={`/token/${item.address}`}>
                <Flex>
                  <Text>
                    {item.name}
                  </Text>
                  <Spacer />
                  <Box>
                    <Flex alignItems={'center'} justifyItems={'center'}>
                      <Text>
                        {item.balance}
                      </Text>
                      <ListIcon as={ChevronRightIcon} color="black.500" />
                    </Flex>
                  </Box>
                </Flex>
              </ChakraLink>
            </ListItem>
          );
        }) : (
          <Flex alignItems={'center'} justifyItems={'center'} direction={'column'}>
            <Text textAlign={'center'} marginTop={10}>
              Empty data
            </Text>
            <Link color="teal.500" href="#" onClick={handleActivity}>
              Load acivity
            </Link>
          </Flex>

        )}
      </List>
    </WalletLayout>
  );
}

export default withSimulatedExtensionContainer(Token);
