import dynamic from 'next/dynamic';

const EventTracker = dynamic(() => import('@/components/EventTracker'), { ssr: false });

export default function Home() {
  return <EventTracker />;
}
