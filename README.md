# Aptos Web Wallet
[![Release](https://img.shields.io/github/v/release/cxlabs-org/extra-aptos-wallet)](https://github.com/cxlabs-org/extra-aptos-wallet/releases)
[![tag](https://img.shields.io/github/v/tag/cxlabs-org/extra-aptos-wallet)](https://github.com/cxlabs-org/extra-aptos-wallet/tags)

Aptos Wallet but better.

![](https://github.com/cxlabs-org/extra-aptos-wallet/blob/main/FTlj0mZUYAEaOz0.jpeg)

An extra version that unofficially developed by [CxLabs](https://cxlabs.org) aiming to provide a more convenient entrace of the Aptos network for all the users of Aptos-based-blockchains

- Friendly UI
- Import / Transfer Token
- Transactions History
- Secure local accounts storage
- Intuitive Tokens management

## Setup

**A. Extension**
1. `yarn build`
2. In Chrome, go to [chrome://extensions/](chrome://extensions/)
3. Enable developer mode
4. Hit `Load Unpacked` and point to new `build` folder in `web-wallet` directory

*todo: Add a release build folder so you don't have to yarn build*

**B. Webpage**
1. `yarn run`

## Linting
```bash
# Autofix all linting issues
npm run lint -- --fix
```
