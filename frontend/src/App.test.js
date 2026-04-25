import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");

    const normalize = (path) => (path === "/" ? "/" : path.replace(/\/+$/, ""));
    const currentPath = () => normalize(globalThis.location.pathname || "/");

    function BrowserRouter({ children }) {
      return <>{children}</>;
    }

    function Routes({ children }) {
      const routeList = React.Children.toArray(children);
      const activeRoute =
        routeList.find((child) => normalize(child.props.path) === currentPath()) ?? null;

      return activeRoute;
    }

    function Route({ element }) {
      return element;
    }

    function Navigate({ to }) {
      globalThis.history.replaceState({}, "", to);
      return null;
    }

    function Link({ children, to, ...props }) {
      return (
        <a href={to} {...props}>
          {children}
        </a>
      );
    }

    return {
      BrowserRouter,
      Link,
      Navigate,
      Route,
      Routes,
      useNavigate: () => jest.fn(),
    };
  },
  { virtual: true }
);

describe("App routes", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("renders the login page on the default route", () => {
    window.history.pushState({}, "", "/");
    const App = require("./App").default;

    render(<App />);

    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /create one/i })).toHaveAttribute(
      "href",
      "/register"
    );
  });

  test("renders the register page on /register", () => {
    window.history.pushState({}, "", "/register");
    const App = require("./App").default;

    render(<App />);

    expect(
      screen.getByRole("heading", { name: /create account/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute(
      "href",
      "/login"
    );
  });
});
