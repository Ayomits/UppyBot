import type { HTMLAttributes } from "react";
import { HEADER_MARGIN } from "./header";

export function AppMain({
  withHeader,
  ...props
}: { withHeader: boolean } & HTMLAttributes<HTMLDivElement>) {
  return (
    <main
      style={{
        marginTop: withHeader ? HEADER_MARGIN : 0,
        ...props.style,
      }}
      {...props}
    />
  );
}
