// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0

import {
  Box,
  Button,
  Checkbox,
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
import { renderAddressWallet } from 'core/utils/func';
import { ChevronRightIcon, DragHandleIcon } from '@chakra-ui/icons';
import ChakraLink from 'core/components/ChakraLink';
import TransactionDetail from 'core/components/TransactionDetail';
import { SubmitHandler, useForm } from 'react-hook-form';
import React, { useEffect, useState } from 'react';
import {
  AptosAccount, AptosClient, FaucetClient, HexString, Types,
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
import { registerCoin, getCoinAddress } from '../core/utils/client';

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

interface Transaction {
  data: any;
  from: string;
  gas: number;
  gasPrice: number;
  hash: string;
  success: boolean;
  timestamp: number;
  toAddress: string;
  type: string;
  version: number;
  vmStatus: string;
}

interface FundWithFaucetProps {
  address?: string;
  faucetUrl?: string;
  nodeUrl?: string;
}

/** asset model */
interface Asset {
  address?: HexString,
  balance?: number,
  exactName?: string,
  name?: string,
  symbol?: string
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
  const { isOpen: isOpenModal, onClose: onCloseModal, onOpen: onOpenModal } = useDisclosure();
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
  const [listAssets, setListAssets] = useState<Asset[]>();
  const [listActivity, setListActivity] = useState<Transaction[]>();
  const [tabIndex, setTabIndex] = useState(0);
  const [transaction, setTransaction] = useState<any>();
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
  // const tokenSymbol: string | undefined | null = watch('tokenSymbol');
  // const tokenDecimal: string | undefined | null = watch('tokenDecimal');

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
    if (tokenAddress && aptosAccount) {
      setIsImportLoading(true);
      try {
        // TODO: import @khanh
        registerCoin(new AptosClient(NODE_URL), aptosAccount, tokenAddress).then(() => {
          setRefreshState(!refreshState);
          onCloseImport();
        });
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

  const loadAssets = async (resources: AccountResource[]) => {
    const client = new AptosClient(NODE_URL);
    const assets: Asset[] = [];
    if (resources) {
      for (let index = 0; index < resources.length; index += 1) {
        const resource = resources[index];
        if (resource.type.includes('0x1::Coin::CoinStore') && !resource.type.includes('0x1::TestCoin::TestCoin')) {
          const coinAddress = getCoinAddress(resource.type);
          const exectName = resource.type;
          if (coinAddress) {
            // eslint-disable-next-line no-await-in-loop
            const r = await client.getAccountResources(coinAddress);
            if (r) {
              const coinInfo = r.find((e) => e.type.includes('0x1::Coin::CoinInfo'))?.data as { decimal: string, name: string, symbol: string };
              if (coinInfo) {
                assets.push({
                  address: new HexString(coinAddress),
                  balance: parseFloat((resource.data as { coin: { value: string } }).coin.value),
                  exactName: exectName,
                  name: coinInfo.name,
                  symbol: coinInfo.symbol,
                });
              }
            }
          }
        }
      }
    }
    return assets;
  };

  // Change tab
  const handleTabAssets = (resource: AccountResource[]) => {
    // TODO: Call list assets -> set to listAssets @khanh
    loadAssets(resource).then(setListAssets);
  };

  const handleTabActivity = async () => {
    // TODO: Call list activity -> set to listActivity @haipn
    const client = new AptosClient(NODE_URL);
    if (address) {
      const data = await client.getAccountTransactions(address);
      console.log(data);
      const transactions = data.map((item: any) => ({
        data: item.payload,
        from: item.sender,
        gas: item.gas_used,
        gasPrice: item.gas_unit_price,
        hash: item.hash,
        success: item.success,
        timestamp: item.timestamp,
        toAddress: item.payload.function,
        type: item.type,
        version: item.version,
        vmStatus: item.vm_status,
      }));
      setListActivity(transactions);
    }
  };

  useEffect(() => {
    console.log(listActivity, 'listActivity');
  }, [listActivity]);

  const handleOpenTransaction = (data: any) => {
    // TODO: set data transaction @haipn
    setTransaction(data);
    onOpenModal();
  };

  const handleTabsChange = (index: any) => {
    setTabIndex(index);
  };

  const renderTime = (time: number) => {
    return new Date(time).toUTCString();
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
      if (tempAccountResources) {
        loadAssets(tempAccountResources).then(setListAssets);
      }
    });
  }, [refreshState]);

  // useEffect(() => {
  //   setTabIndex(0);
  //   // handleTabAssets();
  // }, []);

  useEffect(() => {
    if (aptosAccount) {
      getAccountResources({ address: aptosAccount.address().toString() }).then((resources) => {
        setAccountResources(resources);
        switch (tabIndex) {
          case 0:
            if (resources) handleTabAssets(resources);
            break;

          case 1:
            handleTabActivity();
            break;

          default:
            break;
        }
      });
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
            <List spacing={0}>
              {!!listAssets && listAssets.length > 0 && listAssets.map((item: Asset) => {
                return (
                  <ListItem key={item.name} py={2} borderBottom="1px" borderColor="gray.200">
                    <ChakraLink to={`/token/${item.exactName}`}>
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
              })}
            </List>
            <Flex alignItems={'center'} justifyItems={'center'} direction={'column'}>
              <Text>{"Don't see your tokens"}</Text>
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
              {!!listActivity && listActivity.map((item: any) => {
                return (
                  <ListItem
                    py={2}
                    borderBottom="1px"
                    borderColor="gray.200"
                    cursor={'pointer'}
                    key={item.hash}
                    onClick={() => handleOpenTransaction(item)}
                  >
                    <Flex alignItems={'center'} justifyContent={'space-between'}>
                      <Flex alignItems={'center'}>
                        <ListIcon as={DragHandleIcon} color="black.500" />
                        {item.success && (
                          <Checkbox colorScheme="green" defaultChecked marginRight={2} />
                        )}
                        {!item.success && (
                          <Checkbox colorScheme="red" defaultChecked marginRight={2} />
                        )}
                        <Flex flexDirection={'column'}>
                          <Text>
                            {renderAddressWallet(item.hash, 10)}
                          </Text>
                          <Text fontSize={'xs'}>
                            {renderTime(item.timestamp)}
                          </Text>
                        </Flex>
                      </Flex>
                      <Text>
                        {item.gas || 0}
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

      <TransactionDetail data={transaction} isOpen={isOpenModal} onClose={onCloseModal} />
    </WalletLayout>
  );
}

export default withSimulatedExtensionContainer(Wallet);
