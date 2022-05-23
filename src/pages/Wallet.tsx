// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0

import {
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
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorMode,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { ChevronRightIcon, DragHandleIcon } from '@chakra-ui/icons';
import { SubmitHandler, useForm } from 'react-hook-form';
import React, { useEffect, useState } from 'react';
import {
  AptosAccount, AptosClient, FaucetClient, Types,
} from 'aptos';
import { AccountResource } from 'aptos/src/api/data-contracts';
import { FaFaucet } from 'react-icons/fa';
import { IoIosSend } from 'react-icons/io';
import numeral from 'numeral';
import useWalletState from 'core/hooks/useWalletState';
import withSimulatedExtensionContainer from 'core/components/WithSimulatedExtensionContainer';
import { seconaryAddressFontColor } from 'core/components/WalletHeader';
import WalletLayout from 'core/layouts/WalletLayout';
import {
  FAUCET_URL,
  NODE_URL,
  secondaryErrorMessageColor,
  STATIC_GAS_AMOUNT,
} from '../core/constants';

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

interface SubmitTransactionProps {
  amount: string;
  fromAddress: AptosAccount;
  nodeUrl?: string;
  toAddress: string;
}

interface FundWithFaucetProps {
  address?: string;
  faucetUrl?: string;
  nodeUrl?: string;
}

const fundWithFaucet = async ({
  nodeUrl = NODE_URL,
  faucetUrl = FAUCET_URL,
  address,
}: FundWithFaucetProps): Promise<void> => {
  const faucetClient = new FaucetClient(nodeUrl, faucetUrl);
  if (address) {
    await faucetClient.fundAccount(address, 5000);
  }
};

const TransferResult = Object.freeze({
  AmountOverLimit: 'Amount is over limit',
  AmountWithGasOverLimit: 'Amount with gas is over limit',
  IncorrectPayload: 'Incorrect transaction payload',
  Success: 'Transaction executed successfully',
  UndefinedAccount: 'Account does not exist',
} as const);

const submitTransaction = async ({
  toAddress,
  fromAddress,
  amount,
  nodeUrl = NODE_URL,
}: SubmitTransactionProps) => {
  const client = new AptosClient(nodeUrl);
  const payload: Types.TransactionPayload = {
    arguments: [toAddress, `${amount}`],
    function: '0x1::Coin::transfer',
    type: 'script_function_payload',
    type_arguments: ['0x1::TestCoin::TestCoin'],
  };
  const txnRequest = await client.generateTransaction(fromAddress.address(), payload);
  const signedTxn = await client.signTransaction(fromAddress, txnRequest);
  const transactionRes = await client.submitTransaction(signedTxn);
  await client.waitForTransaction(transactionRes.hash);
};

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

function Wallet() {
  const { colorMode } = useColorMode();
  const { aptosAccount } = useWalletState();
  const {
    formState: { errors }, handleSubmit, register, setError, watch,
  } = useForm();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const { isOpen: isOpenImport, onClose: onCloseImport, onOpen: onOpenImport } = useDisclosure();
  const [
    accountResources,
    setAccountResources,
  ] = useState<AccountResource[] | undefined>(undefined);
  const [refreshState, setRefreshState] = useState(true);
  const [isFaucetLoading, setIsFaucetLoading] = useState(false);
  const [isTransferLoading, setIsTransferLoading] = useState(false);
  const [isImportLoading, setIsImportLoading] = useState(false);
  const [lastBalance, setLastBalance] = useState<number>(-1);
  const [lastTransferAmount, setLastTransferAmount] = useState<number>(-1);
  const [listAssets, setListAssets] = useState<any>();
  const [listActivity, setListActivity] = useState<any>();
  const [tabIndex, setTabIndex] = useState(-1);
  const [
    lastTransactionStatus,
    setLastTransactionStatus,
  ] = useState<string>(TransferResult.Success);
  const toast = useToast();

  const address = aptosAccount?.address().hex();
  const accountResource = (accountResources)
    ? accountResources?.find((r) => r.type === '0x1::Coin::CoinStore<0x1::TestCoin::TestCoin>')
    : undefined;
  const tokenBalance = (accountResource)
    ? (accountResource.data as { coin: { value: string } }).coin.value
    : undefined;
  const tokenBalanceString = numeral(tokenBalance).format('0,0.0000');
  const toAddress: string | undefined | null = watch('toAddress');
  const transferAmount: string | undefined | null = watch('transferAmount');

  const tokenAddress: string | undefined | null = watch('tokenAddress');
  const tokenSymbol: string | undefined | null = watch('tokenSymbol');
  const tokenDecimal: string | undefined | null = watch('tokenDecimal');

  const onSubmit: SubmitHandler<Inputs> = async (data, event) => {
    event?.preventDefault();
    if (toAddress && aptosAccount && transferAmount) {
      setIsTransferLoading(true);
      setLastBalance(Number(tokenBalance));
      setLastTransferAmount(Number(transferAmount));
      try {
        // TODO: awaiting Zekun's changes, @see PR #821
        if (Number(transferAmount) >= Number(tokenBalance) - STATIC_GAS_AMOUNT) {
          setLastTransactionStatus(TransferResult.AmountWithGasOverLimit);
          throw new Error(TransferResult.AmountOverLimit);
        }
        const accountResponse = await getAccountResources({
          address: toAddress,
          nodeUrl: NODE_URL,
        });
        if (!accountResponse) {
          setLastTransactionStatus(TransferResult.UndefinedAccount);
          throw new Error(TransferResult.UndefinedAccount);
        }
        await submitTransaction({
          amount: transferAmount,
          fromAddress: aptosAccount,
          toAddress,
        });
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

  const onSubmitImport: SubmitHandler<Inputs> = async (data, event) => {
    event?.preventDefault();
    if (tokenAddress && tokenSymbol && tokenDecimal) {
      setIsImportLoading(true);
      try {
        // TODO: import @khanh

        setRefreshState(!refreshState);
        onClose();
      } catch (e) {
        const err = (e as Error).message;
        if (err !== TransferResult.IncorrectPayload && err !== TransferResult.Success) {
          setIsImportLoading(false);
        }
        setRefreshState(!refreshState);
      }
    }
  };

  const faucetOnClick = async () => {
    setIsFaucetLoading(true);
    await fundWithFaucet({ address });
    setRefreshState(!refreshState);
    setIsFaucetLoading(false);
  };

  // Change tab
  const handleTabAssets = () => {
    // TODO: Call list assets -> set to listAssets @khanh

    setListAssets([]);
    console.log('assets');
  };

  const handleTabActivity = () => {
    // TODO: Call list activity -> set to listActivity @khanh

    setListActivity([]);
    console.log('activity');
  };

  const handleTabsChange = (index: any) => {
    setTabIndex(index);
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
      setIsImportLoading(false);
    });
  }, [refreshState]);

  useEffect(() => {
    setTabIndex(0);
    // handleTabAssets();
  }, []);

  useEffect(() => {
    switch (tabIndex) {
      case 0:
        handleTabAssets();
        break;

      case 1:
        handleTabActivity();
        break;

      default:
        break;
    }
  }, [tabIndex]);

  return (
    <WalletLayout>
      <VStack width="100%" paddingTop={8}>
        <Text fontSize="sm" color={seconaryAddressFontColor[colorMode]}>Account balance</Text>
        <Heading>{tokenBalanceString}</Heading>
        <HStack spacing={4}>
          <Button
            isLoading={isFaucetLoading}
            leftIcon={<FaFaucet />}
            onClick={faucetOnClick}
            isDisabled={isFaucetLoading}
          >
            Faucet
          </Button>
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
                <form onSubmit={handleSubmit(onSubmit)}>
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
      <Tabs isLazy isFitted size="lg" index={tabIndex} onChange={handleTabsChange}>
        <TabList>
          <Tab outlineColor={'transparent'}>Assets</Tab>
          <Tab outlineColor={'transparent'}>Activity</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <List spacing={3}>
              {!!listAssets && listAssets.lenght > 0 && listAssets.map((item: any) => {
                return (
                  <ListItem>
                    <Flex>
                      <Text>
                        {item.name}
                      </Text>
                      <Text>
                        {item.amount}
                      </Text>
                      <ListIcon as={ChevronRightIcon} color="black.500" />
                    </Flex>
                  </ListItem>
                );
              })}
            </List>
            <Flex alignItems={'center'} justifyItems={'center'} direction={'column'}>
              <Text>{"Don't see your tokens"}</Text>
              {/* <Link color="teal.500" href="#">
                Import tokens
              </Link> */}
              <Popover
                isOpen={isOpenImport}
                onOpen={onOpenImport}
                onClose={onCloseImport}
              >
                <PopoverTrigger>
                  <Button
                    isLoading={isImportLoading}
                    isDisabled={isImportLoading}
                    leftIcon={<IoIosSend />}
                  >
                    Import tokens
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <PopoverArrow />
                  <PopoverBody>
                    <form onSubmit={handleSubmit(onSubmitImport)}>
                      <VStack spacing={4}>
                        <InputGroup>
                          <Input
                            variant="filled"
                            placeholder="Token address"
                            required
                            {...register('tokenAddress')}
                          />
                        </InputGroup>
                        <InputGroup>
                          <Input
                            type="number"
                            variant="filled"
                            placeholder="Token Symbol"
                            required
                            {...register('tokenSymbol')}
                          />
                        </InputGroup>
                        <InputGroup>
                          <Input
                            type="number"
                            variant="filled"
                            placeholder="Token Decimal"
                            required
                            {...register('tokenDecimal')}
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
                        <Button isDisabled={isImportLoading} type="submit">
                          Submit
                        </Button>
                      </VStack>
                    </form>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            </Flex>
          </TabPanel>
          <TabPanel>
            <List spacing={3}>
              {!!listActivity && listActivity.lenght > 0 && listActivity.map((item: any) => {
                return (
                  <ListItem>
                    <Flex>
                      <ListIcon as={DragHandleIcon} color="black.500" />
                      <Text>
                        {item.function}
                      </Text>
                      <Text>
                        {item.amount}
                      </Text>
                    </Flex>
                  </ListItem>
                );
              })}
              <Flex alignItems={'center'} justifyItems={'center'} direction={'column'}>
                <Link color="teal.500" href="#" onClick={handleTabActivity}>
                  Load acivity
                </Link>
              </Flex>
            </List>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </WalletLayout>
  );
}

export default withSimulatedExtensionContainer(Wallet);
