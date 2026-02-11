import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/preact";
import PhraseCard from "./PhraseCard";
import { makePhrase, makeFullPhrase } from "../test/helpers";

describe("PhraseCard", () => {
  it("renders phrase text and meanings", () => {
    const phrase = makePhrase({ phrase: "ephemeral", meanings: ["lasting a short time"] });
    render(<PhraseCard phrase={phrase} />);

    expect(screen.getByText("ephemeral")).toBeInTheDocument();
    expect(screen.getByText("lasting a short time")).toBeInTheDocument();
  });

  it("renders multiple meanings joined with /", () => {
    const phrase = makePhrase({ phrase: "test", meanings: ["meaning one", "meaning two"] });
    render(<PhraseCard phrase={phrase} />);

    expect(screen.getByText("meaning one / meaning two")).toBeInTheDocument();
  });

  it("links to phrase detail page", () => {
    const phrase = makePhrase({ id: "abc-123" });
    render(<PhraseCard phrase={phrase} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/phrases/abc-123");
  });

  it("renders source and tags when present", () => {
    const phrase = makeFullPhrase({ source: "GRE Book", tags: ["vocab", "gre"] });
    render(<PhraseCard phrase={phrase} />);

    expect(screen.getByText("GRE Book")).toBeInTheDocument();
    expect(screen.getByText("vocab")).toBeInTheDocument();
    expect(screen.getByText("gre")).toBeInTheDocument();
  });

  it("hides source and tags when absent", () => {
    const phrase = makePhrase({ source: null, tags: [] });
    render(<PhraseCard phrase={phrase} />);

    // Source and tags sections should not be rendered
    const container = screen.getByRole("link");
    expect(container.querySelectorAll(".bg-gray-100")).toHaveLength(0);
  });
});
