"use client";

import { useState, useEffect } from "react";

/**
 * 클라이언트에서 마운트된 이후에만 true를 반환합니다.
 * Hydration 불일치를 피하기 위해, 마운트 전까지는 서버와 동일한 placeholder를 렌더링할 때 사용하세요.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
