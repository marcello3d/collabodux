import React from 'react';
import { StoreContext, useDispatch, useMappedState } from 'redux-react-hook';
import { createReduxStore } from './redux/reducer';
import { App } from './App';

const store = createReduxStore();

export function ReduxApp() {
  return (
    <StoreContext.Provider value={store}>
      <App />
    </StoreContext.Provider>
  );
}
