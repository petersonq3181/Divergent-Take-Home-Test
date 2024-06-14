import React, { useState } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';

const CREATE_WAREHOUSE = gql`
  mutation CreateWarehouse($shelves: [ShelfInput!]!) {
    createWarehouse(shelves: $shelves) {
      id
      shelves {
        name
        zone
      }
    }
  }
`;

const GET_WAREHOUSES = gql`
  query GetWarehouses {
    warehouses {
      id
      shelves {
        name
        zone
      }
    }
  }
`;

const WarehouseForm: React.FC = () => {
  const [shelves, setShelves] = useState<{ name: string; zone: number }[]>([]);
  const [shelfName, setShelfName] = useState('');
  const [zone, setZone] = useState<number>(1);
  const [message, setMessage] = useState<string | null>(null);
  const [createWarehouse] = useMutation(CREATE_WAREHOUSE);
  const { data, refetch } = useQuery(GET_WAREHOUSES, {
    fetchPolicy: 'network-only',
  });

  const addShelf = () => {
    setMessage(null);
    if (shelfName && zone >= 1 && zone <= 12) {
      setShelves([...shelves, { name: shelfName, zone }]);
      setShelfName('');
      setZone(1);
    }
  };

  const handleSubmit = async () => {
    try {
      setMessage(null);
      await createWarehouse({ variables: { shelves } });
      setMessage('Warehouse created successfully!');
      setShelves([]);
      refetch();
    } catch (e) {
      setMessage((e as any).message);
    }
  };

  const clearShelves = () => {
    setMessage(null);
    setShelves([]);
  };

  return (
    <div>
      <h2>Create Warehouse</h2>
      <div>
        <label htmlFor="shelfName">Shelf Name</label>
        <input
          type="text"
          id="shelfName"
          value={shelfName}
          onChange={(e) => setShelfName(e.target.value)}
          placeholder="Shelf Name"
        />
      </div>
      <div>
        <label htmlFor="zone">Zone Number</label>
        <input
          type="number"
          id="zone"
          value={zone}
          onChange={(e) => setZone(parseInt(e.target.value))}
          placeholder="Zone (1-12)"
          min="1"
          max="12"
        />
      </div>
      <button onClick={addShelf}>Add Shelf</button>
      <button onClick={handleSubmit}>Submit Warehouse</button>
      <button onClick={clearShelves}>Clear Shelves</button>

      {message && <p style={{ color: message.startsWith('Error') ? 'red' : 'green' }}>{message}</p>}

      <h3>Current Shelves</h3>
      <ul>
        {shelves.map((shelf, index) => (
          <li key={index}>{`Name: ${shelf.name}, Zone: ${shelf.zone}`}</li>
        ))}
      </ul>

      {data && (
        <div>
          <h2>Show Current Warehouses</h2>
          {data.warehouses.map((warehouse: any) => (
            <div key={warehouse.id}>
              <h4>Warehouse {warehouse.id}</h4>
              <ul>
                {warehouse.shelves.map((shelf: any, index: number) => (
                  <li key={index}>{`Shelf Name: ${shelf.name}, Zone: ${shelf.zone}`}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WarehouseForm;
