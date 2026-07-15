// Server Component — thin page
import { TrackOrderDetail } from "@/features/order/components/TrackOrderDetail";

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <TrackOrderDetail id={id} />;
}
