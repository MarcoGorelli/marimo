/* Copyright 2024 Marimo. All rights reserved. */
import { type RefObject, useEffect } from "react";

import { parseShortcut } from "../core/hotkeys/shortcuts";
import { useEventListener } from "./useEventListener";
import { useEvent } from "./useEvent";
import { useSetRegisteredAction } from "../core/hotkeys/actions";
import type { HotkeyAction } from "@/core/hotkeys/hotkeys";
import { Objects } from "@/utils/objects";
import { Logger } from "@/utils/Logger";
import { Functions } from "@/utils/functions";
import { hotkeysAtom } from "@/core/config/config";
import { useAtomValue } from "jotai";

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
type HotkeyHandler = () => boolean | void | undefined | Promise<void>;

/**
 * Registers a hotkey listener for the given shortcut.
 *
 * @param callback The callback to run when the shortcut is pressed. It does not need to be memoized as this hook will always use the latest callback.
 * If the callback returns false, preventDefault will not be called on the event.
 */
export function useHotkey(shortcut: HotkeyAction, callback: HotkeyHandler) {
  const { registerAction, unregisterAction } = useSetRegisteredAction();
  const hotkeys = useAtomValue(hotkeysAtom);

  const isNOOP = callback === Functions.NOOP;
  const memoizeCallback = useEvent(() => callback());

  const listener = useEvent((e: KeyboardEvent) => {
    const key = hotkeys.getHotkey(shortcut).key;
    if (parseShortcut(key)(e)) {
      const response = callback();
      // Prevent default if the callback does not return false
      if (response !== false) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  });

  // Register keydown listener
  useEventListener(document, "keydown", listener);

  // Register with the shortcut registry
  useEffect(() => {
    if (!isNOOP) {
      registerAction(shortcut, memoizeCallback);
      return () => unregisterAction(shortcut);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoizeCallback, shortcut, isNOOP]);
}

/**
 * Registers a hotkey listener on a given element or ref to an element.
 */
export function useHotkeysOnElement<T extends HotkeyAction>(
  element: HTMLElement | RefObject<HTMLElement> | null,
  handlers: Record<T, HotkeyHandler>,
) {
  const hotkeys = useAtomValue(hotkeysAtom);
  useEventListener(element, "keydown", (e) => {
    for (const [shortcut, callback] of Objects.entries(handlers)) {
      const key = hotkeys.getHotkey(shortcut).key;
      if (parseShortcut(key)(e)) {
        Logger.debug("Satisfied", key, e);
        const response = callback();
        // Prevent default if the callback does not return false
        if (response !== false) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    }
  });
}

/**
 * Registers a hotkey listener on a given element or ref to an element.
 */
export function useKeydownOnElement(
  element: HTMLElement | RefObject<HTMLElement> | null,
  handlers: Record<string, HotkeyHandler>,
) {
  useEventListener(element, "keydown", (e) => {
    for (const [key, callback] of Objects.entries(handlers)) {
      if (parseShortcut(key)(e)) {
        Logger.debug("Satisfied", key, e);
        const response = callback();
        // Prevent default if the callback does not return false
        if (response !== false) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    }
  });
}
