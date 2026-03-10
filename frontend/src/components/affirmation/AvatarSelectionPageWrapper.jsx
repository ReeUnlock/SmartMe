import { useNavigate } from "react-router-dom";
import AvatarSelectionPage from "./AvatarSelectionPage";

export default function AvatarSelectionPageWrapper() {
  const navigate = useNavigate();
  return <AvatarSelectionPage onBack={() => navigate("/odznaki")} />;
}
