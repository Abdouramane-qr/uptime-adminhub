declare module "@lovable.dev/cloud-auth-js" {
  interface OAuthResult {
    redirected?: boolean;
    error?: Error;
    tokens?: { access_token: string; refresh_token: string };
  }

  interface LovableAuth {
    signInWithOAuth(
      provider: string,
      options?: {
        redirect_uri?: string;
        extraParams?: Record<string, string>;
      }
    ): Promise<OAuthResult>;
  }

  export function createLovableAuth(): LovableAuth;
}
