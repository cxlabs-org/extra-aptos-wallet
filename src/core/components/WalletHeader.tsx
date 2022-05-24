// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0

import {
  Flex, HStack, Text, Tooltip, useClipboard, useColorMode,
} from '@chakra-ui/react';
import React from 'react';
import useWalletState from 'core/hooks/useWalletState';
import { renderAddressWallet } from 'core/utils/func';

const secondaryHeaderBgColor = {
  dark: 'gray.700',
  light: 'gray.200',
};

export const seconaryAddressFontColor = {
  dark: 'gray.400',
  light: 'gray.500',
};

export default function WalletHeader() {
  const { aptosAccount } = useWalletState();
  const { colorMode } = useColorMode();
  const { hasCopied, onCopy } = useClipboard(
    aptosAccount?.address().hex() || '',
  );

  return (
    <Flex
      maxW="100%"
      width="100%"
      py={6}
      bgColor={secondaryHeaderBgColor[colorMode]}
    >
      <HStack px={2}>
        <Text
          fontSize="xs"
          color={seconaryAddressFontColor[colorMode]}
        >
          Address
        </Text>
        <Tooltip label={hasCopied ? 'Copied!' : 'Copy address'} closeDelay={300}>
          <Text whiteSpace="nowrap" as="span">
            <Text
              fontSize="xs"
              as="span"
              whiteSpace="nowrap"
              overflow="hidden"
              display="block"
              noOfLines={1}
              maxW={['100px', '120px']}
              cursor="pointer"
              onClick={onCopy}
            >
              {renderAddressWallet(aptosAccount?.address().hex(), 6)}
            </Text>
          </Text>
        </Tooltip>
      </HStack>
    </Flex>
  );
}
