// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0

export const MIN_LENGTH: number = 4;

export const renderAddressWallet = (data: any, length: number = MIN_LENGTH): string => {
    if (typeof data === 'string') {
        /* eslint-disable */
        return data.substr(0, length) + '......' + data.substr(data.length - 4, data.length);
    }
    return '';
};
