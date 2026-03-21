import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SimpleGrid } from "@chakra-ui/react";
import { getPlans, createCheckoutSession } from "../../api/billing";
import PricingCard from "./PricingCard";
import SmartMeLoader from "../common/SmartMeLoader";

export default function PricingSection({ currentPlan = "free" }) {
  const [upgradingTier, setUpgradingTier] = useState(null);

  const { data: plans, isLoading } = useQuery({
    queryKey: ["billing", "plans"],
    queryFn: getPlans,
    staleTime: 60 * 60 * 1000,
  });

  const handleUpgrade = async (priceId) => {
    setUpgradingTier(priceId);
    try {
      const { url } = await createCheckoutSession(priceId);
      window.location.href = url;
    } catch {
      setUpgradingTier(null);
    }
  };

  if (isLoading || !plans) {
    return <SmartMeLoader color="rose.400" label={"Ładowanie planów..."} />;
  }

  const tiers = plans.pro.pricing_tiers || [];

  return (
    <SimpleGrid columns={{ base: 1, md: tiers.length > 0 ? 3 : 2 }} gap={6}>
      <PricingCard plan={plans.free} isCurrent={currentPlan === "free"} />
      {tiers.map((tier) => (
        <PricingCard
          key={tier.period}
          plan={plans.pro}
          tier={tier}
          isCurrent={currentPlan === "pro"}
          onUpgrade={() => handleUpgrade(tier.price_id)}
          isLoading={upgradingTier === tier.price_id}
        />
      ))}
      {tiers.length === 0 && (
        <PricingCard
          plan={plans.pro}
          isCurrent={currentPlan === "pro"}
          onUpgrade={() => handleUpgrade()}
          isLoading={!!upgradingTier}
        />
      )}
    </SimpleGrid>
  );
}
