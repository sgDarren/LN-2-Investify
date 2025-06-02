import { createAuthClient } from "better-auth/svelte";
import { PUBLIC_AUTH_BASE_URL } from '$env/static/public';

export const authClient = createAuthClient({
  baseURL: PUBLIC_AUTH_BASE_URL
});