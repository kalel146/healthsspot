import { useLocation, useNavigate } from "react-router-dom";

export const useTierFilter = (defaultTier = "Free") => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);

  const tier = query.get("tier") || defaultTier;

  const setTier = (newTier) => {
    query.set("tier", newTier);
    navigate({ search: query.toString() }, { replace: true });
  };

  return { tier, setTier };
};
