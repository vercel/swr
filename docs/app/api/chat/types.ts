import type { InferUITools, UIMessage } from "ai";
import { z } from "zod/v3";
import type { createTools } from "./tools";

const dataPartsSchema = z.object({
  "stream-end": z.object({
    message: z.string(),
  }),
  notification: z.object({
    message: z.string(),
  }),
});

type MyDataParts = z.infer<typeof dataPartsSchema>;

export type MyTools = InferUITools<ReturnType<typeof createTools>>;

type MessageMetadata = {
  isPageContext?: boolean;
  pageContext?: {
    title: string;
    url: string;
  };
};

export type MyUIMessage = UIMessage<MessageMetadata, MyDataParts, MyTools>;
