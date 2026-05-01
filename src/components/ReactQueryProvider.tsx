"use client";

import { PropsWithChildren, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/react-query/queryClient";

export default function ReactQueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () => createQueryClient(),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
