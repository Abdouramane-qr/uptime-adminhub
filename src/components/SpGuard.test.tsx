import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import SpGuard from "./SpGuard";

const mockUseRole = vi.fn();

vi.mock("@/hooks/useRole", () => ({
  useRole: () => mockUseRole(),
}));

const renderWithRouter = (ui: ReactNode, initialEntries = ["/sp/dashboard"]) =>
  render(
    <MemoryRouter initialEntries={initialEntries} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {ui}
    </MemoryRouter>,
  );

describe("SpGuard", () => {
  beforeEach(() => {
    mockUseRole.mockReset();
  });

  it("renders children for service-provider users", () => {
    mockUseRole.mockReturnValue({
      roles: ["user"],
      loading: false,
      hasAnyRole: (role: string) => role === "user",
    });

    renderWithRouter(
      <SpGuard>
        <div>SP Content</div>
      </SpGuard>,
    );

    expect(screen.getByText("SP Content")).toBeInTheDocument();
  });

  it("allows onboarding route without assigned role", () => {
    mockUseRole.mockReturnValue({
      roles: [],
      loading: false,
      hasAnyRole: () => false,
    });

    renderWithRouter(
      <SpGuard>
        <div>SP Onboarding</div>
      </SpGuard>,
      ["/sp/onboarding"],
    );

    expect(screen.getByText("SP Onboarding")).toBeInTheDocument();
  });

  it("blocks non-sp roles from the workspace", () => {
    mockUseRole.mockReturnValue({
      roles: ["admin"],
      loading: false,
      hasAnyRole: () => false,
    });

    renderWithRouter(
      <SpGuard>
        <div>SP Content</div>
      </SpGuard>,
    );

    expect(screen.queryByText("SP Content")).not.toBeInTheDocument();
    expect(screen.getByText("SP workspace restricted")).toBeInTheDocument();
  });
});
