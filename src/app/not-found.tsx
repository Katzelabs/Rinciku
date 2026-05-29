import { Link } from 'react-router';

export function NotFound() {
  return (
    <div className='flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center'>
      <h1 className='text-2xl font-semibold'>404</h1>
      <p className='text-muted-foreground text-sm'>This page could not be found.</p>
      <Link to='/' className='text-sm underline-offset-4 hover:underline'>
        Back to home
      </Link>
    </div>
  );
}
