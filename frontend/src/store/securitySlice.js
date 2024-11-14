import { createSlice } from '@reduxjs/toolkit';

const securitySlice = createSlice({
    name: 'security',
    initialState: { isEncrypted: false },
    reducers: {
        toggleEncryption: (state) => {
            state.isEncrypted = !state.isEncrypted;
        },
    },
});

export const { toggleEncryption } = securitySlice.actions;
export default securitySlice.reducer;
