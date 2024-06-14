const request = require("supertest");
const { ApolloServer, gql } = require("apollo-server-express");
const { startServer, stopServer } = require("./server");

let httpServer;

beforeAll(async () => {
  httpServer = await startServer();
});

afterAll(async () => {
  await stopServer(httpServer);
});

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

describe("GraphQL API", () => {
  it("should create a warehouse with valid input", async () => {
    const response = await request(httpServer)
      .post("/graphql")
      .send({
        query: CREATE_WAREHOUSE.loc.source.body,
        variables: {
          shelves: [
            { name: "Shelf1", zone: 1 },
            { name: "Shelf2", zone: 2 },
          ],
        },
      });
    expect(response.status).toBe(200);
    expect(response.body.data.createWarehouse.id).toBe("1");
    expect(response.body.data.createWarehouse.shelves).toHaveLength(2);
  });

  it("should return an error for zone out of range", async () => {
    const response = await request(httpServer)
      .post("/graphql")
      .send({
        query: CREATE_WAREHOUSE.loc.source.body,
        variables: {
          shelves: [{ name: "Shelf1", zone: 13 }],
        },
      });
    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toBe(
      "Zone must be between 1 and 12 inclusive"
    );
  });

  it("should return an error for duplicate shelf names", async () => {
    const response = await request(httpServer)
      .post("/graphql")
      .send({
        query: CREATE_WAREHOUSE.loc.source.body,
        variables: {
          shelves: [
            { name: "Shelf1", zone: 1 },
            { name: "Shelf1", zone: 2 },
          ],
        },
      });
    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toBe(
      "Shelf names must be unique within a warehouse"
    );
  });

  it("should return an error for more than 10 shelves in a zone", async () => {
    const shelves = [];
    for (let i = 1; i <= 11; i++) {
      shelves.push({ name: `Shelf${i}`, zone: 1 });
    }
    const response = await request(httpServer).post("/graphql").send({
      query: CREATE_WAREHOUSE.loc.source.body,
      variables: { shelves },
    });
    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toBe(
      "A zone cannot contain more than 10 shelves"
    );
  });

  it("should create multiple warehouses with distinct data", async () => {
    // first warehouse
    let response = await request(httpServer)
      .post("/graphql")
      .send({
        query: CREATE_WAREHOUSE.loc.source.body,
        variables: {
          shelves: [
            { name: "Shelf1", zone: 1 },
            { name: "Shelf2", zone: 2 },
          ],
        },
      });
    expect(response.status).toBe(200);
    expect(response.body.data.createWarehouse.shelves).toHaveLength(2);
    // second warehouse
    response = await request(httpServer)
      .post("/graphql")
      .send({
        query: CREATE_WAREHOUSE.loc.source.body,
        variables: {
          shelves: [
            { name: "Shelf3", zone: 3 },
            { name: "Shelf4", zone: 4 },
          ],
        },
      });
    expect(response.status).toBe(200);
    expect(response.body.data.createWarehouse.shelves).toHaveLength(2);
  });

  it("should create a warehouse with exactly 10 shelves in a zone", async () => {
    const shelves = [];
    for (let i = 1; i <= 10; i++) {
      shelves.push({ name: `Shelf${i}`, zone: 1 });
    }
    const response = await request(httpServer).post("/graphql").send({
      query: CREATE_WAREHOUSE.loc.source.body,
      variables: { shelves },
    });
    expect(response.status).toBe(200);
    expect(response.body.data.createWarehouse.shelves).toHaveLength(10);
  });

  it("should handle special characters in shelf names", async () => {
    const response = await request(httpServer)
      .post("/graphql")
      .send({
        query: CREATE_WAREHOUSE.loc.source.body,
        variables: {
          shelves: [
            { name: "Shelf@1", zone: 1 },
            { name: "Shelf#2", zone: 2 },
          ],
        },
      });
    expect(response.status).toBe(200);
    expect(response.body.data.createWarehouse.shelves).toHaveLength(2);
  });

  it("should return an error for negative zone values", async () => {
    const response = await request(httpServer)
      .post("/graphql")
      .send({
        query: CREATE_WAREHOUSE.loc.source.body,
        variables: {
          shelves: [{ name: "Shelf1", zone: -1 }],
        },
      });
    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toBe(
      "Zone must be between 1 and 12 inclusive"
    );
  });

  it("should return an error for missing shelf names", async () => {
    const response = await request(httpServer)
      .post("/graphql")
      .send({
        query: CREATE_WAREHOUSE.loc.source.body,
        variables: {
          shelves: [{ name: "", zone: 1 }],
        },
      });
    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toBe(
      "Shelf name must not be empty"
    );
  });

  it("should return an error for non-integer zone values", async () => {
    const response = await request(httpServer)
      .post("/graphql")
      .send({
        query: CREATE_WAREHOUSE.loc.source.body,
        variables: {
          shelves: [{ name: "Shelf1", zone: "zone1" }],
        },
      });
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });
});
