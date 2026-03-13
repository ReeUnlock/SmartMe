import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SimpleGrid } from "@chakra-ui/react";
import { getPlans, createCheckoutSession } from "../../api/billing";
import PricingCard from "./PricingCard";
import SmartMeLoader from "../common/SmartMeLoader";

export default function PricingSection({ currentPlan = "free" }) {
  const [upgrading, setUpgrading] = useState(false);

  const { data: plans, isLoading } = useQuery({
    queryKey: ["billing", "plans"],
    queryFn: getPlans,
    staleTime: 60 * 60 * 1000,
  });

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch {
      setUpgrading(false);
    }
  };

  if (isLoading || !plans) {
    return <SmartMeLoader color="rose.400" label={"Ładowanie planów..."} />;
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
      <PricingCard plan={plans.free} isCurrent={currentPlan === "free"} />
      <PricingCard
        plan={plans.pro}
        isCurrent={currentPlan === "pro"}
        onUpgrade={handleUpgrade}
        isLoading={upgrading}
      />
    </SimpleGrid>
  );
}
