import { gql } from "@apollo/client";

export type TransactionType = "INCOME" | "EXPENSE";

export type Category = {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export type Transaction = {
  id: string;
  description: string;
  date: string;
  type: TransactionType;
  amountCents: number;
  categoryId: string | null;
  category: Category | null;
  createdAt: string;
  updatedAt: string;
};

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      title
      description
      icon
      color
      createdAt
      updatedAt
    }
  }
`;

export const GET_TRANSACTIONS = gql`
  query GetTransactions {
    transactions {
      id
      description
      date
      type
      amountCents
      categoryId
      createdAt
      updatedAt
      category {
        id
        title
        icon
        color
      }
    }
  }
`;

export const CREATE_CATEGORY = gql`
  mutation CreateCategory($input: CreateCategoryInput!) {
    createCategory(input: $input) {
      id
      title
      description
      icon
      color
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($input: UpdateCategoryInput!) {
    updateCategory(input: $input) {
      id
      title
      description
      icon
      color
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: ID!) {
    deleteCategory(id: $id)
  }
`;

export const CREATE_TRANSACTION = gql`
  mutation CreateTransaction($input: CreateTransactionInput!) {
    createTransaction(input: $input) {
      id
      description
      date
      type
      amountCents
      categoryId
      createdAt
      updatedAt
      category {
        id
        title
        icon
        color
      }
    }
  }
`;

export const UPDATE_TRANSACTION = gql`
  mutation UpdateTransaction($input: UpdateTransactionInput!) {
    updateTransaction(input: $input) {
      id
      description
      date
      type
      amountCents
      categoryId
      createdAt
      updatedAt
      category {
        id
        title
        icon
        color
      }
    }
  }
`;

export const DELETE_TRANSACTION = gql`
  mutation DeleteTransaction($id: ID!) {
    deleteTransaction(id: $id)
  }
`;