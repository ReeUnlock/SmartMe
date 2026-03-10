import { useNavigate } from "react-router-dom";
import AchievementsPage from "./AchievementsPage";

export default function AchievementsPageWrapper() {
  const navigate = useNavigate();
  return <AchievementsPage onBack={() => navigate("/")} />;
}
