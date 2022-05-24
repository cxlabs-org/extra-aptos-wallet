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
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger as OrigPopoverTrigger,
  Text,
  useColorMode,
  useDisclosure,
  useToast,
  // useToast,
  VStack,
} from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import ChakraLink from 'core/components/ChakraLink';
import { useParams } from 'react-router-dom';
import { SubmitHandler, useForm } from 'react-hook-form';
import React, { useEffect, useState } from 'react';
import {
  // AptosAccount,
  AptosClient,
} from 'aptos';
import { AccountResource } from 'aptos/src/api/data-contracts';
import { IoIosSend } from 'react-icons/io';
import numeral from 'numeral';
import useWalletState from 'core/hooks/useWalletState';
import withSimulatedExtensionContainer from 'core/components/WithSimulatedExtensionContainer';
import { seconaryAddressFontColor } from 'core/components/WalletHeader';
import WalletLayout from 'core/layouts/WalletLayout';
import { getCoinExactName, transferToken } from 'core/utils/client';
import {
  NODE_URL,
  secondaryErrorMessageColor,
  STATIC_GAS_AMOUNT,
} from '../core/constants';

/**
 * TODO: Will be fixed in upcoming Chakra-UI 2.0.0
 * @see https://github.com/chakra-ui/chakra-ui/issues/5896
 */
export const PopoverTrigger: React.FC<{ children: React.ReactNode }> = OrigPopoverTrigger;

export type Inputs = Record<string, any>;

// interface SubmitTransactionProps {
//   amount: string;
//   fromAddress: AptosAccount;
//   nodeUrl?: string;
//   toAddress: string;
// }

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

function Token() {
  const { colorMode } = useColorMode();
  const { aptosAccount } = useWalletState();
  const { id } = useParams();
  const {
    formState: { errors }, handleSubmit, register, setError, watch,
  } = useForm();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [
    accountResource,
    setAccountResource,
  ] = useState<AccountResource | undefined>(undefined);
  const [refreshState, setRefreshState] = useState(true);
  const [isTransferLoading, setIsTransferLoading] = useState(false);
  const [
    lastTransactionStatus,
    setLastTransactionStatus,
  ] = useState<string>(TransferResult.Success);
  const toast = useToast();

  const address = aptosAccount?.address().hex();

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
      try {
        const resourceName = getCoinExactName(id);
        if (aptosAccount && resourceName) {
          // eslint-disable-next-line max-len
          await transferToken(new AptosClient(NODE_URL), aptosAccount, toAddress, Number(transferAmount), resourceName);
        }

        if (Number(transferAmount) >= Number(tokenBalance) - STATIC_GAS_AMOUNT) {
          setLastTransactionStatus(TransferResult.AmountWithGasOverLimit);
          throw new Error(TransferResult.AmountOverLimit);
        }
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

  useEffect(() => {

  }, []);

  const getAccountResource = async () => {
    if (address) {
      // TODO: Call get resoure token
      const client = new AptosClient(NODE_URL);
      if (address && id) {
        // eslint-disable-next-line max-len
        client.getAccountResource(address, id, undefined).then(setAccountResource);
      }
    }
    return undefined;
  };

  useEffect(() => {
    getAccountResource()?.then((data) => {
      if (
        isTransferLoading
        && (lastTransactionStatus === TransferResult.Success
          || lastTransactionStatus === TransferResult.IncorrectPayload)
      ) {
        toast({
          duration: 7000,
          isClosable: true,
          status: (lastTransactionStatus === TransferResult.Success) ? 'success' : 'error',
          title: (lastTransactionStatus === TransferResult.Success) ? 'Transaction succeeded' : 'Transaction failed',
        });
      }
      setIsTransferLoading(false);
      const tempAccountResource = data;
      setAccountResource(tempAccountResource);
    });
  }, [refreshState]);

  return (
    <WalletLayout>
      <VStack width="100%" paddingTop={8} position={'relative'}>
        <ChakraLink to="/wallet" position={'absolute'} top={8} left={4}>
          <ChevronLeftIcon />
        </ChakraLink>
        <Text fontSize="sm" color={seconaryAddressFontColor[colorMode]}>
          Assets
          {' '}
          {/* {!!asset && !!asset.name && asset.name} */}
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
    </WalletLayout>
  );
}

export default withSimulatedExtensionContainer(Token);
