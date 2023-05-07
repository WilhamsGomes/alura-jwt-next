// Arquitetura hexagonal

import { tokenService } from "../../services/auth/tokenService";

// Ports & Adapters
export async function HttpClient(fetchUrl, fetchOptions) {
  const options = {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    body: fetchOptions.body && JSON.stringify(fetchOptions.body),
  }
  return fetch(fetchUrl, options)
    .then(async (res) => {
      return {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        body: await res.json(),
      }
    })
    .then(async (res) => {
      if(!fetchOptions.refresh) return res;
      if(res.status !== 401) return res;

      const isServer = true;
      const currentRefreshToken = "TOKEN ATUAL"

      console.log("Middleware: Rodar código para atualizar o token");

      const refreshResponse = await HttpClient("http://localhost:3000/api/refresh", {
        method: isServer ? "PUT" : "GET",
        body: isServer ? { refresh_token: currentRefreshToken } : undefined,
      });

      const newAccessToken = refreshResponse.body.data.access_token;
      const newRefreshToken = refreshResponse.body.data.refresh_token;

      tokenService.save(newAccessToken)
  
      const retryResponse = await HttpClient(fetchUrl, {
        ...options,
        refresh:false,
        headers:{
          'Authorization': `Bearer ${newAccessToken}`
        }
      })
      
      return retryResponse;
    });
}
