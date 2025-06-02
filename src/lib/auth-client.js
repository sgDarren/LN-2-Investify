import { createAuthClient } from "better-auth/svelte";
import { AUTH_BASE_URL } from '$env/static/public';

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL 
});