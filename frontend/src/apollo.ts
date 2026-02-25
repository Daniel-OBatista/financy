import { ApolloClient, InMemoryCache, HttpLink, from } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const uri = import.meta.env.VITE_GRAPHQL_URL as string;

const AUTH_TOKEN_KEY = "financy_token";

const httpLink = new HttpLink({ uri });

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
});