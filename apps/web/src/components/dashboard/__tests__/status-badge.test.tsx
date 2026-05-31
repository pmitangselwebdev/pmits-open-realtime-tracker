import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { StatusBadge } from "../status-badge"

describe("StatusBadge", () => {
  it("renders online state", () => {
    render(<StatusBadge online={true} />)
    expect(screen.getByText("Online")).toBeInTheDocument()
  })

  it("renders offline state", () => {
    render(<StatusBadge online={false} />)
    expect(screen.getByText("Offline")).toBeInTheDocument()
  })
})
