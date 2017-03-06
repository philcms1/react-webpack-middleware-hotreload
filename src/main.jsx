import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';

const render = Component => {
  ReactDOM.render(
    <AppContainer>
      <h1>Hello, World!</h1>
    </AppContainer>,
    document.getElementById('root'),
);
};

render();

if (module.hot) {
  module.hot.accept(() => { render(); });
}
