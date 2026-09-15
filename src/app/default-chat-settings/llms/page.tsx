import type { Metadata } from "next";
import { DefaultLlmPickerRoute } from "./picker-client";

export const metadata: Metadata = { title: "LLMs - ISEKAI ZERO" };

export default function DefaultLlmsRoute() {
  return <DefaultLlmPickerRoute />;
}
