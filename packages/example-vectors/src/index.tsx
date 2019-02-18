import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { App } from './App';

const { Suspense } = React;
const root = document.createElement('div');
document.body.appendChild(root);
ReactDOM.render(
  <Suspense fallback={<div>Connecting!</div>}>
    <App />
  </Suspense>,
  root,
);
