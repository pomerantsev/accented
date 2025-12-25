import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  // Log every request that hits the server
  const method = context.request.method;
  const pathname = context.url.pathname;
  const contentType = context.request.headers.get('content-type');
  const origin = context.request.headers.get('origin');

  console.log(
    `[Middleware] ${method} ${pathname} | Content-Type: ${contentType} | Origin: ${origin}`,
  );

  return next();
});
