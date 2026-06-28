import { Skeleton } from '@/components/ui/skeleton';

/** Right-aligned pill standing in for a user message. */
function UserSkeleton({ width }: { width: string }) {
  return (
    <div className='flex justify-end'>
      <Skeleton className={`h-10 rounded-3xl rounded-br-md ${width}`} />
    </div>
  );
}

/** Label glyph + a few prose lines standing in for an assistant reply. */
function AssistantSkeleton({ lines }: { lines: string[] }) {
  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center gap-2'>
        <Skeleton className='size-5 rounded-md' />
        <Skeleton className='h-3 w-16' />
      </div>
      <div className='space-y-2'>
        {lines.map((w, i) => (
          <Skeleton key={i} className={`h-4 ${w}`} />
        ))}
      </div>
    </div>
  );
}

export function ChatThreadSkeleton() {
  return (
    <div className='flex-1 overflow-hidden'>
      <div className='mx-auto flex min-w-0 max-w-3xl flex-col gap-6 px-4 py-6'>
        <UserSkeleton width='w-44' />
        <AssistantSkeleton lines={['w-full', 'w-[94%]', 'w-[82%]']} />
        <UserSkeleton width='w-60' />
        <AssistantSkeleton
          lines={['w-[88%]', 'w-full', 'w-[70%]', 'w-[45%]']}
        />
      </div>
    </div>
  );
}
