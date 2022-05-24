// Copyright (c) Aptos
// SPDX-License-Identifier: Apache-2.0

export const MIN_LENGTH: number = 6;

export const renderAddressWallet = (
    data: any,
    start: number = MIN_LENGTH,
    end: number = MIN_LENGTH,
): string => {
    if (typeof data === 'string') {
        /* eslint-disable */
        return data.substr(0, start) + '......' + data.substr(data.length - end, data.length);
    }
    return '';
};
