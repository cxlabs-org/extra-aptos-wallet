// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0

import {
  Checkbox,
  Code,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Tag,
  Text,
  Tooltip,
  useClipboard,
  VStack,
} from '@chakra-ui/react';
import { renderAddressWallet } from 'core/utils/func';
import React from 'react';

export const seconaryAddressFontColor = {
  dark: 'gray.400',
  light: 'gray.500',
};

export interface KeyValueBodyProps {
  body: string;
  dataType?: any;
  header: string;
  type?: string;
  value: string;
}

export function KeyValueBody({
  body,
  dataType,
  header,
  type,
  value,
}: KeyValueBodyProps) {
  const { hasCopied, onCopy } = useClipboard(value || '');
  return (
    <Flex width={'100%'} justifyContent={'space-between'} flexDirection={type === 'code' ? 'column' : 'row'}>
      <Tag>
        {header}
      </Tag>
      <Tooltip label={hasCopied ? 'Copied!' : 'Copy'} closeDelay={300}>
        <Flex alignItems={'center'} justifyContent={'center'}>
          {type === 'checkbox' && dataType && (
            <Checkbox colorScheme="green" defaultChecked marginRight={2} />
          )}
          {type === 'checkbox' && !dataType && (
            <Checkbox colorScheme="red" defaultChecked marginRight={2} />
          )}
          {type !== 'code' && (
            <Text fontSize="xs" cursor="pointer" onClick={onCopy}>
              {body}
            </Text>
          )}
        </Flex>
      </Tooltip>
      {type === 'code' && (
        <Code mt={2}>
          {JSON.stringify(dataType)}
        </Code>
      )}
    </Flex>
  );
}

export default function TransactionDetail({ data, isOpen, onClose }: any) {
  const renderTime = (time: number) => {
    return new Date(time).toUTCString();
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Transaction
          {' '}
          {!!data && data.version}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack mt={0} spacing={2} pb={4}>
            <KeyValueBody
              header="Type"
              body={!!data && !!data && data.type}
              value={!!data && !!data && data.type}
            />
            <KeyValueBody
              header="Status"
              body={!!data && data.vmStatus}
              value={!!data && data.vmStatus}
              type="checkbox"
              dataType={!!data && !!data.success && data.success}
            />
            <KeyValueBody
              header="Hash"
              body={data ? renderAddressWallet(data.hash, 10) : ''}
              value={data ? data.hash : ''}
            />
            <KeyValueBody
              header="From"
              body={data ? renderAddressWallet(data.from, 10) : ''}
              value={data ? data.from : ''}
            />
            <KeyValueBody
              header="ToAddress"
              body={data ? data.toAddress : ''}
              value={data ? data.toAddress : ''}
            />
            <KeyValueBody
              header="Timestamp"
              body={data ? renderTime(data.timestamp) : ''}
              value={!!data && data.timestamp}
            />
            <KeyValueBody
              header="Gas Limit"
              body={!!data && (data.gasLimit || 0)}
              value={!!data && (data.gasLimit || 0)}
            />
            <KeyValueBody
              header="Gas Price"
              body={!!data && data.gasPrice}
              value={!!data && data.gasPrice}
            />
            <KeyValueBody
              header="Transaction data"
              body={!!data && data.transactionData}
              value={!!data && data.transactionData}
              type={'code'}
              dataType={!!data && data.data}
            />
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
