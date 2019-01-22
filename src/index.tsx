import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { App } from './App';

// @ts-ignore
const { ConcurrentMode, Suspense }  = React;
ReactDOM.render(
  <ConcurrentMode>
    <Suspense fallback={<div>Connecting!</div>}>
      <App />
    </Suspense>
  </ConcurrentMode>,
  document.getElementById('root'),
);
