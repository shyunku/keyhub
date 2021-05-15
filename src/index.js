import React from 'react';
import ReactDOM from 'react-dom';
import reportWebVitals from './reportWebVitals';
import MainRouter from 'components/routers/MainRouter';
import 'assets/scss/reset.scss';
import 'assets/scss/default.scss';
import 'assets/scss/variables.scss';
import 'assets/scss/index.scss';

ReactDOM.render(
  <>
    <MainRouter/>
  </>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
