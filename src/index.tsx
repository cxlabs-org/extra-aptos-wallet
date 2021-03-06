// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  QueryClientProvider,
  QueryClient,
} from 'react-query';
import { Routes, Route, MemoryRouter } from 'react-router-dom';
import { ChakraProvider, extendTheme, type ThemeConfig } from '@chakra-ui/react';
import Account from 'pages/Account';
import Wallet from 'pages/Wallet';
import Login from 'pages/Login';
import { WalletStateProvider } from 'core/hooks/useWalletState';
import Help from 'pages/Help';
import CreateWallet from 'pages/CreateWallet';
import Gallery from 'pages/Gallery';
import Token from 'pages/Token';

const theme: ThemeConfig = extendTheme({
  initialColorMode: 'dark',
  styles: {
    global: {
      'html, body': {
        margin: 0,
        padding: 0,
      },
    },
  },
  useSystemColorMode: false,
});

const queryClient = new QueryClient();

const root = createRoot(document.getElementById('root') as Element);

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <WalletStateProvider>
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/help" element={<Help />} />
              <Route path="/create-wallet" element={<CreateWallet />} />
              <Route path="/account" element={<Account />} />
              <Route path="/token/:id" element={<Token />} />
            </Routes>
          </MemoryRouter>
        </WalletStateProvider>
      </ChakraProvider>
    </QueryClientProvider>
  </StrictMode>,
);
