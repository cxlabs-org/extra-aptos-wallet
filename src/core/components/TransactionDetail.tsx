// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0

import {
  Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, VStack,
} from '@chakra-ui/react';
import React from 'react';
import { CredentialHeaderAndBody } from 'pages/CreateWallet';

export const seconaryAddressFontColor = {
  dark: 'gray.400',
  light: 'gray.500',
};

export default function TransactionDetail({ data, isOpen, onClose }: any) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Transaction detail
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack mt={2} spacing={4} pb={8}>
            <CredentialHeaderAndBody
              header="Transaction ID"
              body={!!data && !!data && data.transactionId}
            />
            <CredentialHeaderAndBody
              header="Transaction Status"
              body={!!data && data.status}
            />
            <CredentialHeaderAndBody
              header="From"
              body={!!data && data.from}
            />
            <CredentialHeaderAndBody
              header="To"
              body={!!data && data.to}
            />
            <CredentialHeaderAndBody
              header="Amount"
              body={!!data && data.amount}
            />
            <CredentialHeaderAndBody
              header="Gas Limit"
              body={!!data && data.gasLimit}
            />
            <CredentialHeaderAndBody
              header="Gas Price"
              body={!!data && data.gasPrice}
            />
            <CredentialHeaderAndBody
              header="Total"
              body={!!data && data.total}
            />
            <CredentialHeaderAndBody
              header="Transaction data"
              body={!!data && data.transactionData}
            />
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
