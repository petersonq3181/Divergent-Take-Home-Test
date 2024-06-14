const express = require("express");
const { ApolloServer, gql, UserInputError } = require("apollo-server-express");

// in-memory mock database for simplicity
const warehouses = [];

// GraphQL schema
const typeDefs = gql`
  type Shelf {
    name: String!
    zone: Int!
  }

  type Warehouse {
    id: ID!
    shelves: [Shelf!]!
  }

  type Query {
    warehouses: [Warehouse!]!
  }

  type Mutation {
    createWarehouse(shelves: [ShelfInput!]!): Warehouse
  }

  input ShelfInput {
    name: String!
    zone: Int!
  }
`;

const resolvers = {
  Query: {
    warehouses: () => warehouses,
  },

  Mutation: {
    createWarehouse: (_, { shelves }) => {
      const zoneCount = {};
      const shelfNames = new Set();

      for (const shelf of shelves) {
        // check valid zone
        if (shelf.zone < 1 || shelf.zone > 12) {
          throw new UserInputError("Zone must be between 1 and 12 inclusive", {
            invalidArgs: shelf.zone,
          });
        }

        // check valid shelf name
        if (!shelf.name) {
          throw new UserInputError("Shelf name must not be empty", {
            invalidArgs: shelf.name,
          });
        }

        // check unique shelf name
        if (shelfNames.has(shelf.name)) {
          throw new UserInputError(
            "Shelf names must be unique within a warehouse",
            {
              invalidArgs: shelf.name,
            }
          );
        }
        shelfNames.add(shelf.name);

        if (!zoneCount[shelf.zone]) {
          zoneCount[shelf.zone] = 0;
        }
        zoneCount[shelf.zone]++;

        // check proper # of shelves per zone
        if (zoneCount[shelf.zone] > 10) {
          throw new UserInputError(
            "A zone cannot contain more than 10 shelves",
            {
              invalidArgs: shelf.zone,
            }
          );
        }
      }

      // add the new warehouse if all validations pass
      const id = warehouses.length + 1;
      const newWarehouse = { id, shelves };
      warehouses.push(newWarehouse);
      return newWarehouse;
    },
  },
};

// custom error formatting
const formatError = (err) => {
  if (err.originalError instanceof UserInputError) {
    err.extensions.code = "BAD_USER_INPUT";
  }
  return err;
};

let server;
let app;
async function startServer() {
  app = express();
  server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError,
  });
  await server.start();
  server.applyMiddleware({ app });

  // middleware to handle errors and set status codes
  app.use((err, req, res, next) => {
    if (err.extensions && err.extensions.code === "BAD_USER_INPUT") {
      res.status(400).json(err);
    } else {
      next(err);
    }
  });

  return app.listen({ port: 4000 });
}

async function stopServer(httpServer) {
  if (server) {
    await server.stop();
  }
  if (httpServer) {
    httpServer.close();
  }
}

module.exports = { typeDefs, resolvers, startServer, stopServer };
