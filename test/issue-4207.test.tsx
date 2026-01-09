import { act, render, screen, waitFor } from "@testing-library/react";
import useSWRImmutable from "swr/immutable";
import { SWRConfig } from "swr";
import React from "react";

describe("useSWRImmutable Bug Repro", () => {
  it("should ignore global refreshInterval", async () => {
    let fetchCount = 0;
    const fetcher = () => {
      fetchCount++;
      return "data";
    };

    function Page() {
      const { data } = useSWRImmutable("key", fetcher);
      return <div>{data}</div>;
    }

    render(
      <SWRConfig value={{ 
          refreshInterval: 100, 
          dedupingInterval: 0, // <--- CRITICAL: Allow immediate re-fetching
          dedupingInterval: 0,
          provider: () => new Map() 
      }}>
        <Page />
      </SWRConfig>
    );

    // Wait for first render
    await screen.findByText("data");
    expect(fetchCount).toBe(1);

    // Wait 300ms. 
    // If bug exists: SWR will refresh ~3 times (fetchCount = 4)
    // If fixed: SWR will do nothing (fetchCount = 1)
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    // This Expectation will FAIL if the bug is present
    expect(fetchCount).toBe(1);
  });
});
