import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";


export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        {/* <s-link href="/app">Home Page</s-link>
        <s-link href="/app/create-bar">create Bar widget</s-link>
        <s-link href="/app/create-small">create Small widget</s-link>
        <s-link href="/app/create-inline">create Inline widget</s-link>
        <s-link href="/app/create-large">create Large widget</s-link>
        <s-link href="/app/banner-bar"> Bar widget</s-link>
        <s-link href="/app/banner-small"> Small widget</s-link>
        <s-link href="/app/banner-inline">Inline widget</s-link>
        <s-link href="/app/banner-large">Large widget</s-link> */}

        
      </s-app-nav>
      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
