import { IBulkAction } from "@/app/interface";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface BulkActionState {
    bulkActions: IBulkAction[];
}

const initialState: BulkActionState = {
    bulkActions: []
}

const bulkActionSlice = createSlice({
    name: "bulkActions",
    initialState,
    reducers: {
        setBulkActions: (state, action: PayloadAction<IBulkAction[]>) => {
            state.bulkActions = action.payload;
        },
        addNewBulkAction: (state, action: PayloadAction<IBulkAction>) => {
            state.bulkActions.push(action.payload);
        },
        updateBulkAction: (state, action: PayloadAction<IBulkAction>) => {
            const index = state.bulkActions.findIndex(bulkAction => bulkAction.id === action.payload.id);
            if (index !== -1) {
                state.bulkActions[index] = action.payload;
            }
        }
    }
})

export const { setBulkActions, addNewBulkAction, updateBulkAction } = bulkActionSlice.actions;
export default bulkActionSlice.reducer;