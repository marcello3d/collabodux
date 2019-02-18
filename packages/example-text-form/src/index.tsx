import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { App } from './App';

const { Suspense } = React;
ReactDOM.render(
  <Suspense fallback={<div>Connecting!</div>}>
    <App />
  </Suspense>,
  document.getElementById('root'),
);
