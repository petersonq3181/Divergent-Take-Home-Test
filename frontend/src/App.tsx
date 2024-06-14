// src/App.tsx
import React from 'react';
import { ApolloProvider } from '@apollo/client';
import client from './ApolloClient';
import WarehouseForm from './WarehouseForm';

const App: React.FC = () => (
  <ApolloProvider client={client}>
    <div className="App">
      <WarehouseForm />
    </div>
  </ApolloProvider>
);

export default App;
