import { isRouteErrorResponse, useRouteError } from 'react-router';

export function ErrorBoundary() {
  const error = useRouteError();

  const { title, message } = resolveError(error);

  return (
    <div className='flex min-h-svh flex-col items-center justify-center gap-2 p-6 text-center'>
      <h1 className='text-2xl font-semibold'>{title}</h1>
      <p className='text-muted-foreground text-sm'>{message}</p>
    </div>
  );
}

function resolveError(error: unknown): { title: string; message: string } {
  if (isRouteErrorResponse(error)) {
    return {
      title: `${error.status} ${error.statusText}`,
      message: typeof error.data === 'string' ? error.data : 'Something went wrong.',
    };
  }
  if (error instanceof Error) {
    return { title: 'Something went wrong', message: error.message };
  }
  return { title: 'Something went wrong', message: 'An unknown error occurred.' };
}
