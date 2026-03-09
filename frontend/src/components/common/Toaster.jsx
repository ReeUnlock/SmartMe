import { Toaster as ArkToaster } from "@ark-ui/react/toast";
import {
  ToastCloseTrigger,
  ToastDescription,
  ToastIndicator,
  ToastRoot,
  ToastTitle,
  createToaster,
} from "@chakra-ui/react";

export const toaster = createToaster({
  placement: "top",
  pauseOnPageIdle: true,
});

export function Toaster() {
  return (
    <ArkToaster toaster={toaster}>
      {(toast) => (
        <ToastRoot>
          <ToastIndicator />
          <ToastTitle>{toast.title}</ToastTitle>
          <ToastDescription>{toast.description}</ToastDescription>
          <ToastCloseTrigger />
        </ToastRoot>
      )}
    </ArkToaster>
  );
}
