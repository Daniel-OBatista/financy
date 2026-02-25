import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ApolloProvider } from "@apollo/client/react";
import App from "./App";
import { apolloClient } from "./apollo";
import { AuthProvider } from "./auth/AuthProvider";
import "./index.css";

const rootEl = document.getElementById("root");

if (!rootEl) {
  throw new Error("Elemento #root não encontrado no HTML.");
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ApolloProvider>
  </React.StrictMode>
);