import { combineReducers, configureStore } from "@reduxjs/toolkit";
import bulkActionSlice from "./features/bulk-actions/bulkActionSlice";

const rootReducer = combineReducers({
    bulkActions: bulkActionSlice
});

export default configureStore({
    reducer: rootReducer
});

export type RootState = ReturnType<typeof rootReducer>;