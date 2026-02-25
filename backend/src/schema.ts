export const typeDefs = `#graphql
  enum TransactionType {
    INCOME
    EXPENSE
  }

  type Category {
    id: ID!
    title: String!
    description: String
    icon: String!
    color: String!
    createdAt: String!
    updatedAt: String!
  }

  type Transaction {
    id: ID!
    description: String!
    date: String!
    type: TransactionType!
    amountCents: Int!
    categoryId: ID
    category: Category
    createdAt: String!
    updatedAt: String!
  }

  input TransactionsFilterInput {
    type: TransactionType
    from: String
    to: String
    categoryId: ID
  }

  input CreateCategoryInput {
    title: String!
    description: String
    icon: String!
    color: String!
  }

  input UpdateCategoryInput {
    title: String
    description: String
    icon: String
    color: String
  }

  input CreateTransactionInput {
    description: String!
    date: String!
    type: TransactionType!
    amountCents: Int!
    categoryId: ID
  }

  input UpdateTransactionInput {
    description: String
    date: String
    type: TransactionType
    amountCents: Int
    categoryId: ID
  }

  type Query {
    categories: [Category!]!
    transactions(filter: TransactionsFilterInput): [Transaction!]!
  }

  type Mutation {
    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(id: ID!, input: UpdateCategoryInput!): Category!
    deleteCategory(id: ID!): Boolean!

    createTransaction(input: CreateTransactionInput!): Transaction!
    updateTransaction(id: ID!, input: UpdateTransactionInput!): Transaction!
    deleteTransaction(id: ID!): Boolean!
  }
`;