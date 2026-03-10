import { useNavigate } from "react-router-dom";
import ChallengesPage from "./ChallengesPage";

export default function ChallengesPageWrapper() {
  const navigate = useNavigate();
  return <ChallengesPage onBack={() => navigate("/")} />;
}
