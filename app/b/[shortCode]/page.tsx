import BattlePageClient from "@/components/battle/battle-page-client";

type PageProps = {
  params: Promise<{ shortCode: string }>;
};

export default async function PublicBattlePage({ params }: PageProps) {
  const { shortCode } = await params;
  return <BattlePageClient shortCode={shortCode} />;
}
