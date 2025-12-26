// import type { Context } from '@netlify/functions';

export default async (req: Request) => {
  const method = req.method;
  const contentType = req.headers.get('content-type');
  const origin = req.headers.get('origin');
  console.log(
    `[lcp netlify function] ${method} | Content-Type: ${contentType} | Origin: ${origin}`,
  );

  try {
    const body = await req.json();
    console.log('Body:', body);
  } catch {
    console.log('No body or malformed body');
  }

  return new Response();
};
